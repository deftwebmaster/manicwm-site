/**
 * FAVICON FORGE — ManicWebmaster
 * Client-side favicon generator
 * Canvas API · dependency-free ZIP/ICO generation · Vanilla JS
 *
 * Architecture:
 *   1. Image ingestion (file input / drag-drop)
 *   2. Settings state management
 *   3. Canvas rendering engine (renderFavicon)
 *   4. Live preview updates
 *   5. 16px Readability Test population
 *   6. Smart readability analysis
 *   7. ZIP + ICO package generation
 *   8. HTML snippet generation
 */

/* ═══════════════════════════════════════
   STATE
   ═══════════════════════════════════════ */
const state = {
  sourceImage: null,       // HTMLImageElement of uploaded file
  sourceFileName: '',      // original filename
  background: 'transparent',
  customColor: '#3b82f6',
  padding: 0,
  shape: 'square',
  crop: 'contain',
};

/* ═══════════════════════════════════════
   DOM REFERENCES
   ═══════════════════════════════════════ */
const $ = (id) => document.getElementById(id);

const els = {
  heroUploadBtn:      $('heroUploadBtn'),
  dropZone:           $('dropZone'),
  dropZoneInner:      $('dropZoneInner'),
  fileInput:          $('fileInput'),
  previewContainer:   $('previewContainer'),
  uploadedPreview:    $('uploadedPreview'),
  previewMeta:        $('previewMeta'),
  replaceBtn:         $('replaceBtn'),
  customColorPicker:  $('customColorPicker'),
  customSwatch:       $('customSwatch'),

  // Readability test canvases
  tabFavLight1:       $('tabFavLight1'),
  tabFavLight2:       $('tabFavLight2'),
  tabFavLight3:       $('tabFavLight3'),
  tabFavDark1:        $('tabFavDark1'),
  tabFavDark2:        $('tabFavDark2'),
  tabFavDark3:        $('tabFavDark3'),
  bookmarkFav:        $('bookmarkFav'),
  mobileIcon:         $('mobileIcon'),
  toolbarRow:         $('toolbarRow'),
  verdictCanvas:      $('verdictCanvas'),
  verdictRating:      $('verdictRating'),
  verdictDesc:        $('verdictDesc'),

  readabilityPlaceholder: $('readabilityPlaceholder'),
  readabilityTests:       $('readabilityTests'),
  reportSection:          $('reportSection'),
  reportFindings:         $('reportFindings'),
  downloadPlaceholder:    $('downloadPlaceholder'),
  downloadContent:        $('downloadContent'),
  downloadBtn:            $('downloadBtn'),
  downloadStatus:         $('downloadStatus'),
  copySnippetBtn:         $('copySnippetBtn'),
  snippetPanel:           $('snippetPanel'),
  snippetCode:            $('snippetCode'),
  copySnippetClose:       $('copySnippetClose'),
  copySnippetAgain:       $('copySnippetAgain'),
  copyToast:              $('copyToast'),
  recommendationCta:      $('recommendationCta'),
  recommendationTitle:    $('recommendationTitle'),
  recommendationBody:     $('recommendationBody'),
};

/* ═══════════════════════════════════════
   UPLOAD / DRAG-DROP
   ═══════════════════════════════════════ */

// Hero button scrolls to upload and triggers file dialog
els.heroUploadBtn.addEventListener('click', () => {
  document.getElementById('uploadSection').scrollIntoView({ behavior: 'smooth', block: 'start' });
  setTimeout(() => els.fileInput.click(), 400);
});

// Replace button
els.replaceBtn.addEventListener('click', (e) => {
  e.preventDefault();
  e.stopPropagation();
  els.fileInput.click();
});

// File input change
els.fileInput.addEventListener('change', (e) => {
  const file = e.target.files[0];
  if (file) loadImageFile(file);
});

// Drag-drop events
const dropZone = els.dropZone;
dropZone.addEventListener('dragover', (e) => {
  e.preventDefault();
  dropZone.classList.add('drag-over');
});
dropZone.addEventListener('dragleave', () => dropZone.classList.remove('drag-over'));
dropZone.addEventListener('drop', (e) => {
  e.preventDefault();
  dropZone.classList.remove('drag-over');
  const file = e.dataTransfer.files[0];
  if (file) loadImageFile(file);
});

/**
 * Validates and loads an image file into state.
 * @param {File} file
 */
