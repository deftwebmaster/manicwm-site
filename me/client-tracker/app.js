/* ============================================
   app.js — Views, routing, business logic
   ============================================ */

// ---------- Helpers ----------

const $ = (sel, el = document) => el.querySelector(sel);
const $$ = (sel, el = document) => [...el.querySelectorAll(sel)];

const fmt = {
  money(n) {
    const v = Number(n) || 0;
    return '$' + v.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 });
  },
  date(s) {
    if (!s) return '—';
    const d = new Date(s.length === 10 ? s + 'T00:00:00' : s);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  },
  dateShort(s) {
    if (!s) return '—';
    const d = new Date(s.length === 10 ? s + 'T00:00:00' : s);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  },
  daysFrom(s) {
    if (!s) return null;
    const d = new Date(s.length === 10 ? s + 'T00:00:00' : s);
    return Math.ceil((d - new Date()) / 86400000);
  },
  status(s) {
    return (s || '').replace(/_/g, ' ');
  }
};

function escapeHtml(s) {
  if (s == null) return '';
  return String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}

function toast(msg) {
  const t = $('#toast');
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(toast._t);
  toast._t = setTimeout(() => t.classList.remove('show'), 2200);
}

function nowISO() { return new Date().toISOString(); }
function todayISO() { return new Date().toISOString().slice(0, 10); }

// ---------- Modal ----------

function openModal({ title, body, footer = '', onMount }) {
  const container = $('#modal-container');
  container.innerHTML = `
    <div class="modal-backdrop">
      <div class="modal-sheet">
        <div class="modal-handle"></div>
        <div class="modal-header">
          <div class="modal-title">${escapeHtml(title)}</div>
          <button class="modal-close" data-close>Close</button>
        </div>
        <div class="modal-body">${body}</div>
        ${footer ? `<div class="modal-footer">${footer}</div>` : ''}
      </div>
    </div>
  `;
  const backdrop = $('.modal-backdrop', container);
  backdrop.addEventListener('click', e => {
    if (e.target === backdrop || e.target.matches('[data-close]')) closeModal();
  });
  if (onMount) onMount(container);
}

function closeModal() {
  $('#modal-container').innerHTML = '';
}

// ---------- Confirm dialog ----------

function confirmAction(message, onYes) {
  openModal({
    title: 'Confirm',
    body: `<p style="font-size:14px;line-height:1.5;">${escapeHtml(message)}</p>`,
    footer: `
      <div class="btn-row">
        <button class="btn btn-secondary" data-close style="flex:1">Cancel</button>
        <button class="btn btn-danger" data-confirm style="flex:1">Confirm</button>
      </div>
    `,
    onMount(c) {
      $('[data-confirm]', c).addEventListener('click', () => {
        closeModal();
        onYes();
      });
    }
  });
}

// ---------- Router ----------

const Router = {
  current: 'dashboard',
  state: {},

  go(view, state = {}) {
    this.current = view;
    this.state = state;
    this.render();
  },

  render() {
    $('#view-title').textContent = this.titleFor(this.current);
    $$('.nav-btn[data-view]').forEach(b => {
      b.classList.toggle('active', b.dataset.view === this.current);
    });
    Views[this.current](this.state);
  },

  titleFor(v) {
    return {
      dashboard: 'Dashboard',
      clients: 'Clients',
      projects: 'Projects',
      quotes: 'Quotes',
      'client-detail': 'Client',
      'project-detail': 'Project',
      'quote-detail': 'Quote'
    }[v] || 'Tracker';
  }
};

// ---------- Views ----------

const Views = {};

// === Dashboard ===
Views.dashboard = async () => {
  const container = $('#view-container');
  const [clients, projects, quotes] = await Promise.all([
    DB.getAll('clients'), DB.getAll('projects'), DB.getAll('quotes')
  ]);

  // Compute stats
  const activeClients = clients.filter(c => c.status === 'active' || c.status === 'quoted').length;
  const outstanding = projects
    .filter(p => p.status !== 'archived')
    .reduce((sum, p) => sum + ((p.invoicedAmount || 0) - (p.paidAmount || 0)), 0);
  const openQuoteTotal = quotes
    .filter(q => q.status === 'sent')
    .reduce((sum, q) => sum + (q.total || 0), 0);

  // This month invoiced
  const monthStart = new Date();
  monthStart.setDate(1);
  monthStart.setHours(0, 0, 0, 0);
  const thisMonthInvoiced = projects
    .filter(p => {
      const d = p.deliveredDate || p.startDate;
      return d && new Date(d) >= monthStart;
    })
    .reduce((sum, p) => sum + (p.invoicedAmount || 0), 0);

  // Domain expirations within 60 days
  const expSoon = clients
    .filter(c => c.webInfo?.domainExpiration)
    .map(c => ({ client: c, days: fmt.daysFrom(c.webInfo.domainExpiration) }))
    .filter(x => x.days !== null && x.days <= 60)
    .sort((a, b) => a.days - b.days);

  // Recent touches
  const touches = (await DB.getAll('touches'))
    .sort((a, b) => (b.date || '').localeCompare(a.date || ''))
    .slice(0, 5);
  const clientMap = Object.fromEntries(clients.map(c => [c.id, c]));

  // Active projects
  const activeProjects = projects
    .filter(p => ['accepted', 'in_progress', 'review'].includes(p.status))
    .sort((a, b) => (a.dueDate || 'z').localeCompare(b.dueDate || 'z'))
    .slice(0, 4);

  container.innerHTML = `
    <div class="stat-grid">
      <div class="stat accent">
        <div class="stat-label">Outstanding</div>
        <div class="stat-value">${fmt.money(outstanding)}</div>
        <div class="stat-sub">across active projects</div>
      </div>
      <div class="stat">
        <div class="stat-label">Open Quotes</div>
        <div class="stat-value">${fmt.money(openQuoteTotal)}</div>
        <div class="stat-sub">awaiting decision</div>
      </div>
      <div class="stat">
        <div class="stat-label">This Month</div>
        <div class="stat-value">${fmt.money(thisMonthInvoiced)}</div>
        <div class="stat-sub">invoiced</div>
      </div>
      <div class="stat">
        <div class="stat-label">Active Clients</div>
        <div class="stat-value">${activeClients}</div>
        <div class="stat-sub">${clients.length} total</div>
      </div>
    </div>

    ${expSoon.length ? `
      <div class="section-label">Domains expiring soon</div>
      ${expSoon.map(({ client, days }) => `
        <div class="card" data-client-id="${client.id}">
          <div class="card-row">
            <div>
              <div class="card-title">${escapeHtml(client.businessName || client.name)}</div>
              <div class="card-subtitle">${escapeHtml(client.webInfo.domain)} · ${fmt.date(client.webInfo.domainExpiration)}</div>
            </div>
            <span class="pill ${days <= 14 ? 'pill-declined' : 'pill-review'}">${days} days</span>
          </div>
        </div>
      `).join('')}
      <hr class="divider">
    ` : ''}

    ${activeProjects.length ? `
      <div class="section-label">Active projects</div>
      ${activeProjects.map(p => projectCard(p, clientMap[p.clientId])).join('')}
      <hr class="divider">
    ` : ''}

    <div class="section-label">Recent activity</div>
    ${touches.length ? touches.map(t => `
      <div class="touch-item" data-client-id="${t.clientId}">
        <div class="touch-meta">
          <span>${fmt.dateShort(t.date)}</span>
          <span>·</span>
          <span>${escapeHtml(t.type)}</span>
          <span>·</span>
          <span>${escapeHtml(clientMap[t.clientId]?.name || 'Unknown')}</span>
        </div>
        <div class="touch-note">${escapeHtml(t.note || '')}</div>
      </div>
    `).join('') : '<div class="empty"><div class="empty-text">No activity logged yet</div></div>'}
  `;

  container.addEventListener('click', e => {
    const card = e.target.closest('[data-client-id]');
    if (card) Router.go('client-detail', { id: card.dataset.clientId });
  });
};

