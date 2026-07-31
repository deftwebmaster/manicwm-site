/* ============================================
   db.js — IndexedDB wrapper
   Single store per entity, ID-keyed
   ============================================ */

const DB_NAME = 'client_tracker';
const DB_VERSION = 1;
const STORES = ['clients', 'projects', 'quotes', 'touches', 'meta'];

let _db = null;

function openDB() {
  if (_db) return Promise.resolve(_db);
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onerror = () => reject(req.error);
    req.onsuccess = () => { _db = req.result; resolve(_db); };
    req.onupgradeneeded = (e) => {
      const db = e.target.result;
      STORES.forEach(name => {
        if (!db.objectStoreNames.contains(name)) {
          const store = db.createObjectStore(name, { keyPath: name === 'meta' ? 'key' : 'id' });
          if (name === 'projects' || name === 'quotes' || name === 'touches') {
            store.createIndex('clientId', 'clientId', { unique: false });
          }
          if (name === 'touches') {
            store.createIndex('projectId', 'projectId', { unique: false });
          }
        }
      });
    };
  });
}

function tx(storeName, mode = 'readonly') {
  return openDB().then(db => db.transaction(storeName, mode).objectStore(storeName));
}

const DB = {
  // Generic CRUD
  async getAll(store) {
    const s = await tx(store);
    return new Promise((res, rej) => {
      const req = s.getAll();
      req.onsuccess = () => res(req.result);
      req.onerror = () => rej(req.error);
    });
  },

  async get(store, id) {
    const s = await tx(store);
    return new Promise((res, rej) => {
      const req = s.get(id);
      req.onsuccess = () => res(req.result);
      req.onerror = () => rej(req.error);
    });
  },

  async put(store, item) {
    const s = await tx(store, 'readwrite');
    return new Promise((res, rej) => {
      const req = s.put(item);
      req.onsuccess = () => res(item);
      req.onerror = () => rej(req.error);
    });
  },

  async delete(store, id) {
    const s = await tx(store, 'readwrite');
    return new Promise((res, rej) => {
      const req = s.delete(id);
      req.onsuccess = () => res();
      req.onerror = () => rej(req.error);
    });
  },

  async getByIndex(store, indexName, value) {
    const s = await tx(store);
    return new Promise((res, rej) => {
      const idx = s.index(indexName);
      const req = idx.getAll(value);
      req.onsuccess = () => res(req.result);
      req.onerror = () => rej(req.error);
    });
  },

  // ID generation: cli_2026_001
  async nextId(prefix) {
    const year = new Date().getFullYear();
    const metaKey = `seq_${prefix}_${year}`;
    const meta = await this.get('meta', metaKey);
    const next = (meta?.value || 0) + 1;
    await this.put('meta', { key: metaKey, value: next });
    return `${prefix}_${year}_${String(next).padStart(3, '0')}`;
  },

  // Settings
  async getSettings() {
    const m = await this.get('meta', 'settings');
    return m?.value || {
      businessName: 'Deftwebmaster',
      currency: 'USD',
      defaultQuoteExpirationDays: 30,
      referralSources: ['Google', 'Referral', 'Facebook', 'Walk-in', 'Past client']
    };
  },

  async saveSettings(settings) {
    return this.put('meta', { key: 'settings', value: settings });
  },

  // Export everything
  async exportAll() {
    const [clients, projects, quotes, touches, settings] = await Promise.all([
      this.getAll('clients'),
      this.getAll('projects'),
      this.getAll('quotes'),
      this.getAll('touches'),
      this.getSettings()
    ]);
    return {
      version: '0.1',
      exportedAt: new Date().toISOString(),
      clients, projects, quotes, touches, settings
    };
  },

  // Import (replaces everything — caller should confirm)
  async importAll(data) {
    if (!data || data.version !== '0.1') {
      throw new Error('Unrecognized backup format');
    }
    const db = await openDB();
    const t = db.transaction(STORES, 'readwrite');
    return new Promise((resolve, reject) => {
      t.oncomplete = () => resolve();
      t.onerror = () => reject(t.error);

      // Clear all stores
      STORES.forEach(name => t.objectStore(name).clear());

      // Repopulate
      (data.clients || []).forEach(c => t.objectStore('clients').put(c));
      (data.projects || []).forEach(p => t.objectStore('projects').put(p));
      (data.quotes || []).forEach(q => t.objectStore('quotes').put(q));
      (data.touches || []).forEach(tch => t.objectStore('touches').put(tch));
      if (data.settings) t.objectStore('meta').put({ key: 'settings', value: data.settings });
    });
  },

  async wipe() {
    const db = await openDB();
    const t = db.transaction(STORES, 'readwrite');
    STORES.forEach(name => t.objectStore(name).clear());
    return new Promise((res, rej) => {
      t.oncomplete = () => res();
      t.onerror = () => rej(t.error);
    });
  }
};

window.DB = DB;