function loadImageFile(file) {
  const validTypes = ['image/png', 'image/jpeg', 'image/gif', 'image/webp', 'image/svg+xml'];

  if (!validTypes.includes(file.type)) {
    alert(`Unsupported file type: ${file.type}\nPlease upload PNG, JPG, SVG, WebP, or GIF.`);
    return;
  }

  state.sourceFileName = file.name.replace(/\.[^.]+$/, ''); // strip extension

  const reader = new FileReader();
  reader.onload = (e) => {
    const img = new Image();
    img.onload = () => {
      state.sourceImage = img;

      // Show preview in upload zone
      els.uploadedPreview.src = e.target.result;
      els.previewMeta.textContent = `${img.naturalWidth} × ${img.naturalHeight}px · ${(file.size / 1024).toFixed(1)} KB`;
      els.dropZoneInner.classList.add('hidden');
      els.previewContainer.classList.remove('hidden');

      // Trigger full render
      regenerateAll();
    };
    img.onerror = () => alert('Could not load this image. Please try a different file.');
    img.src = e.target.result;
  };
  reader.readAsDataURL(file);
}

/* ═══════════════════════════════════════
   SETTINGS CONTROLS
   ═══════════════════════════════════════ */

/**
 * Wire up option button groups.
 * @param {string} containerId - parent element id
 * @param {string} dataAttr    - data-* attribute name
 * @param {function} onChange  - callback with new value
 */
function wireOptionGroup(containerId, dataAttr, onChange) {
  const container = $(containerId);
  container.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-' + dataAttr + ']');
    if (!btn) return;
    // Deactivate siblings
    container.querySelectorAll('.opt-btn').forEach(b => {
      b.classList.remove('opt-btn--active');
      b.setAttribute('aria-pressed', 'false');
    });
    btn.classList.add('opt-btn--active');
    btn.setAttribute('aria-pressed', 'true');
    onChange(btn.dataset[dataAttr]);
  });
}

wireOptionGroup('bgOptions', 'bg', (val) => {
  state.background = val;
  if (val === 'custom') {
    els.customColorPicker.click();
  }
  regenerateAll();
});

wireOptionGroup('paddingOptions', 'padding', (val) => {
  state.padding = parseFloat(val);
  regenerateAll();
});

wireOptionGroup('shapeOptions', 'shape', (val) => {
  state.shape = val;
  regenerateAll();
});

wireOptionGroup('cropOptions', 'crop', (val) => {
  state.crop = val;
  regenerateAll();
});

// Custom color picker
els.customColorPicker.addEventListener('input', (e) => {
  state.customColor = e.target.value;
  els.customSwatch.style.background = state.customColor;
  if (state.background === 'custom') regenerateAll();
});

// Keep swatch color in sync even when picker closes
els.customColorPicker.addEventListener('change', (e) => {
  state.customColor = e.target.value;
  els.customSwatch.style.background = state.customColor;
  // Ensure "custom" is selected
  $('customBgBtn').classList.add('opt-btn--active');
  $('customBgBtn').setAttribute('aria-pressed', 'true');
  $('bgOptions').querySelectorAll('.opt-btn').forEach(b => {
    if (b !== $('customBgBtn')) {
      b.classList.remove('opt-btn--active');
      b.setAttribute('aria-pressed', 'false');
    }
  });
  state.background = 'custom';
  regenerateAll();
});

/* ═══════════════════════════════════════
   CANVAS RENDERING ENGINE
   ═══════════════════════════════════════ */

/**
 * Renders the favicon onto a canvas at a given size.
 * Handles: background, padding, crop mode, shape clipping.
 *
 * @param {HTMLCanvasElement} canvas - target canvas
 * @param {number} size             - output size (square)
 * @param {object} options          - override state properties
 */
function renderFavicon(canvas, size, options = {}) {
  const cfg = { ...state, ...options };
  const ctx = canvas.getContext('2d');
  canvas.width = size;
  canvas.height = size;

  ctx.clearRect(0, 0, size, size);

  // Resolve background color
  let bgColor = null;
  if (cfg.background === 'white')  bgColor = '#ffffff';
  if (cfg.background === 'black')  bgColor = '#000000';
  if (cfg.background === 'custom') bgColor = cfg.customColor;

  // Apply shape clipping path
  applyShapeClip(ctx, size, cfg.shape);
  ctx.save();
  ctx.clip();

  // Fill background (if not transparent)
  if (bgColor) {
    ctx.fillStyle = bgColor;
    ctx.fillRect(0, 0, size, size);
  }

  // Draw image with padding + crop mode
  if (cfg.sourceImage) {
    const padPx = Math.round(size * cfg.padding);
    const drawSize = size - padPx * 2;
    const destX = padPx;
    const destY = padPx;

    if (cfg.crop === 'contain') {
      drawContain(ctx, cfg.sourceImage, destX, destY, drawSize, drawSize);
    } else {
      drawCover(ctx, cfg.sourceImage, destX, destY, drawSize, drawSize);
    }
  }

  ctx.restore();
}