function projectCard(p, client) {
  const balance = (p.invoicedAmount || 0) - (p.paidAmount || 0);
  return `
    <div class="card" data-project-id="${p.id}" onclick="Router.go('project-detail', { id: '${p.id}' })">
      <div class="card-row">
        <div style="flex:1;min-width:0">
          <div class="card-title">${escapeHtml(p.title)}</div>
          <div class="card-subtitle">${escapeHtml(client?.name || 'Unknown')} · ${escapeHtml(p.type.replace(/_/g, ' '))}</div>
        </div>
        <span class="pill pill-${p.status}">${fmt.status(p.status)}</span>
      </div>
      <div class="card-meta">
        ${p.dueDate ? `<span style="font-size:12px;color:var(--ink-soft)">Due ${fmt.dateShort(p.dueDate)}</span>` : ''}
        ${balance > 0 ? `<span style="font-size:12px;color:var(--warn)">${fmt.money(balance)} owed</span>` : ''}
      </div>
    </div>
  `;
}

// === Clients list ===
Views.clients = async () => {
  const container = $('#view-container');
  const clients = (await DB.getAll('clients')).sort((a, b) => a.name.localeCompare(b.name));

  container.innerHTML = `
    <input type="search" class="search-bar" placeholder="Search clients..." id="client-search">
    <div id="client-list">
      ${clients.length ? clients.map(clientCard).join('') : `
        <div class="empty">
          <div class="empty-title">No clients yet</div>
          <div class="empty-text">Tap + to add your first one</div>
        </div>
      `}
    </div>
  `;

  $('#client-search').addEventListener('input', e => {
    const q = e.target.value.toLowerCase();
    const filtered = clients.filter(c =>
      (c.name || '').toLowerCase().includes(q) ||
      (c.businessName || '').toLowerCase().includes(q) ||
      (c.email || '').toLowerCase().includes(q)
    );
    $('#client-list').innerHTML = filtered.length
      ? filtered.map(clientCard).join('')
      : '<div class="empty"><div class="empty-text">No matches</div></div>';
  });

  container.addEventListener('click', e => {
    const card = e.target.closest('[data-client-id]');
    if (card) Router.go('client-detail', { id: card.dataset.clientId });
  });
};

function clientCard(c) {
  return `
    <div class="card" data-client-id="${c.id}">
      <div class="card-row">
        <div style="flex:1;min-width:0">
          <div class="card-title">${escapeHtml(c.name)}</div>
          ${c.businessName ? `<div class="card-subtitle">${escapeHtml(c.businessName)}</div>` : ''}
        </div>
        <span class="pill pill-${c.status}">${fmt.status(c.status)}</span>
      </div>
    </div>
  `;
}

// === Projects list ===
Views.projects = async () => {
  const container = $('#view-container');
  const [projects, clients] = await Promise.all([DB.getAll('projects'), DB.getAll('clients')]);
  const clientMap = Object.fromEntries(clients.map(c => [c.id, c]));

  // Sort: active first, then by due date
  const order = ['in_progress', 'review', 'accepted', 'quoted', 'delivered', 'paid', 'archived'];
  projects.sort((a, b) => {
    const ai = order.indexOf(a.status), bi = order.indexOf(b.status);
    if (ai !== bi) return ai - bi;
    return (a.dueDate || 'z').localeCompare(b.dueDate || 'z');
  });

  container.innerHTML = projects.length
    ? projects.map(p => projectCard(p, clientMap[p.clientId])).join('')
    : `<div class="empty">
        <div class="empty-title">No projects yet</div>
        <div class="empty-text">Add a client first, then create a project</div>
      </div>`;
};

// === Quotes list ===
Views.quotes = async () => {
  const container = $('#view-container');
  const [quotes, clients] = await Promise.all([DB.getAll('quotes'), DB.getAll('clients')]);
  const clientMap = Object.fromEntries(clients.map(c => [c.id, c]));

  const order = ['sent', 'draft', 'accepted', 'declined', 'expired'];
  quotes.sort((a, b) => {
    const ai = order.indexOf(a.status), bi = order.indexOf(b.status);
    if (ai !== bi) return ai - bi;
    return (b.sentDate || '').localeCompare(a.sentDate || '');
  });

  container.innerHTML = quotes.length ? quotes.map(q => `
    <div class="card" onclick="Router.go('quote-detail', { id: '${q.id}' })">
      <div class="card-row">
        <div style="flex:1;min-width:0">
          <div class="card-title">${fmt.money(q.total)}</div>
          <div class="card-subtitle">${escapeHtml(clientMap[q.clientId]?.name || 'Unknown')} · sent ${fmt.dateShort(q.sentDate)}</div>
        </div>
        <span class="pill pill-${q.status}">${fmt.status(q.status)}</span>
      </div>
    </div>
  `).join('') : `<div class="empty">
    <div class="empty-title">No quotes yet</div>
    <div class="empty-text">Send your first quote to track close rate</div>
  </div>`;
};

