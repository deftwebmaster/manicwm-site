/* CrossRoads Decorative Pavement — site script (no dependencies) */
(() => {
  document.documentElement.classList.remove('no-js');

  // Both appearances are available on every page, with a shared preference.
  const themeToggle = document.querySelector('.theme-toggle');
  const updateThemeControl = () => {
    const light = document.documentElement.dataset.theme === 'light';
    if (themeToggle) themeToggle.setAttribute('aria-checked', String(light));
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.content = light ? '#f7f6f2' : '#141716';
  };
  updateThemeControl();
  themeToggle?.addEventListener('click', () => {
    const theme = document.documentElement.dataset.theme === 'light' ? 'dark' : 'light';
    document.documentElement.dataset.theme = theme;
    try { localStorage.setItem('crossroads-theme', theme); } catch (_) { /* Storage is optional. */ }
    updateThemeControl();
  });
  window.addEventListener('storage', event => {
    if (event.key === 'crossroads-theme') {
      document.documentElement.dataset.theme = event.newValue === 'light' ? 'light' : 'dark';
      updateThemeControl();
    }
  });

  // A manually browsed project spotlight: photographs stay still until requested.
  const featuredImage = document.getElementById('featured-img');
  if (featuredImage) {
    const projects = [
      { image: 'continental-bridge-aerial-dallas.webp', title: 'Continental Bridge', location: 'Dallas, Texas · StreetBond & pavement art', alt: 'Aerial view of bold geometric pavement art on the Continental Bridge in Dallas', category: 'streetbond' },
      { image: 'beale-street-stamped-asphalt-memphis.webp', title: 'Beale Street', location: 'Memphis, Tennessee · Stamped asphalt', alt: 'Red brick-pattern stamped asphalt along the colorful storefronts of Beale Street in Memphis', category: 'stamped' },
      { image: 'catfish-park-crosswalk-mural-vicksburg.webp', title: 'Catfish Park', location: 'Vicksburg, Mississippi · Crosswalks & pavement art', alt: 'Stamped crosswalk and painted river mural at Catfish Park in Vicksburg', category: 'art' }
    ];
    let current = 0;
    const feature = step => {
      current = (current + step + projects.length) % projects.length;
      const project = projects[current];
      featuredImage.src = 'assets/img/work/' + project.image;
      featuredImage.alt = project.alt;
      const link = featuredImage.closest('a');
      link.href = 'gallery/#' + project.category;
      link.setAttribute('aria-label', 'Explore ' + project.title + ' projects');
      document.getElementById('featured-title').textContent = project.title;
      document.getElementById('featured-location').textContent = project.location;
      document.getElementById('featured-number').textContent = String(current + 1).padStart(2, '0');
    };
    document.querySelector('.project-prev').addEventListener('click', () => feature(-1));
    document.querySelector('.project-next').addEventListener('click', () => feature(1));
  }

  // Footer year
  document.querySelectorAll('[data-year]').forEach(el => { el.textContent = new Date().getFullYear(); });

  // Mobile menu
  const toggle = document.querySelector('.menu-toggle');
  const nav = document.getElementById('site-nav');
  if (toggle && nav) {
    toggle.addEventListener('click', () => {
      const open = nav.classList.toggle('open');
      toggle.setAttribute('aria-expanded', String(open));
      toggle.setAttribute('aria-label', open ? 'Close menu' : 'Menu');
    });
    nav.addEventListener('click', e => { if (e.target.closest('a')) { nav.classList.remove('open'); toggle.setAttribute('aria-expanded', 'false'); toggle.setAttribute('aria-label', 'Menu'); } });
  }

  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && nav?.classList.contains('open')) {
      nav.classList.remove('open');
      toggle.setAttribute('aria-expanded', 'false');
      toggle.setAttribute('aria-label', 'Menu');
      toggle.focus();
    }
  });

  // Before / after sliders
  document.querySelectorAll('.ba').forEach(ba => {
    const input = ba.querySelector('input[type="range"]');
    const set = v => ba.style.setProperty('--pos', v + '%');
    input.addEventListener('input', () => set(input.value));
    set(input.value);
  });

  // Reveal on scroll
  const reveals = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver(entries => {
      entries.forEach(en => { if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); } });
    }, { rootMargin: '0px 0px -8% 0px' });
    reveals.forEach(el => io.observe(el));
  } else {
    reveals.forEach(el => el.classList.add('in'));
  }

  // Gallery filters
  const filterBar = document.querySelector('.filters');
  const tiles = [...document.querySelectorAll('.work .tile')];
  if (filterBar) {
    filterBar.querySelectorAll('button').forEach(btn => {
      const f = btn.dataset.filter;
      const n = f === 'all' ? tiles.length : tiles.filter(t => t.dataset.cat.split(' ').includes(f)).length;
      btn.insertAdjacentHTML('beforeend', `<span class="count">${n}</span>`);
    });
    filterBar.addEventListener('click', e => {
      const btn = e.target.closest('button');
      if (!btn) return;
      filterBar.querySelectorAll('button').forEach(b => b.setAttribute('aria-pressed', String(b === btn)));
      const f = btn.dataset.filter;
      tiles.forEach(t => { t.hidden = !(f === 'all' || t.dataset.cat.split(' ').includes(f)); });
      if (history.replaceState) history.replaceState(null, '', location.pathname + location.search + (f === 'all' ? '' : '#' + f));
    });
    const initial = location.hash.slice(1);
    const btn = initial && filterBar.querySelector(`[data-filter="${CSS.escape(initial)}"]`);
    if (btn) btn.click();
  }

  // Lightbox
  const lb = document.getElementById('lightbox');
  if (lb && tiles.length) {
    const img = lb.querySelector('img');
    const title = lb.querySelector('.lb-cap b');
    const sub = lb.querySelector('.lb-cap span');
    const count = lb.querySelector('.lb-count');
    let list = [], i = 0;

    const show = n => {
      i = (n + list.length) % list.length;
      const t = list[i], b = t.querySelector('button');
      img.src = b.dataset.full;
      img.alt = t.querySelector('img').alt;
      title.textContent = t.querySelector('figcaption b').textContent;
      sub.textContent = t.querySelector('figcaption span')?.textContent || '';
      count.textContent = `${i + 1} / ${list.length}`;
      // Preload neighbours
      [i + 1, i - 1].forEach(k => { const nb = list[(k + list.length) % list.length]; if (nb) new Image().src = nb.querySelector('button').dataset.full; });
    };

    tiles.forEach(t => t.querySelector('button').addEventListener('click', () => {
      list = tiles.filter(x => !x.hidden);
      show(list.indexOf(t));
      lb.showModal();
      document.body.style.overflow = 'hidden';
    }));
    lb.addEventListener('close', () => { document.body.style.overflow = ''; });
    lb.querySelector('.lb-close').addEventListener('click', () => lb.close());
    lb.querySelector('.lb-prev').addEventListener('click', () => show(i - 1));
    lb.querySelector('.lb-next').addEventListener('click', () => show(i + 1));
    lb.addEventListener('keydown', e => {
      if (e.key === 'ArrowRight') show(i + 1);
      if (e.key === 'ArrowLeft') show(i - 1);
    });
    lb.addEventListener('click', e => { if (e.target === lb || e.target.classList.contains('lb-stage')) lb.close(); });
    let x0 = null;
    lb.addEventListener('touchstart', e => { x0 = e.touches[0].clientX; }, { passive: true });
    lb.addEventListener('touchend', e => {
      if (x0 === null) return;
      const dx = e.changedTouches[0].clientX - x0;
      if (Math.abs(dx) > 50) show(dx < 0 ? i + 1 : i - 1);
      x0 = null;
    });
  }
})();