/**
 * Sets a clipping path on ctx based on shape.
 * Does NOT call clip() — caller does.
 */
function applyShapeClip(ctx, size, shape) {
  ctx.beginPath();
  if (shape === 'circle') {
    ctx.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2);
  } else if (shape === 'rounded') {
    const r = size * 0.18; // ~18% radius looks good
    roundedRect(ctx, 0, 0, size, size, r);
  } else {
    // square — clip to full rect
    ctx.rect(0, 0, size, size);
  }
}

/** Utility: rounded rectangle path */
function roundedRect(ctx, x, y, w, h, r) {
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

/** Object-fit: contain */
function drawContain(ctx, img, x, y, w, h) {
  const scale = Math.min(w / img.naturalWidth, h / img.naturalHeight);
  const sw = img.naturalWidth * scale;
  const sh = img.naturalHeight * scale;
  const sx = x + (w - sw) / 2;
  const sy = y + (h - sh) / 2;
  ctx.drawImage(img, sx, sy, sw, sh);
}

/** Object-fit: cover */
function drawCover(ctx, img, x, y, w, h) {
  const scale = Math.max(w / img.naturalWidth, h / img.naturalHeight);
  const sw = img.naturalWidth * scale;
  const sh = img.naturalHeight * scale;
  const sx = x + (w - sw) / 2;
  const sy = y + (h - sh) / 2;
  ctx.drawImage(img, sx, sy, sw, sh);
}

/* ═══════════════════════════════════════
   LIVE PREVIEW SIZE CANVASES
   ═══════════════════════════════════════ */
const PREVIEW_SIZES = [
  { id: 'size-16',  px: 16  },
  { id: 'size-32',  px: 32  },
  { id: 'size-180', px: 180 },
  { id: 'size-192', px: 192 },
  { id: 'size-512', px: 512 },
];

function updatePreviews() {
  PREVIEW_SIZES.forEach(({ id, px }) => {
    const card = $(id);
    const canvas = card.querySelector('canvas');
    renderFavicon(canvas, px);
  });
}

/* ═══════════════════════════════════════
   16px READABILITY TEST
   ═══════════════════════════════════════ */

/**
 * Renders all tab/bookmark/mobile/toolbar
 * canvases with the current state.
 */
function updateReadabilityTest() {
  if (!state.sourceImage) return;

  els.readabilityPlaceholder.classList.add('hidden');
  els.readabilityTests.classList.remove('hidden');

  // All 16px readability canvases
  const canvases16 = [
    els.tabFavLight1, els.tabFavLight2, els.tabFavLight3,
    els.tabFavDark1,  els.tabFavDark2,  els.tabFavDark3,
    els.bookmarkFav,
  ];
  canvases16.forEach(c => renderFavicon(c, 16));

  // Mobile icon at 60px (will CSS-scale to 54px with smooth rendering)
  renderFavicon(els.mobileIcon, 60, { shape: 'rounded' });

  // Toolbar stress test row — multiple tiny sizes
  buildToolbarRow();

  // Verdict canvas at 16px
  renderFavicon(els.verdictCanvas, 16);

  // Compute + display verdict
  computeVerdict();
}

/**
 * Builds a row of favicons at various sizes to stress-test readability.
 */
function buildToolbarRow() {
  els.toolbarRow.innerHTML = '';
  const sizes = [32, 24, 20, 16, 14, 12];
  const labels = ['32', '24', '20', '16', '14', '12'];

  sizes.forEach((sz, i) => {
    const item = document.createElement('div');
    item.className = 'toolbar-favicon-item';

    const canvas = document.createElement('canvas');
    canvas.width = sz;
    canvas.height = sz;
    canvas.style.width = sz + 'px';
    canvas.style.height = sz + 'px';
    renderFavicon(canvas, sz);

    const lbl = document.createElement('span');
    lbl.textContent = labels[i] + 'px';

    item.appendChild(canvas);
    item.appendChild(lbl);
    els.toolbarRow.appendChild(item);
  });
}

/* ═══════════════════════════════════════
   SMART READABILITY ANALYSIS
   ═══════════════════════════════════════ */

/**
 * Runs heuristic pixel analysis on the 16px rendered favicon
 * to score readability and generate findings.
 *
 * Returns: { score: 0-100, issues: [] }
 */
function analyzeReadability() {
  if (!state.sourceImage) return { score: 80, issues: [] };

  // Render to an offscreen 16px canvas for pixel analysis
  const offscreen = document.createElement('canvas');
  renderFavicon(offscreen, 16);
  const ctx16 = offscreen.getContext('2d');
  const data16 = ctx16.getImageData(0, 0, 16, 16).data; // flat RGBA

  // Also render at 32px for comparison
  const offscreen32 = document.createElement('canvas');
  renderFavicon(offscreen32, 32);
  const ctx32 = offscreen32.getContext('2d');

  const issues = [];
  let score = 100;

  /* ── Check 1: Excessive transparent padding ── */
  const transparentEdge = detectEdgePadding(data16, 16);
  if (transparentEdge > 0.2) {
    issues.push({
      type: 'warn',
      icon: '⚠',
      title: 'Excess transparent padding',
      desc: `~${Math.round(transparentEdge * 100)}% of edge pixels are transparent. Your logo may appear smaller than expected.`,
    });
    score -= 15;
  } else if (transparentEdge <= 0.05 && state.padding === 0) {
    issues.push({
      type: 'good',
      icon: '✓',
      title: 'Clean edge usage',
      desc: 'Logo fills the favicon frame efficiently with minimal wasted space.',
    });
  }

  /* ── Check 2: Low contrast at 16px ── */
  const contrastScore = measureContrast(data16, 16);
  if (contrastScore < 0.25) {
    issues.push({
      type: 'error',
      icon: '✗',
      title: 'Weak contrast at tiny sizes',
      desc: 'Very low contrast detected. Logo details will disappear against most browser backgrounds.',
    });
    score -= 30;
  } else if (contrastScore < 0.45) {
    issues.push({
      type: 'warn',
      icon: '⚠',
      title: 'Moderate contrast concern',
      desc: 'Contrast is acceptable but not strong. May struggle on certain browser themes.',
    });
    score -= 10;
  } else {
    issues.push({
      type: 'good',
      icon: '✓',
      title: 'Good contrast',
      desc: 'Strong contrast detected. Logo should remain visible across light and dark browser UIs.',
    });
  }

  /* ── Check 3: Overly complex / detailed image ── */
  const complexityScore = measureComplexity(data16, 16);
  if (complexityScore > 0.75) {
    issues.push({
      type: 'error',
      icon: '✗',
      title: 'Too much detail for 16px',
      desc: 'High visual complexity detected. Fine details will blur into noise at favicon size. Consider a simplified mark.',
    });
    score -= 25;
  } else if (complexityScore > 0.5) {
    issues.push({
      type: 'warn',
      icon: '⚠',
      title: 'Moderate complexity',
      desc: 'Some detail may be lost at 16px. Works, but a simplified version would be sharper.',
    });
    score -= 8;
  } else {
    issues.push({
      type: 'good',
      icon: '✓',
      title: 'Clean at small sizes',
      desc: 'Low complexity image. Should remain legible and recognizable at favicon size.',
    });
  }

  /* ── Check 4: Mostly blank / empty ── */
  const coverage = measureCoverage(data16, 16);
  if (coverage < 0.1) {
    issues.push({
      type: 'error',
      icon: '✗',
      title: 'Near-empty favicon',
      desc: 'Very little visible content detected. Favicon appears almost blank. Check padding settings.',
    });
    score -= 35;
  }

  /* ── Check 5: Shape recommendation ── */
  const aspectRatio = state.sourceImage.naturalWidth / state.sourceImage.naturalHeight;
  if (Math.abs(aspectRatio - 1) > 0.4) {
    issues.push({
      type: 'warn',
      icon: '⚠',
      title: 'Non-square logo',
      desc: `Your logo is ${Math.round(aspectRatio * 10) / 10}:1 aspect ratio. Wide/tall logos lose significant detail at 16px square. A square mark version is recommended.`,
    });
    score -= 10;
  }

  /* ── Check 6: No background on light browsers ── */
  if (state.background === 'transparent') {
    const hasDarkContent = detectDarkContent(data16, 16);
    if (hasDarkContent) {
      issues.push({
        type: 'warn',
        icon: '⚠',
        title: 'Dark logo on transparent background',
        desc: 'Transparent favicon with dark content may vanish on light browser UIs. Consider adding a white or colored background.',
      });
      score -= 8;
    }
  }

  score = Math.max(0, Math.min(100, score));
  return { score, issues };
}

/* ── Pixel analysis helpers ── */

/** Returns fraction of edge pixels that are fully transparent */
function detectEdgePadding(data, size) {
  let transparent = 0;
  let total = 0;
  const edge = 2; // check 2-pixel border
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      if (x < edge || x >= size - edge || y < edge || y >= size - edge) {
        const idx = (y * size + x) * 4;
        total++;
        if (data[idx + 3] < 20) transparent++;
      }
    }
  }
  return transparent / total;
}