// === Client detail ===
Views['client-detail'] = async ({ id }) => {
  const container = $('#view-container');
  const client = await DB.get('clients', id);
  if (!client) { Router.go('clients'); return; }

  const [projects, touches] = await Promise.all([
    DB.getByIndex('projects', 'clientId', id),
    DB.getByIndex('touches', 'clientId', id)
  ]);
  touches.sort((a, b) => (b.date || '').localeCompare(a.date || ''));
  projects.sort((a, b) => (b.startDate || '').localeCompare(a.startDate || ''));

  const w = client.webInfo || {};
  const b = client.brandKit || {};
  const expDays = fmt.daysFrom(w.domainExpiration);

  container.innerHTML = `
    <div class="detail-header">
      <div class="detail-name">${escapeHtml(client.name)}</div>
      ${client.businessName ? `<div class="detail-sub">${escapeHtml(client.businessName)}</div>` : ''}
      <div class="detail-actions">
        ${client.phone ? `<a class="btn btn-secondary" href="tel:${escapeHtml(client.phone)}">Call</a>` : ''}
        ${client.phone ? `<a class="btn btn-secondary" href="sms:${escapeHtml(client.phone)}">Text</a>` : ''}
        ${client.email ? `<a class="btn btn-secondary" href="mailto:${escapeHtml(client.email)}">Email</a>` : ''}
        <button class="btn btn-primary" id="add-touch">+ Touch</button>
      </div>
    </div>

    <div class="detail-section">
      <div class="section-label">Contact</div>
      <div class="kv-list">
        <div class="kv-row"><span class="kv-label">Status</span><span class="kv-value"><span class="pill pill-${client.status}">${fmt.status(client.status)}</span></span></div>
        ${client.phone ? `<div class="kv-row"><span class="kv-label">Phone</span><span class="kv-value">${escapeHtml(client.phone)}</span></div>` : ''}
        ${client.email ? `<div class="kv-row"><span class="kv-label">Email</span><span class="kv-value">${escapeHtml(client.email)}</span></div>` : ''}
        ${client.preferredContact ? `<div class="kv-row"><span class="kv-label">Prefers</span><span class="kv-value">${escapeHtml(client.preferredContact)}</span></div>` : ''}
        ${client.referralSource ? `<div class="kv-row"><span class="kv-label">Found via</span><span class="kv-value">${escapeHtml(client.referralSource)}</span></div>` : ''}
        ${client.address ? `<div class="kv-row"><span class="kv-label">Address</span><span class="kv-value">${escapeHtml(client.address)}</span></div>` : ''}
      </div>
    </div>

    ${client.notes ? `
      <div class="detail-section">
        <div class="section-label">Notes</div>
        <div class="card" style="white-space:pre-wrap;font-size:14px;line-height:1.5">${escapeHtml(client.notes)}</div>
      </div>
    ` : ''}

    ${(w.domain || w.registrar || w.hostingProvider) ? `
      <div class="detail-section">
        <div class="section-label">Web</div>
        <div class="kv-list">
          ${w.domain ? `<div class="kv-row"><span class="kv-label">Domain</span><span class="kv-value"><a href="https://${escapeHtml(w.domain)}" target="_blank">${escapeHtml(w.domain)}</a></span></div>` : ''}
          ${w.domainExpiration ? `<div class="kv-row"><span class="kv-label">Expires</span><span class="kv-value">${fmt.date(w.domainExpiration)}${expDays !== null && expDays <= 60 ? ` <span class="pill ${expDays <= 14 ? 'pill-declined' : 'pill-review'}">${expDays}d</span>` : ''}</span></div>` : ''}
          ${w.registrar ? `<div class="kv-row"><span class="kv-label">Registrar</span><span class="kv-value">${escapeHtml(w.registrar)}</span></div>` : ''}
          ${w.hostingProvider ? `<div class="kv-row"><span class="kv-label">Hosting</span><span class="kv-value">${escapeHtml(w.hostingProvider)}</span></div>` : ''}
          ${w.dnsManagedAt ? `<div class="kv-row"><span class="kv-label">DNS</span><span class="kv-value">${escapeHtml(w.dnsManagedAt)}</span></div>` : ''}
          ${w.stack ? `<div class="kv-row"><span class="kv-label">Stack</span><span class="kv-value">${escapeHtml(w.stack)}</span></div>` : ''}
          ${w.adminLoginLocation ? `<div class="kv-row"><span class="kv-label">Admin login</span><span class="kv-value">${escapeHtml(w.adminLoginLocation)}</span></div>` : ''}
          ${w.retainerMonthly ? `<div class="kv-row"><span class="kv-label">Retainer</span><span class="kv-value money">${fmt.money(w.retainerMonthly)}/mo</span></div>` : ''}
        </div>
      </div>
    ` : ''}

    ${(b.primaryColor || b.displayFont || b.tagline) ? `
      <div class="detail-section">
        <div class="section-label">Brand kit</div>
        <div class="kv-list">
          ${b.primaryColor ? `<div class="kv-row"><span class="kv-label">Primary</span><span class="kv-value"><span style="display:inline-block;width:14px;height:14px;border-radius:3px;background:${escapeHtml(b.primaryColor)};vertical-align:middle;margin-right:6px;border:1px solid var(--line)"></span>${escapeHtml(b.primaryColor)}</span></div>` : ''}
          ${b.secondaryColor ? `<div class="kv-row"><span class="kv-label">Secondary</span><span class="kv-value"><span style="display:inline-block;width:14px;height:14px;border-radius:3px;background:${escapeHtml(b.secondaryColor)};vertical-align:middle;margin-right:6px;border:1px solid var(--line)"></span>${escapeHtml(b.secondaryColor)}</span></div>` : ''}
          ${b.displayFont ? `<div class="kv-row"><span class="kv-label">Display font</span><span class="kv-value">${escapeHtml(b.displayFont)}</span></div>` : ''}
          ${b.bodyFont ? `<div class="kv-row"><span class="kv-label">Body font</span><span class="kv-value">${escapeHtml(b.bodyFont)}</span></div>` : ''}
          ${b.logoLocation ? `<div class="kv-row"><span class="kv-label">Logo</span><span class="kv-value">${escapeHtml(b.logoLocation)}</span></div>` : ''}
          ${b.tagline ? `<div class="kv-row"><span class="kv-label">Tagline</span><span class="kv-value">${escapeHtml(b.tagline)}</span></div>` : ''}
          ${b.voiceNotes ? `<div class="kv-row"><span class="kv-label">Voice</span><span class="kv-value">${escapeHtml(b.voiceNotes)}</span></div>` : ''}
        </div>
      </div>
    ` : ''}

    <div class="detail-section">
      <div class="section-label">Projects (${projects.length})</div>
      ${projects.length ? projects.map(p => projectCard(p, client)).join('') : `
        <div class="card" style="text-align:center;color:var(--ink-faint);font-size:13px">No projects yet</div>
      `}
      <button class="btn btn-secondary btn-block" id="add-project" style="margin-top:8px">+ New project</button>
    </div>

    <div class="detail-section">
      <div class="section-label">Activity (${touches.length})</div>
      ${touches.length ? touches.slice(0, 10).map(t => `
        <div class="touch-item">
          <div class="touch-meta">
            <span>${fmt.dateShort(t.date)}</span>
            <span>·</span>
            <span>${escapeHtml(t.type)}</span>
          </div>
          <div class="touch-note">${escapeHtml(t.note || '')}</div>
        </div>
      `).join('') : '<div class="card" style="text-align:center;color:var(--ink-faint);font-size:13px">No activity yet</div>'}
    </div>

    <div class="btn-row">
      <button class="btn btn-secondary" id="edit-client" style="flex:1">Edit</button>
      <button class="btn btn-danger" id="delete-client" style="flex:1">Delete</button>
    </div>
  `;

  $('#add-touch').addEventListener('click', () => Forms.touch({ clientId: id }));
  $('#add-project').addEventListener('click', () => Forms.project({ clientId: id }));
  $('#edit-client').addEventListener('click', () => Forms.client(client));
  $('#delete-client').addEventListener('click', () => {
    confirmAction(`Delete ${client.name}? This will also delete all their projects, quotes, and activity.`, async () => {
      const projs = await DB.getByIndex('projects', 'clientId', id);
      const quotes = await DB.getByIndex('quotes', 'clientId', id);
      const tchs = await DB.getByIndex('touches', 'clientId', id);
      await Promise.all([
        ...projs.map(p => DB.delete('projects', p.id)),
        ...quotes.map(q => DB.delete('quotes', q.id)),
        ...tchs.map(t => DB.delete('touches', t.id)),
        DB.delete('clients', id)
      ]);
      toast('Client deleted');
      Router.go('clients');
    });
  });
};

