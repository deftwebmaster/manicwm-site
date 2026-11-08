(() => {
  'use strict';
  const gallery = document.querySelector('#work-grid');
  const cards = [...gallery.querySelectorAll('.work-card')];
  const filters = [...document.querySelectorAll('.filter')];
  const filterBar = document.querySelector('.filter-bar');
  const more = document.querySelector('#load-more');
  const count = document.querySelector('#result-count');
  const status = document.querySelector('#filter-status');
  const viewer = document.querySelector('#artwork-viewer');
  const viewerImage = document.querySelector('#viewer-image');
  const viewerTitle = document.querySelector('#viewer-title');
  const viewerCategory = document.querySelector('#viewer-category');
  const viewerCounter = document.querySelector('#viewer-counter');
  const viewerSource = document.querySelector('#viewer-source');
  const viewerError = document.querySelector('#viewer-error');
  const close = document.querySelector('#viewer-close');
  const previous = document.querySelector('#viewer-previous');
  const next = document.querySelector('#viewer-next');
  const validFilters = new Set(filters.map(button => button.dataset.filter));
  let active = 'all';
  let limit = 9;
  let filtered = cards;
  let artwork = [];
  let currentArtwork = 0;
  let returnFocus = null;

  if (typeof viewer.showModal === 'function') {
    gallery.querySelectorAll('[data-art-src]').forEach(link => link.setAttribute('aria-haspopup', 'dialog'));
  }

  function applyFilter(value, announce = true) {
    active = validFilters.has(value) ? value : 'all';
    filtered = cards.filter(card => active === 'all' || card.dataset.category === active);
    filters.forEach(button => button.setAttribute('aria-pressed', String(button.dataset.filter === active)));
    gallery.classList.toggle('is-artwork', active === 'graphics');
    cards.forEach(card => { card.hidden = true; card.classList.remove('lead'); });
    filtered.slice(0, limit).forEach(card => { card.hidden = false; });
    // The full-width opening preview belongs to the curated All view only.
    if (active === 'all') filtered[0]?.classList.add('lead');
    const shown = Math.min(limit, filtered.length);
    count.textContent = `${shown} of ${filtered.length} ${active === 'graphics' ? 'designs' : 'projects'}`;
    more.hidden = shown >= filtered.length;
    if (announce) {
      const label = filters.find(button => button.dataset.filter === active).textContent.trim();
      status.textContent = `${label}: showing ${shown} of ${filtered.length}.`;
    }
  }

  function hashFilter() {
    const value = location.hash.slice(1);
    return validFilters.has(value) ? value : 'all';
  }

  filters.forEach(button => {
    button.addEventListener('click', () => {
      limit = 9;
      applyFilter(button.dataset.filter);
      // A fragment makes a specific gallery shareable and browser Back useful.
      const fragment = active === 'all' ? '' : `#${active}`;
      history.pushState(null, '', `${location.pathname}${location.search}${fragment}`);
      if (filterBar.getBoundingClientRect().top < 0) filterBar.scrollIntoView({ block: 'start' });
    });
  });
  window.addEventListener('popstate', () => { limit = 9; applyFilter(hashFilter()); });
  more.addEventListener('click', () => {
    const firstNew = filtered[limit];
    limit += 9;
    applyFilter(active);
    firstNew?.querySelector('.work-link').focus({ preventScroll: true });
  });

  function renderArtwork() {
    const link = artwork[currentArtwork];
    viewerError.hidden = true;
    viewerImage.hidden = false;
    viewerImage.alt = link.dataset.artAlt;
    viewerImage.src = link.dataset.artSrc;
    viewerImage.parentElement.classList.toggle('light-mat', link.dataset.artMat === 'light');
    viewerTitle.textContent = link.dataset.artTitle;
    viewerCategory.textContent = link.dataset.artCategory;
    viewerCounter.textContent = `Artwork ${currentArtwork + 1} of ${artwork.length}`;
    viewerSource.href = link.href;
    previous.disabled = currentArtwork === 0;
    next.disabled = currentArtwork === artwork.length - 1;
  }

  function moveArtwork(direction) {
    const target = currentArtwork + direction;
    if (target < 0 || target >= artwork.length) return;
    currentArtwork = target;
    renderArtwork();
    // Avoid leaving keyboard focus on a button that just became disabled.
    if (document.activeElement.disabled) close.focus();
  }

  gallery.addEventListener('click', event => {
    const link = event.target.closest('[data-art-src]');
    if (!link || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey || event.button !== 0 || typeof viewer.showModal !== 'function') return;
    event.preventDefault();
    artwork = filtered.map(card => card.querySelector('[data-art-src]')).filter(Boolean);
    currentArtwork = artwork.indexOf(link);
    returnFocus = link;
    renderArtwork();
    viewer.showModal();
    document.body.classList.add('viewer-open');
    close.focus();
  });

  close.addEventListener('click', () => viewer.close());
  previous.addEventListener('click', () => moveArtwork(-1));
  next.addEventListener('click', () => moveArtwork(1));
  viewer.addEventListener('keydown', event => {
    if (event.key === 'ArrowLeft') { event.preventDefault(); moveArtwork(-1); }
    if (event.key === 'ArrowRight') { event.preventDefault(); moveArtwork(1); }
  });
  viewer.addEventListener('click', event => {
    if (event.target !== viewer) return;
    const rect = viewer.getBoundingClientRect();
    if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) viewer.close();
  });
  viewer.addEventListener('close', () => {
    document.body.classList.remove('viewer-open');
    // A viewer can browse artwork beyond the current page of results.
    const card = artwork[currentArtwork]?.closest('.work-card');
    if (card && card.hidden) {
      limit = Math.ceil((filtered.indexOf(card) + 1) / 9) * 9;
      applyFilter(active, false);
    }
    returnFocus?.focus({ preventScroll: true });
  });
  viewerImage.addEventListener('error', () => { viewerImage.hidden = true; viewerError.hidden = false; });

  applyFilter(hashFilter(), false);
  document.querySelector('#gallery-controls').hidden = false;
  document.querySelector('#gallery-end').hidden = false;
})();