/**
 * Measures contrast as the standard deviation of luminance values.
 * Higher = more contrast variation (good).
 */
function measureContrast(data, size) {
  const luminances = [];
  for (let i = 0; i < data.length; i += 4) {
    if (data[i + 3] < 20) continue; // skip transparent
    const r = data[i] / 255;
    const g = data[i + 1] / 255;
    const b = data[i + 2] / 255;
    luminances.push(0.2126 * r + 0.7152 * g + 0.0722 * b);
  }
  if (luminances.length < 10) return 0;
  const mean = luminances.reduce((a, b) => a + b, 0) / luminances.length;
  const variance = luminances.reduce((sum, l) => sum + Math.pow(l - mean, 2), 0) / luminances.length;
  return Math.sqrt(variance); // 0-0.5ish
}

/**
 * Measures image complexity by counting unique color clusters
 * across the 16px render. Higher = more complex.
 */
function measureComplexity(data, size) {
  let edgeCount = 0;
  // Simple edge detection: compare each pixel to right/bottom neighbor
  for (let y = 0; y < size - 1; y++) {
    for (let x = 0; x < size - 1; x++) {
      const idx = (y * size + x) * 4;
      const idxR = (y * size + (x + 1)) * 4;
      const idxB = ((y + 1) * size + x) * 4;
      const diffR = Math.abs(data[idx] - data[idxR]) + Math.abs(data[idx + 1] - data[idxR + 1]) + Math.abs(data[idx + 2] - data[idxR + 2]);
      const diffB = Math.abs(data[idx] - data[idxB]) + Math.abs(data[idx + 1] - data[idxB + 1]) + Math.abs(data[idx + 2] - data[idxB + 2]);
      if (diffR > 30 || diffB > 30) edgeCount++;
    }
  }
  const maxEdges = (size - 1) * (size - 1);
  return edgeCount / maxEdges;
}