// === Project detail ===
Views['project-detail'] = async ({ id }) => {
  const container = $('#view-container');
  const project = await DB.get('projects', id);
  if (!project) { Router.go('projects'); return; }
  const client = await DB.get('clients', project.clientId);
  const balance = (project.invoicedAmount || 0) - (project.paidAmount || 0);

  container.innerHTML = `
    <div class="detail-header">
      <div class="detail-name">${escapeHtml(project.title)}</div>
      <div class="detail-sub">
        ${escapeHtml(client?.name || 'Unknown')} ·
        <span class="pill pill-${project.status}">${fmt.status(project.status)}</span>
      </div>
    </div>

    ${project.description ? `
      <div class="detail-section">
        <div class="card" style="font-size:14px;line-height:1.5;white-space:pre-wrap">${escapeHtml(project.description)}</div>
      </div>
    ` : ''}

    <div class="detail-section">
      <div class="section-label">Money</div>
      <div class="kv-list">
        <div class="kv-row"><span class="kv-label">Quoted</span><span class="kv-value money">${fmt.money(project.quotedPrice)}</span></div>
        <div class="kv-row"><span class="kv-label">Invoiced</span><span class="kv-value money">${fmt.money(project.invoicedAmount)}</span></div>
        <div class="kv-row"><span class="kv-label">Paid</span><span class="kv-value money">${fmt.money(project.paidAmount)}</span></div>
        <div class="kv-row"><span class="kv-label">Balance</span><span class="kv-value money" style="color:${balance > 0 ? 'var(--warn)' : 'var(--ink)'}">${fmt.money(balance)}</span></div>
      </div>
    </div>

    <div class="detail-section">
      <div class="section-label">Timeline</div>
      <div class="kv-list">
        <div class="kv-row"><span class="kv-label">Type</span><span class="kv-value">${escapeHtml(project.type.replace(/_/g, ' '))}</span></div>
        ${project.startDate ? `<div class="kv-row"><span class="kv-label">Started</span><span class="kv-value">${fmt.date(project.startDate)}</span></div>` : ''}
        ${project.dueDate ? `<div class="kv-row"><span class="kv-label">Due</span><span class="kv-value">${fmt.date(project.dueDate)}</span></div>` : ''}
        ${project.deliveredDate ? `<div class="kv-row"><span class="kv-label">Delivered</span><span class="kv-value">${fmt.date(project.deliveredDate)}</span></div>` : ''}
        ${project.liveUrl ? `<div class="kv-row"><span class="kv-label">Live URL</span><span class="kv-value"><a href="${escapeHtml(project.liveUrl)}" target="_blank">${escapeHtml(project.liveUrl)}</a></span></div>` : ''}
      </div>
    </div>

    ${project.assetLinks?.length ? `
      <div class="detail-section">
        <div class="section-label">Assets</div>
        <div class="kv-list">
          ${project.assetLinks.map(a => `
            <div class="kv-row">
              <span class="kv-label">${escapeHtml(a.label)}</span>
              <span class="kv-value"><a href="${escapeHtml(a.url)}" target="_blank">Open</a></span>
            </div>
          `).join('')}
        </div>
      </div>
    ` : ''}

    ${project.deliverables?.length ? `
      <div class="detail-section">
        <div class="section-label">Deliverables (${project.deliverables.filter(d => d.done).length}/${project.deliverables.length})</div>
        <div class="card">
          ${project.deliverables.map((d, i) => `
            <div class="deliverable ${d.done ? 'done' : ''}">
              <input type="checkbox" id="d-${i}" ${d.done ? 'checked' : ''} data-idx="${i}">
              <label for="d-${i}">${escapeHtml(d.label)}</label>
            </div>
          `).join('')}
        </div>
      </div>
    ` : ''}

    <div class="btn-row">
      <button class="btn btn-secondary" id="edit-project" style="flex:1">Edit</button>
      <button class="btn btn-secondary" id="view-client" style="flex:1">Client</button>
    </div>
    <div class="btn-row">
      <button class="btn btn-danger" id="delete-project" style="flex:1">Delete project</button>
    </div>
  `;

  $$('input[type="checkbox"][data-idx]').forEach(cb => {
    cb.addEventListener('change', async () => {
      project.deliverables[+cb.dataset.idx].done = cb.checked;
      project.updatedAt = nowISO();
      await DB.put('projects', project);
      cb.closest('.deliverable').classList.toggle('done', cb.checked);
    });
  });

  $('#edit-project').addEventListener('click', () => Forms.project(project));
  $('#view-client').addEventListener('click', () => Router.go('client-detail', { id: project.clientId }));
  $('#delete-project').addEventListener('click', () => {
    confirmAction(`Delete project "${project.title}"?`, async () => {
      await DB.delete('projects', id);
      toast('Project deleted');
      Router.go('client-detail', { id: project.clientId });
    });
  });
};

