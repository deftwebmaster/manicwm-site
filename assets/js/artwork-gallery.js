(() => {
  'use strict';
  const gallery = document.querySelector('.art-gallery');
  const viewer = document.querySelector('#art-viewer');
  if (!gallery || !viewer) return;
  const items = [...gallery.querySelectorAll('.art-item')];
  const filters = [...gallery.querySelectorAll('[data-art-filter]')];
  const more = gallery.querySelector('.art-more');
  const count = gallery.querySelector('.art-count');
  const status = gallery.querySelector('.art-status');
  const pageSize = Number(gallery.dataset.pageSize) || 9;
  const alias = { identity: 'logos', restaurants: 'menus', promos: 'flyers' };
  const allowed = new Set(['all', ...filters.map(button => button.dataset.artFilter)]);
  const image = viewer.querySelector('#art-viewer-image');
  const title = viewer.querySelector('#art-viewer-title');
  const category = viewer.querySelector('#art-viewer-category');
  const counter = viewer.querySelector('#art-viewer-counter');
  const original = viewer.querySelector('#art-original');
  const error = viewer.querySelector('.art-load-error');
  const close = viewer.querySelector('#art-close');
  const previous = viewer.querySelector('#art-previous');
  const next = viewer.querySelector('#art-next');
  let limit = pageSize;
  let active = 'all';
  let filtered = items;
  let artwork = [];
  let index = 0;
  let returnFocus = null;

  function filterFromHash() {
    const raw = location.hash.slice(1);
    const value = alias[raw] || raw;
    return allowed.has(value) ? value : 'all';
  }
  function render(announce = true) {
    filtered = items.filter(item => active === 'all' || item.dataset.kind === active);
    items.forEach(item => { item.hidden = true; });
    filtered.slice(0, limit).forEach(item => { item.hidden = false; });
    filters.forEach(button => button.setAttribute('aria-pressed', String(button.dataset.artFilter === active)));
    const visible = Math.min(limit, filtered.length);
    count.textContent = `${visible} of ${filtered.length} designs`;
    more.hidden = visible >= filtered.length;
    if (announce) status.textContent = `${active === 'all' ? 'All artwork' : filters.find(button => button.dataset.artFilter === active)?.textContent.trim()}: ${count.textContent}.`;
  }
  filters.forEach(button => button.addEventListener('click', () => {
    active = button.dataset.artFilter;
    limit = pageSize;
    render();
    history.pushState(null, '', `${location.pathname}${location.search}#${active === 'all' ? 'artwork' : active}`);
  }));
  function restoreFilter() { active = filterFromHash(); limit = pageSize; render(); }
  if (filters.length) {
    window.addEventListener('popstate', restoreFilter);
    window.addEventListener('hashchange', restoreFilter);
  }
  more.addEventListener('click', () => {
    const firstNew = filtered[limit];
    limit += pageSize;
    render();
    firstNew?.querySelector('.art-link').focus({ preventScroll: true });
  });

  function showArtwork() {
    const link = artwork[index];
    image.hidden = false;
    error.hidden = true;
    image.alt = link.dataset.artTitle + ' — ' + link.dataset.artCategory;
    image.src = link.dataset.artSrc;
    image.parentElement.classList.toggle('light-mat', link.dataset.artMat === 'light');
    title.textContent = link.dataset.artTitle;
    category.textContent = link.dataset.artCategory;
    counter.textContent = `Artwork ${index + 1} of ${artwork.length}`;
    original.href = link.href;
    previous.disabled = index === 0;
    next.disabled = index === artwork.length - 1;
  }
  function move(step) {
    const value = index + step;
    if (value < 0 || value >= artwork.length) return;
    index = value;
    showArtwork();
    if (document.activeElement.disabled) close.focus();
  }
  if (typeof viewer.showModal === 'function') {
    gallery.querySelectorAll('.art-link').forEach(link => link.setAttribute('aria-haspopup', 'dialog'));
    gallery.addEventListener('click', event => {
      const link = event.target.closest('.art-link');
      if (!link || event.button !== 0 || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
      event.preventDefault();
      artwork = filtered.map(item => item.querySelector('.art-link'));
      index = artwork.indexOf(link);
      returnFocus = link;
      showArtwork();
      viewer.showModal();
      document.body.classList.add('art-viewer-open');
      close.focus();
    });
  }
  close.addEventListener('click', () => viewer.close());
  previous.addEventListener('click', () => move(-1));
  next.addEventListener('click', () => move(1));
  viewer.addEventListener('keydown', event => {
    if (event.key === 'ArrowLeft') { event.preventDefault(); move(-1); }
    if (event.key === 'ArrowRight') { event.preventDefault(); move(1); }
  });
  viewer.addEventListener('click', event => {
    if (event.target !== viewer) return;
    const r = viewer.getBoundingClientRect();
    if (event.clientX < r.left || event.clientX > r.right || event.clientY < r.top || event.clientY > r.bottom) viewer.close();
  });
  viewer.addEventListener('close', () => {
    document.body.classList.remove('art-viewer-open');
    returnFocus?.focus({ preventScroll: true });
  });
  image.addEventListener('error', () => { image.hidden = true; error.hidden = false; });
  active = filterFromHash();
  render(false);
  gallery.querySelector('.art-gallery-end').hidden = false;
  const filterBar = gallery.querySelector('.art-filterbar');
  if (filterBar) filterBar.hidden = false;
})();