/** Returns fraction of pixels with alpha > 20 (visible coverage) */
function measureCoverage(data, size) {
  let visible = 0;
  for (let i = 3; i < data.length; i += 4) {
    if (data[i] > 20) visible++;
  }
  return visible / (size * size);
}

/** Checks if majority of non-transparent pixels are dark (could vanish on light UI) */
function detectDarkContent(data, size) {
  let dark = 0, total = 0;
  for (let i = 0; i < data.length; i += 4) {
    if (data[i + 3] < 20) continue;
    total++;
    const lum = (data[i] + data[i + 1] + data[i + 2]) / 3;
    if (lum < 80) dark++;
  }
  if (total < 10) return false;
  return (dark / total) > 0.5;
}

/* ── Verdict display ── */

const RATING_LEVELS = [
  { min: 85, label: 'Excellent',            cls: 'rating-excellent', desc: 'Your favicon survives at 16px. Clean, readable, and identifiable.' },
  { min: 65, label: 'Usable',               cls: 'rating-usable',    desc: 'Readable but has room for improvement. Will work for most use cases.' },
  { min: 45, label: 'Risky',                cls: 'rating-risky',     desc: 'Some users will struggle to identify this at tiny sizes. Consider simplifying.' },
  { min: 25, label: 'Blob Territory',       cls: 'rating-blob',      desc: 'Logo is losing its identity at favicon scale. Major redesign recommended.' },
  { min: 0,  label: 'Fighting For Its Life',cls: 'rating-fighting',  desc: 'This favicon will not survive. Your branding needs a favicon-optimized mark.' },
];

function computeVerdict() {
  const { score, issues } = analyzeReadability();

  const rating = RATING_LEVELS.find(r => score >= r.min);

  els.verdictRating.textContent = rating.label;
  els.verdictRating.className = 'verdict-rating ' + rating.cls;
  els.verdictDesc.textContent = `Score: ${score}/100 — ${rating.desc}`;

  // Show report
  renderReport(issues);
  updateRecommendationCta(score);
  els.reportSection.classList.remove('hidden');
}

function updateRecommendationCta(score) {
  if (score >= 65) {
    els.recommendationCta.classList.add('hidden');
    return;
  }

  if (score >= 45) {
    els.recommendationTitle.textContent = 'This favicon is usable, but the brand mark could be sharper';
    els.recommendationBody.textContent = 'A simplified favicon version would make the mark easier to recognize in tabs, bookmarks, and mobile shortcuts.';
  } else {
    els.recommendationTitle.textContent = 'Your logo is struggling at favicon size';
    els.recommendationBody.textContent = 'This is exactly where a favicon-optimized brand mark helps. I can refine the mark so it survives the smallest places your brand appears.';
  }

  els.recommendationCta.classList.remove('hidden');
}