// === Quote detail ===
Views['quote-detail'] = async ({ id }) => {
  const container = $('#view-container');
  const quote = await DB.get('quotes', id);
  if (!quote) { Router.go('quotes'); return; }
  const client = await DB.get('clients', quote.clientId);

  container.innerHTML = `
    <div class="detail-header">
      <div class="detail-name">${fmt.money(quote.total)}</div>
      <div class="detail-sub">${escapeHtml(client?.name || 'Unknown')} · <span class="pill pill-${quote.status}">${fmt.status(quote.status)}</span></div>
    </div>

    <div class="detail-section">
      <div class="section-label">Line items</div>
      <div class="kv-list">
        ${(quote.lineItems || []).map(li => `
          <div class="kv-row">
            <span class="kv-label">${escapeHtml(li.label)}</span>
            <span class="kv-value money">${fmt.money(li.amount)}</span>
          </div>
        `).join('')}
        <div class="kv-row" style="background:var(--bg-sunken)">
          <span class="kv-label" style="font-weight:600;color:var(--ink)">Total</span>
          <span class="kv-value money" style="font-weight:600">${fmt.money(quote.total)}</span>
        </div>
      </div>
    </div>

    <div class="detail-section">
      <div class="section-label">Details</div>
      <div class="kv-list">
        <div class="kv-row"><span class="kv-label">Sent</span><span class="kv-value">${fmt.date(quote.sentDate)}</span></div>
        <div class="kv-row"><span class="kv-label">Expires</span><span class="kv-value">${fmt.date(quote.expirationDate)}</span></div>
        ${quote.notes ? `<div class="kv-row"><span class="kv-label">Notes</span><span class="kv-value">${escapeHtml(quote.notes)}</span></div>` : ''}
      </div>
    </div>

    <div class="btn-row">
      <button class="btn btn-secondary" id="edit-quote" style="flex:1">Edit</button>
      <button class="btn btn-danger" id="delete-quote" style="flex:1">Delete</button>
    </div>
  `;

  $('#edit-quote').addEventListener('click', () => Forms.quote(quote));
  $('#delete-quote').addEventListener('click', () => {
    confirmAction('Delete this quote?', async () => {
      await DB.delete('quotes', id);
      toast('Quote deleted');
      Router.go('quotes');
    });
  });
};

// ---------- Forms ----------

const Forms = {};

Forms.client = (existing = null) => {
  const c = existing || {};
  const w = c.webInfo || {};
  const b = c.brandKit || {};

  openModal({
    title: existing ? 'Edit client' : 'New client',
    body: `
      <form id="client-form">
        <div class="section-label">Contact</div>
        <div class="field">
          <label class="field-label">Name *</label>
          <input name="name" required value="${escapeHtml(c.name || '')}">
        </div>
        <div class="field">
          <label class="field-label">Business name</label>
          <input name="businessName" value="${escapeHtml(c.businessName || '')}">
        </div>
        <div class="field-row">
          <div class="field">
            <label class="field-label">Phone</label>
            <input type="tel" name="phone" value="${escapeHtml(c.phone || '')}">
          </div>
          <div class="field">
            <label class="field-label">Email</label>
            <input type="email" name="email" value="${escapeHtml(c.email || '')}">
          </div>
        </div>
        <div class="field-row">
          <div class="field">
            <label class="field-label">Prefers</label>
            <select name="preferredContact">
              <option value="">—</option>
              ${['text', 'call', 'email'].map(o => `<option value="${o}" ${c.preferredContact === o ? 'selected' : ''}>${o}</option>`).join('')}
            </select>
          </div>
          <div class="field">
            <label class="field-label">Status</label>
            <select name="status">
              ${['lead', 'quoted', 'active', 'completed', 'dormant'].map(o => `<option value="${o}" ${(c.status || 'lead') === o ? 'selected' : ''}>${o}</option>`).join('')}
            </select>
          </div>
        </div>
        <div class="field">
          <label class="field-label">Found via</label>
          <input name="referralSource" value="${escapeHtml(c.referralSource || '')}" placeholder="e.g. Google, Referral, Facebook">
        </div>
        <div class="field">
          <label class="field-label">Address</label>
          <input name="address" value="${escapeHtml(c.address || '')}">
        </div>
        <div class="field">
          <label class="field-label">Notes (assistants, preferences, anything)</label>
          <textarea name="notes">${escapeHtml(c.notes || '')}</textarea>
        </div>

        <hr class="divider">
        <div class="section-label">Web (optional)</div>
        <div class="field">
          <label class="field-label">Domain</label>
          <input name="domain" value="${escapeHtml(w.domain || '')}" placeholder="example.com">
        </div>
        <div class="field-row">
          <div class="field">
            <label class="field-label">Domain expires</label>
            <input type="date" name="domainExpiration" value="${escapeHtml(w.domainExpiration || '')}">
          </div>
          <div class="field">
            <label class="field-label">Registrar</label>
            <input name="registrar" value="${escapeHtml(w.registrar || '')}">
          </div>
        </div>
        <div class="field-row">
          <div class="field">
            <label class="field-label">Hosting</label>
            <input name="hostingProvider" value="${escapeHtml(w.hostingProvider || '')}">
          </div>
          <div class="field">
            <label class="field-label">DNS at</label>
            <input name="dnsManagedAt" value="${escapeHtml(w.dnsManagedAt || '')}">
          </div>
        </div>
        <div class="field-row">
          <div class="field">
            <label class="field-label">Stack</label>
            <input name="stack" value="${escapeHtml(w.stack || '')}">
          </div>
          <div class="field">
            <label class="field-label">Retainer ($/mo)</label>
            <input type="number" name="retainerMonthly" value="${w.retainerMonthly || ''}" min="0" step="1">
          </div>
        </div>
        <div class="field">
          <label class="field-label">Admin login (where to find it)</label>
          <input name="adminLoginLocation" value="${escapeHtml(w.adminLoginLocation || '')}" placeholder="e.g. 1Password vault: Client Name">
        </div>

        <hr class="divider">
        <div class="section-label">Brand kit (optional)</div>
        <div class="field-row">
          <div class="field">
            <label class="field-label">Primary color</label>
            <input name="primaryColor" value="${escapeHtml(b.primaryColor || '')}" placeholder="#000000">
          </div>
          <div class="field">
            <label class="field-label">Secondary</label>
            <input name="secondaryColor" value="${escapeHtml(b.secondaryColor || '')}">
          </div>
        </div>
        <div class="field-row">
          <div class="field">
            <label class="field-label">Display font</label>
            <input name="displayFont" value="${escapeHtml(b.displayFont || '')}">
          </div>
          <div class="field">
            <label class="field-label">Body font</label>
            <input name="bodyFont" value="${escapeHtml(b.bodyFont || '')}">
          </div>
        </div>
        <div class="field">
          <label class="field-label">Logo location</label>
          <input name="logoLocation" value="${escapeHtml(b.logoLocation || '')}" placeholder="Drive folder, file path, etc.">
        </div>
        <div class="field">
          <label class="field-label">Tagline</label>
          <input name="tagline" value="${escapeHtml(b.tagline || '')}">
        </div>
        <div class="field">
          <label class="field-label">Voice / tone notes</label>
          <textarea name="voiceNotes">${escapeHtml(b.voiceNotes || '')}</textarea>
        </div>
      </form>
    `,
    footer: `<button class="btn btn-primary btn-block" id="save-client">${existing ? 'Save changes' : 'Create client'}</button>`,
    onMount() {
      $('#save-client').addEventListener('click', async () => {
        const f = $('#client-form');
        const get = (n) => f.querySelector(`[name="${n}"]`).value.trim();
        if (!get('name')) { toast('Name required'); return; }

        const isNew = !existing;
        const id = existing?.id || await DB.nextId('cli');
        const now = nowISO();

        const webInfo = {
          domain: get('domain'),
          domainExpiration: get('domainExpiration'),
          registrar: get('registrar'),
          hostingProvider: get('hostingProvider'),
          dnsManagedAt: get('dnsManagedAt'),
          stack: get('stack'),
          retainerMonthly: parseFloat(get('retainerMonthly')) || 0,
          adminLoginLocation: get('adminLoginLocation')
        };
        const brandKit = {
          primaryColor: get('primaryColor'),
          secondaryColor: get('secondaryColor'),
          displayFont: get('displayFont'),
          bodyFont: get('bodyFont'),
          logoLocation: get('logoLocation'),
          tagline: get('tagline'),
          voiceNotes: get('voiceNotes')
        };
        const hasWeb = Object.values(webInfo).some(v => v && v !== 0);
        const hasBrand = Object.values(brandKit).some(v => v);

        const client = {
          id,
          createdAt: existing?.createdAt || now,
          updatedAt: now,
          name: get('name'),
          businessName: get('businessName'),
          phone: get('phone'),
          email: get('email'),
          preferredContact: get('preferredContact'),
          status: get('status'),
          referralSource: get('referralSource'),
          address: get('address'),
          notes: get('notes'),
          firstContactDate: existing?.firstContactDate || todayISO(),
          lastTouchDate: existing?.lastTouchDate || todayISO(),
          webInfo: hasWeb ? webInfo : null,
          brandKit: hasBrand ? brandKit : null
        };

        await DB.put('clients', client);
        closeModal();
        toast(isNew ? 'Client added' : 'Saved');
        Router.go('client-detail', { id });
      });
    }
  });
};

Forms.project = async (existing = null) => {
  const isExisting = existing && existing.id;
  const p = existing || {};
  const clients = (await DB.getAll('clients')).sort((a, b) => a.name.localeCompare(b.name));
  if (!clients.length) {
    toast('Add a client first');
    return;
  }

  const deliverables = p.deliverables || [];

  openModal({
    title: isExisting ? 'Edit project' : 'New project',
    body: `
      <form id="project-form">
        <div class="field">
          <label class="field-label">Client *</label>
          <select name="clientId" required>
            ${clients.map(c => `<option value="${c.id}" ${p.clientId === c.id ? 'selected' : ''}>${escapeHtml(c.name)}</option>`).join('')}
          </select>
        </div>
        <div class="field">
          <label class="field-label">Title *</label>
          <input name="title" required value="${escapeHtml(p.title || '')}">
        </div>
        <div class="field-row">
          <div class="field">
            <label class="field-label">Type</label>
            <select name="type">
              ${['website', 'logo', 'brand_identity', 'print', 'flyer', 'business_card', 'other'].map(o =>
                `<option value="${o}" ${(p.type || 'website') === o ? 'selected' : ''}>${o.replace(/_/g, ' ')}</option>`
              ).join('')}
            </select>
          </div>
          <div class="field">
            <label class="field-label">Status</label>
            <select name="status">
              ${['quoted', 'accepted', 'in_progress', 'review', 'delivered', 'paid', 'archived'].map(o =>
                `<option value="${o}" ${(p.status || 'quoted') === o ? 'selected' : ''}>${o.replace(/_/g, ' ')}</option>`
              ).join('')}
            </select>
          </div>
        </div>
        <div class="field">
          <label class="field-label">Description</label>
          <textarea name="description">${escapeHtml(p.description || '')}</textarea>
        </div>

        <div class="section-label">Money</div>
        <div class="field-row">
          <div class="field">
            <label class="field-label">Quoted</label>
            <input type="number" name="quotedPrice" value="${p.quotedPrice || ''}" min="0" step="0.01">
          </div>
          <div class="field">
            <label class="field-label">Invoiced</label>
            <input type="number" name="invoicedAmount" value="${p.invoicedAmount || ''}" min="0" step="0.01">
          </div>
        </div>
        <div class="field">
          <label class="field-label">Paid</label>
          <input type="number" name="paidAmount" value="${p.paidAmount || ''}" min="0" step="0.01">
        </div>

        <div class="section-label">Timeline</div>
        <div class="field-row">
          <div class="field">
            <label class="field-label">Start</label>
            <input type="date" name="startDate" value="${escapeHtml(p.startDate || '')}">
          </div>
          <div class="field">
            <label class="field-label">Due</label>
            <input type="date" name="dueDate" value="${escapeHtml(p.dueDate || '')}">
          </div>
        </div>
        <div class="field">
          <label class="field-label">Delivered date</label>
          <input type="date" name="deliveredDate" value="${escapeHtml(p.deliveredDate || '')}">
        </div>
        <div class="field">
          <label class="field-label">Live URL</label>
          <input name="liveUrl" value="${escapeHtml(p.liveUrl || '')}">
        </div>

        <div class="section-label">Deliverables</div>
        <div id="deliverables-list">
          ${deliverables.map((d, i) => deliverableInput(d, i)).join('')}
        </div>
        <button type="button" class="btn btn-secondary btn-block" id="add-deliverable" style="margin-top:8px">+ Add deliverable</button>
      </form>
    `,
    footer: `<button class="btn btn-primary btn-block" id="save-project">${isExisting ? 'Save changes' : 'Create project'}</button>`,
    onMount() {
      const list = $('#deliverables-list');
      $('#add-deliverable').addEventListener('click', () => {
        const idx = list.children.length;
        list.insertAdjacentHTML('beforeend', deliverableInput({ label: '', done: false }, idx));
      });
      list.addEventListener('click', e => {
        if (e.target.matches('[data-remove]')) e.target.closest('.deliverable-edit').remove();
      });

      $('#save-project').addEventListener('click', async () => {
        const f = $('#project-form');
        const get = (n) => f.querySelector(`[name="${n}"]`).value.trim();
        if (!get('title')) { toast('Title required'); return; }

        const dList = $$('.deliverable-edit', list).map(row => ({
          label: $('input[type="text"]', row).value.trim(),
          done: $('input[type="checkbox"]', row).checked
        })).filter(d => d.label);

        const id = existing?.id || await DB.nextId('prj');
        const now = nowISO();
        const project = {
          id,
          clientId: get('clientId'),
          createdAt: existing?.createdAt || now,
          updatedAt: now,
          title: get('title'),
          type: get('type'),
          status: get('status'),
          description: get('description'),
          quotedPrice: parseFloat(get('quotedPrice')) || 0,
          invoicedAmount: parseFloat(get('invoicedAmount')) || 0,
          paidAmount: parseFloat(get('paidAmount')) || 0,
          startDate: get('startDate') || null,
          dueDate: get('dueDate') || null,
          deliveredDate: get('deliveredDate') || null,
          liveUrl: get('liveUrl'),
          assetLinks: existing?.assetLinks || [],
          deliverables: dList
        };

        await DB.put('projects', project);
        closeModal();
        toast(isExisting ? 'Saved' : 'Project created');
        Router.go('project-detail', { id });
      });
    }
  });
};