/* ── Render Findings ── */
function renderReport(issues) {
  els.reportFindings.innerHTML = '';
  issues.forEach(issue => {
    const el = document.createElement('div');
    el.className = `finding-item finding-item--${issue.type}`;
    el.innerHTML = `
      <span class="finding-icon">${issue.icon}</span>
      <div class="finding-text">
        <div class="finding-title">${issue.title}</div>
        <div class="finding-desc">${issue.desc}</div>
      </div>
    `;
    els.reportFindings.appendChild(el);
  });
}

/* ═══════════════════════════════════════
   DOWNLOAD (dependency-free ZIP + ICO)
   ═══════════════════════════════════════ */

/**
 * Generates all favicon sizes and packages them into a ZIP.
 * Includes a real multi-entry .ico and a maskable PWA icon.
 */
async function generateAndDownload() {
  if (!state.sourceImage) return;

  setDownloadState('working', 'Building favicon pack...');

  try {
    const zip = new SimpleZip();
    const pngFiles = [
      { name: 'favicon-16x16.png', size: 16 },
      { name: 'favicon-32x32.png', size: 32 },
      { name: 'apple-touch-icon.png', size: 180 },
      { name: 'android-chrome-192x192.png', size: 192 },
      { name: 'android-chrome-512x512.png', size: 512 },
    ];

    for (const file of pngFiles) {
      const canvas = document.createElement('canvas');
      renderFavicon(canvas, file.size);
      const blob = await canvasToBlob(canvas);
      await zip.addFile(`favicon-pack/${file.name}`, blob);
    }

    const maskableCanvas = renderMaskableIcon(512);
    await zip.addFile('favicon-pack/android-chrome-maskable-512x512.png', await canvasToBlob(maskableCanvas));
    await zip.addFile('favicon-pack/favicon.ico', await generateIcoBlob([16, 32, 48]));
    await zip.addFile('favicon-pack/site.webmanifest', generateManifest());
    await zip.addFile('favicon-pack/README.txt', generateReadme());

    downloadBlob(zip.generateBlob(), 'favicon-pack.zip');
    setDownloadState('success', 'Favicon pack generated.');
  } catch (error) {
    console.error(error);
    setDownloadState('error', 'Could not generate the pack. Try a PNG/JPG version of the image or reduce the file size.');
  }
}

/** Convert canvas to PNG Blob */
function canvasToBlob(canvas) {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (!blob) {
        reject(new Error('Canvas export failed'));
        return;
      }
      resolve(blob);
    }, 'image/png');
  });
}

function setDownloadState(type, message) {
  els.downloadBtn.disabled = type === 'working';
  els.downloadBtn.classList.toggle('is-loading', type === 'working');
  els.downloadBtn.querySelector('.btn-icon').textContent = type === 'working' ? '…' : '⬇';
  els.downloadStatus.textContent = message;
  els.downloadStatus.className = `download-status download-status--${type}`;
}

function downloadBlob(blob, fileName) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function renderMaskableIcon(size) {
  const canvas = document.createElement('canvas');
  const bg = state.background === 'transparent' ? 'white' : state.background;
  renderFavicon(canvas, size, {
    background: bg,
    padding: Math.max(state.padding, 0.12),
    shape: 'square',
    crop: 'contain',
  });
  return canvas;
}