function deliverableInput(d, i) {
  return `
    <div class="deliverable-edit" style="display:flex;gap:8px;align-items:center;margin-bottom:6px">
      <input type="checkbox" ${d.done ? 'checked' : ''} style="width:auto">
      <input type="text" value="${escapeHtml(d.label || '')}" placeholder="Deliverable" style="flex:1">
      <button type="button" data-remove style="color:var(--danger);padding:4px 8px;font-size:18px">×</button>
    </div>
  `;
}

Forms.touch = async ({ clientId }) => {
  const clients = await DB.getAll('clients');
  const projects = clientId ? await DB.getByIndex('projects', 'clientId', clientId) : [];

  openModal({
    title: 'Log activity',
    body: `
      <form id="touch-form">
        ${!clientId ? `
          <div class="field">
            <label class="field-label">Client *</label>
            <select name="clientId" required>
              ${clients.sort((a, b) => a.name.localeCompare(b.name)).map(c => `<option value="${c.id}">${escapeHtml(c.name)}</option>`).join('')}
            </select>
          </div>
        ` : `<input type="hidden" name="clientId" value="${clientId}">`}

        ${projects.length ? `
          <div class="field">
            <label class="field-label">Related project (optional)</label>
            <select name="projectId">
              <option value="">—</option>
              ${projects.map(p => `<option value="${p.id}">${escapeHtml(p.title)}</option>`).join('')}
            </select>
          </div>
        ` : ''}

        <div class="field-row">
          <div class="field">
            <label class="field-label">Date</label>
            <input type="date" name="date" value="${todayISO()}">
          </div>
          <div class="field">
            <label class="field-label">Type</label>
            <select name="type">
              ${['text', 'call', 'email', 'meeting', 'message', 'other'].map(o => `<option value="${o}">${o}</option>`).join('')}
            </select>
          </div>
        </div>

        <div class="field">
          <label class="field-label">Note</label>
          <textarea name="note" placeholder="What happened?" autofocus></textarea>
        </div>
      </form>
    `,
    footer: `<button class="btn btn-primary btn-block" id="save-touch">Log it</button>`,
    onMount() {
      $('#save-touch').addEventListener('click', async () => {
        const f = $('#touch-form');
        const get = (n) => f.querySelector(`[name="${n}"]`)?.value.trim() || '';
        const cId = get('clientId');
        if (!cId) { toast('Pick a client'); return; }

        const id = await DB.nextId('tch');
        const touch = {
          id,
          clientId: cId,
          projectId: get('projectId') || null,
          createdAt: nowISO(),
          date: get('date') || todayISO(),
          type: get('type'),
          note: get('note')
        };
        await DB.put('touches', touch);

        // Update client's lastTouchDate
        const client = await DB.get('clients', cId);
        if (client) {
          client.lastTouchDate = touch.date;
          client.updatedAt = nowISO();
          await DB.put('clients', client);
        }

        closeModal();
        toast('Activity logged');
        Router.render();
      });
    }
  });
};

Forms.quote = async (existing = null) => {
  const isExisting = existing && existing.id;
  const q = existing || {};
  const clients = (await DB.getAll('clients')).sort((a, b) => a.name.localeCompare(b.name));
  if (!clients.length) { toast('Add a client first'); return; }

  const lineItems = q.lineItems?.length ? q.lineItems : [{ label: '', amount: 0 }];
  const settings = await DB.getSettings();
  const defaultExp = (() => {
    const d = new Date();
    d.setDate(d.getDate() + (settings.defaultQuoteExpirationDays || 30));
    return d.toISOString().slice(0, 10);
  })();

  openModal({
    title: isExisting ? 'Edit quote' : 'New quote',
    body: `
      <form id="quote-form">
        <div class="field">
          <label class="field-label">Client *</label>
          <select name="clientId" required>
            ${clients.map(c => `<option value="${c.id}" ${q.clientId === c.id ? 'selected' : ''}>${escapeHtml(c.name)}</option>`).join('')}
          </select>
        </div>
        <div class="field-row">
          <div class="field">
            <label class="field-label">Sent</label>
            <input type="date" name="sentDate" value="${escapeHtml(q.sentDate || todayISO())}">
          </div>
          <div class="field">
            <label class="field-label">Expires</label>
            <input type="date" name="expirationDate" value="${escapeHtml(q.expirationDate || defaultExp)}">
          </div>
        </div>
        <div class="field">
          <label class="field-label">Status</label>
          <select name="status">
            ${['draft', 'sent', 'accepted', 'declined', 'expired'].map(o =>
              `<option value="${o}" ${(q.status || 'sent') === o ? 'selected' : ''}>${o}</option>`
            ).join('')}
          </select>
        </div>

        <div class="section-label">Line items</div>
        <div id="line-items">
          ${lineItems.map(li => lineItemRow(li)).join('')}
        </div>
        <button type="button" class="btn btn-secondary btn-block" id="add-line" style="margin-top:8px">+ Add line</button>
        <div style="text-align:right;margin-top:14px;font-family:var(--display);font-size:18px">
          Total: <span class="money" id="total">$0</span>
        </div>

        <div class="field" style="margin-top:14px">
          <label class="field-label">Notes</label>
          <textarea name="notes">${escapeHtml(q.notes || '')}</textarea>
        </div>
      </form>
    `,
    footer: `<button class="btn btn-primary btn-block" id="save-quote">${isExisting ? 'Save changes' : 'Create quote'}</button>`,
    onMount() {
      const list = $('#line-items');
      const updateTotal = () => {
        const total = $$('.line-item', list).reduce((sum, row) => {
          return sum + (parseFloat($('input[type="number"]', row).value) || 0);
        }, 0);
        $('#total').textContent = fmt.money(total);
      };
      list.addEventListener('input', updateTotal);
      list.addEventListener('click', e => {
        if (e.target.matches('[data-remove]')) {
          e.target.closest('.line-item').remove();
          updateTotal();
        }
      });
      $('#add-line').addEventListener('click', () => {
        list.insertAdjacentHTML('beforeend', lineItemRow({ label: '', amount: 0 }));
      });
      updateTotal();

      $('#save-quote').addEventListener('click', async () => {
        const f = $('#quote-form');
        const get = (n) => f.querySelector(`[name="${n}"]`).value.trim();

        const items = $$('.line-item', list).map(row => ({
          label: $('input[type="text"]', row).value.trim(),
          amount: parseFloat($('input[type="number"]', row).value) || 0
        })).filter(li => li.label);

        if (!items.length) { toast('Add at least one line item'); return; }

        const total = items.reduce((s, li) => s + li.amount, 0);
        const id = existing?.id || await DB.nextId('quo');
        const now = nowISO();
        const quote = {
          id,
          clientId: get('clientId'),
          projectId: existing?.projectId || null,
          createdAt: existing?.createdAt || now,
          updatedAt: now,
          sentDate: get('sentDate'),
          expirationDate: get('expirationDate'),
          status: get('status'),
          lineItems: items,
          total,
          notes: get('notes')
        };

        await DB.put('quotes', quote);
        closeModal();
        toast(isExisting ? 'Saved' : 'Quote created');
        Router.go('quote-detail', { id });
      });
    }
  });
};

function lineItemRow(li) {
  return `
    <div class="line-item" style="display:flex;gap:8px;align-items:center;margin-bottom:6px">
      <input type="text" value="${escapeHtml(li.label || '')}" placeholder="Description" style="flex:2">
      <input type="number" value="${li.amount || ''}" placeholder="0" min="0" step="0.01" style="flex:1">
      <button type="button" data-remove style="color:var(--danger);padding:4px 8px;font-size:18px">×</button>
    </div>
  `;
}

// ---------- Quick add menu ----------

function showQuickAdd() {
  openModal({
    title: 'Quick add',
    body: `
      <div style="display:flex;flex-direction:column;gap:10px">
        <button class="btn btn-secondary" data-add="client" style="padding:18px;justify-content:flex-start">
          <span style="font-size:22px;margin-right:10px">👤</span> New client
        </button>
        <button class="btn btn-secondary" data-add="project" style="padding:18px;justify-content:flex-start">
          <span style="font-size:22px;margin-right:10px">📁</span> New project
        </button>
        <button class="btn btn-secondary" data-add="quote" style="padding:18px;justify-content:flex-start">
          <span style="font-size:22px;margin-right:10px">📄</span> New quote
        </button>
        <button class="btn btn-secondary" data-add="touch" style="padding:18px;justify-content:flex-start">
          <span style="font-size:22px;margin-right:10px">💬</span> Log activity
        </button>
      </div>
    `,
    onMount(c) {
      $$('[data-add]', c).forEach(btn => {
        btn.addEventListener('click', async () => {
          closeModal();
          const action = btn.dataset.add;
          if (action === 'client') Forms.client();
          else if (action === 'project') Forms.project();
          else if (action === 'quote') Forms.quote();
          else if (action === 'touch') Forms.touch({});
        });
      });
    }
  });
}

// ---------- Settings (export/import) ----------

function showSettings() {
  openModal({
    title: 'Settings',
    body: `
      <div class="section-label">Backup</div>
      <button class="btn btn-secondary btn-block" id="export-btn" style="margin-bottom:8px">Export backup (JSON)</button>
      <button class="btn btn-secondary btn-block" id="import-btn" style="margin-bottom:8px">Import backup</button>
      <input type="file" id="import-file" accept=".json,application/json" style="display:none">
      <p class="field-help" style="margin-top:8px">Export creates a JSON file with all your data. Import replaces current data.</p>

      <hr class="divider">

      <div class="section-label">Danger zone</div>
      <button class="btn btn-danger btn-block" id="wipe-btn">Wipe all data</button>

      <hr class="divider">
      <div class="section-label">About</div>
      <p style="font-size:13px;color:var(--ink-soft);line-height:1.6">
        Client Tracker v0.1<br>
        Local-only · No sync · No accounts<br>
        All data stays on this device.
      </p>
    `,
    onMount(c) {
      $('#export-btn', c).addEventListener('click', async () => {
        const data = await DB.exportAll();
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `client-tracker-backup-${todayISO()}.json`;
        a.click();
        URL.revokeObjectURL(url);
        toast('Backup downloaded');
      });

      $('#import-btn', c).addEventListener('click', () => $('#import-file', c).click());
      $('#import-file', c).addEventListener('change', async e => {
        const file = e.target.files[0];
        if (!file) return;
        try {
          const text = await file.text();
          const data = JSON.parse(text);
          confirmAction('Import will replace ALL current data. Continue?', async () => {
            await DB.importAll(data);
            closeModal();
            toast('Import complete');
            Router.render();
          });
        } catch (err) {
          toast('Invalid backup file');
        }
      });

      $('#wipe-btn', c).addEventListener('click', () => {
        confirmAction('Wipe ALL data? This cannot be undone.', async () => {
          await DB.wipe();
          closeModal();
          toast('Data wiped');
          Router.go('dashboard');
        });
      });
    }
  });
}

// ---------- Bootstrap ----------

document.addEventListener('DOMContentLoaded', () => {
  // Nav
  $$('.nav-btn[data-view]').forEach(btn => {
    btn.addEventListener('click', () => Router.go(btn.dataset.view));
  });
  $('.fab-btn').addEventListener('click', showQuickAdd);
  $('#settings-btn').addEventListener('click', showSettings);

  Router.go('dashboard');
});