function generateManifest() {
  const siteName = state.sourceFileName || 'My Site';
  const themeColor = state.background === 'custom'
    ? state.customColor
    : state.background === 'black'
      ? '#000000'
      : '#ffffff';

  return JSON.stringify({
    name: siteName,
    short_name: siteName.slice(0, 12),
    icons: [
      { src: '/android-chrome-192x192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: '/android-chrome-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
      { src: '/android-chrome-maskable-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
    theme_color: themeColor,
    background_color: themeColor,
    display: 'standalone',
  }, null, 2);
}

async function generateIcoBlob(sizes) {
  const images = [];

  for (const size of sizes) {
    const canvas = document.createElement('canvas');
    renderFavicon(canvas, size);
    const blob = await canvasToBlob(canvas);
    images.push({ size, bytes: new Uint8Array(await blob.arrayBuffer()) });
  }

  const dirSize = 6 + images.length * 16;
  const totalSize = dirSize + images.reduce((sum, img) => sum + img.bytes.length, 0);
  const out = new Uint8Array(totalSize);
  const view = new DataView(out.buffer);
  let offset = 0;

  view.setUint16(offset, 0, true); offset += 2;
  view.setUint16(offset, 1, true); offset += 2;
  view.setUint16(offset, images.length, true); offset += 2;

  let imageOffset = dirSize;
  images.forEach((img) => {
    out[offset++] = img.size >= 256 ? 0 : img.size;
    out[offset++] = img.size >= 256 ? 0 : img.size;
    out[offset++] = 0;
    out[offset++] = 0;
    view.setUint16(offset, 1, true); offset += 2;
    view.setUint16(offset, 32, true); offset += 2;
    view.setUint32(offset, img.bytes.length, true); offset += 4;
    view.setUint32(offset, imageOffset, true); offset += 4;
    imageOffset += img.bytes.length;
  });

  imageOffset = dirSize;
  images.forEach((img) => {
    out.set(img.bytes, imageOffset);
    imageOffset += img.bytes.length;
  });

  return new Blob([out], { type: 'image/x-icon' });
}

class SimpleZip {
  constructor() {
    this.entries = [];
  }

  async addFile(name, data) {
    const bytes = await toZipBytes(data);
    this.entries.push({
      name,
      bytes,
      crc: crc32(bytes),
      date: new Date(),
    });
  }

  generateBlob() {
    const fileRecords = [];
    const centralRecords = [];
    let offset = 0;

    this.entries.forEach((entry) => {
      const encodedName = new TextEncoder().encode(entry.name);
      const local = createLocalHeader(entry, encodedName);
      fileRecords.push(local, encodedName, entry.bytes);
      centralRecords.push({ entry, encodedName, offset });
      offset += local.length + encodedName.length + entry.bytes.length;
    });

    const centralOffset = offset;
    const centralChunks = centralRecords.map(record => createCentralHeader(record.entry, record.encodedName, record.offset));
    const centralSize = centralChunks.reduce((sum, chunk) => sum + chunk.length, 0);
    const end = createEndRecord(this.entries.length, centralSize, centralOffset);

    return new Blob([...fileRecords, ...centralChunks, end], { type: 'application/zip' });
  }
}

async function toZipBytes(data) {
  if (data instanceof Uint8Array) return data;
  if (data instanceof Blob) return new Uint8Array(await data.arrayBuffer());
  if (data instanceof ArrayBuffer) return new Uint8Array(data);
  return new TextEncoder().encode(String(data));
}

function createLocalHeader(entry, encodedName) {
  const header = new Uint8Array(30);
  const view = new DataView(header.buffer);
  const { time, date } = toDosDateTime(entry.date);

  view.setUint32(0, 0x04034b50, true);
  view.setUint16(4, 20, true);
  view.setUint16(6, 0, true);
  view.setUint16(8, 0, true);
  view.setUint16(10, time, true);
  view.setUint16(12, date, true);
  view.setUint32(14, entry.crc, true);
  view.setUint32(18, entry.bytes.length, true);
  view.setUint32(22, entry.bytes.length, true);
  view.setUint16(26, encodedName.length, true);
  view.setUint16(28, 0, true);

  return header;
}

function createCentralHeader(entry, encodedName, localOffset) {
  const header = new Uint8Array(46 + encodedName.length);
  const view = new DataView(header.buffer);
  const { time, date } = toDosDateTime(entry.date);

  view.setUint32(0, 0x02014b50, true);
  view.setUint16(4, 20, true);
  view.setUint16(6, 20, true);
  view.setUint16(8, 0, true);
  view.setUint16(10, 0, true);
  view.setUint16(12, time, true);
  view.setUint16(14, date, true);
  view.setUint32(16, entry.crc, true);
  view.setUint32(20, entry.bytes.length, true);
  view.setUint32(24, entry.bytes.length, true);
  view.setUint16(28, encodedName.length, true);
  view.setUint16(30, 0, true);
  view.setUint16(32, 0, true);
  view.setUint16(34, 0, true);
  view.setUint16(36, 0, true);
  view.setUint32(38, 0, true);
  view.setUint32(42, localOffset, true);
  header.set(encodedName, 46);

  return header;
}

function createEndRecord(entryCount, centralSize, centralOffset) {
  const header = new Uint8Array(22);
  const view = new DataView(header.buffer);

  view.setUint32(0, 0x06054b50, true);
  view.setUint16(4, 0, true);
  view.setUint16(6, 0, true);
  view.setUint16(8, entryCount, true);
  view.setUint16(10, entryCount, true);
  view.setUint32(12, centralSize, true);
  view.setUint32(16, centralOffset, true);
  view.setUint16(20, 0, true);

  return header;
}

function toDosDateTime(date) {
  const time = (date.getHours() << 11) | (date.getMinutes() << 5) | Math.floor(date.getSeconds() / 2);
  const dosDate = ((date.getFullYear() - 1980) << 9) | ((date.getMonth() + 1) << 5) | date.getDate();
  return { time, date: dosDate };
}

function crc32(bytes) {
  let crc = 0xffffffff;
  for (let i = 0; i < bytes.length; i++) {
    crc = (crc >>> 8) ^ CRC_TABLE[(crc ^ bytes[i]) & 0xff];
  }
  return (crc ^ 0xffffffff) >>> 0;
}

const CRC_TABLE = (() => {
  const table = new Uint32Array(256);
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let k = 0; k < 8; k++) {
      c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    }
    table[i] = c >>> 0;
  }
  return table;
})();

/** Generate a helpful README for the ZIP */
function generateReadme() {
  return `FAVICON PACK
Generated by Favicon Forge · ManicWebmaster
https://manicwebmaster.com

═══════════════════════════════════════
FILES INCLUDED
═══════════════════════════════════════

favicon-16x16.png         — Standard browser tab favicon
favicon-32x32.png         — High-res favicon / Windows taskbar
favicon.ico               — Multi-size ICO containing 16×16, 32×32, and 48×48 icons
apple-touch-icon.png      — iOS home screen icon (180×180)
android-chrome-192x192.png — Android Chrome icon
android-chrome-512x512.png — PWA splash screen icon
android-chrome-maskable-512x512.png — Maskable PWA icon with safe-zone padding
site.webmanifest          — PWA manifest file

═══════════════════════════════════════
INSTALLATION
═══════════════════════════════════════

1. Place all files in your website root directory.

2. Add this HTML to your <head>:

<link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png">
<link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png">
<link rel="icon" href="/favicon.ico" sizes="any">
<link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png">
<link rel="manifest" href="/site.webmanifest">

3. Done! Clear your browser cache to see the updated favicon.

═══════════════════════════════════════
NEED HELP WITH YOUR BRAND OR WEBSITE?
═══════════════════════════════════════

→ Logo design: hello@manicwebmaster.com
→ Website build: hello@manicwebmaster.com
→ ManicWebmaster.com

Built free for the web community.
`;
}

/* ── Download button ── */
els.downloadBtn.addEventListener('click', generateAndDownload);

/* ═══════════════════════════════════════
   HTML SNIPPET
   ═══════════════════════════════════════ */

function generateSnippet() {
  return `<link rel="icon" href="/favicon.ico" sizes="any">
<link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png">
<link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png">
<link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png">
<link rel="manifest" href="/site.webmanifest">`;
}

els.copySnippetBtn.addEventListener('click', () => {
  const snippet = generateSnippet();
  els.snippetCode.textContent = snippet;
  els.snippetPanel.classList.remove('hidden');
  copyToClipboard(snippet);
  showCopyToast();
});

els.copySnippetClose.addEventListener('click', () => {
  els.snippetPanel.classList.add('hidden');
});

els.copySnippetAgain.addEventListener('click', () => {
  copyToClipboard(els.snippetCode.textContent);
  showCopyToast();
});

function copyToClipboard(text) {
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(text).catch(() => fallbackCopy(text));
  } else {
    fallbackCopy(text);
  }
}

function fallbackCopy(text) {
  const ta = document.createElement('textarea');
  ta.value = text;
  ta.style.position = 'fixed';
  ta.style.opacity = '0';
  document.body.appendChild(ta);
  ta.select();
  try { document.execCommand('copy'); } catch {}
  document.body.removeChild(ta);
}

function showCopyToast() {
  els.copyToast.classList.remove('hidden');
  setTimeout(() => els.copyToast.classList.add('hidden'), 2500);
}

/* ═══════════════════════════════════════
   MASTER REGENERATE
   ═══════════════════════════════════════ */

/**
 * Called whenever state changes (settings or new image).
 * Updates all canvases and derived UI in one pass.
 */
function regenerateAll() {
  if (!state.sourceImage) return;

  updatePreviews();
  updateReadabilityTest();
  showDownloadPanel();
}

function showDownloadPanel() {
  els.downloadPlaceholder.classList.add('hidden');
  els.downloadContent.classList.remove('hidden');
  if (!els.downloadBtn.disabled) {
    els.downloadStatus.className = 'download-status hidden';
    els.downloadStatus.textContent = '';
  }
}

/* ═══════════════════════════════════════
   INIT
   ═══════════════════════════════════════ */

// Nothing to do on init — all reactive to user image upload.
// Dev note: to test with a default image, call loadImageFile() with a File object here.
