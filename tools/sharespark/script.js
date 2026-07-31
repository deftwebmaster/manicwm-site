/* ================================================================
   SHARESPARK — script.js
   ManicWebmaster | Canvas renderer + editor engine
================================================================ */

'use strict';

// ---------------------------------------------------------------
// STATE
// ---------------------------------------------------------------
const state = {
  title:       'Your Headline Goes Here',
  subtitle:    'A short, compelling description of what this page or product is about.',
  domain:      'yourdomain.com',
  author:      'Your Name',
  cta:         'Learn More →',
  accentColor: '#00e5ff',
  preset:      'dark-neon',
  layout:      'centered',
  glow:        60,
  radius:      16,
  border:      true,
  gradient:    true,
  logoImage:   null,
  bgImage:     null,
  logoDataUrl:  null,
  bgDataUrl:    null,
};

const DRAFT_KEY = 'sharespark:draft:v1';
const DRAFT_FIELDS = [
  'title',
  'subtitle',
  'domain',
  'author',
  'cta',
  'accentColor',
  'preset',
  'layout',
  'glow',
  'radius',
  'border',
  'gradient',
  'logoDataUrl',
  'bgDataUrl',
];

// ---------------------------------------------------------------
// PRESET DEFINITIONS
// Each preset defines canvas drawing parameters
// ---------------------------------------------------------------
const PRESETS = {
  'dark-neon': {
    label:       'Dark Neon',
    bgStart:     '#060d14',
    bgEnd:       '#0d1a26',
    textPrimary: '#f0f4f8',
    textSub:     '#8a97a6',
    textDomain:  '#00e5ff',
    overlayType: 'noise-glow',
    fontTitle:   'bold 72px Syne, sans-serif',
    fontSub:     '400 28px DM Mono, monospace',
    fontDomain:  '500 20px DM Mono, monospace',
    fontAuthor:  '600 22px Plus Jakarta Sans, sans-serif',
    fontCta:     '700 22px Plus Jakarta Sans, sans-serif',
  },
  'minimal': {
    label:       'Minimal Editorial',
    bgStart:     '#f5f0e8',
    bgEnd:       '#ede8e0',
    textPrimary: '#1a1a1a',
    textSub:     '#4a4a4a',
    textDomain:  '#888',
    overlayType: 'grid-lines',
    fontTitle:   'bold 72px Syne, sans-serif',
    fontSub:     '400 26px DM Mono, monospace',
    fontDomain:  '500 18px DM Mono, monospace',
    fontAuthor:  '600 22px Plus Jakarta Sans, sans-serif',
    fontCta:     '700 22px Plus Jakarta Sans, sans-serif',
  },
  'startup': {
    label:       'Startup Clean',
    bgStart:     '#667eea',
    bgEnd:       '#764ba2',
    textPrimary: '#ffffff',
    textSub:     'rgba(255,255,255,0.8)',
    textDomain:  'rgba(255,255,255,0.6)',
    overlayType: 'soft-fade',
    fontTitle:   'bold 72px Syne, sans-serif',
    fontSub:     '400 26px DM Mono, monospace',
    fontDomain:  '500 18px DM Mono, monospace',
    fontAuthor:  '600 22px Plus Jakarta Sans, sans-serif',
    fontCta:     '700 22px Plus Jakarta Sans, sans-serif',
  },
  'bold': {
    label:       'Bold Contrast',
    bgStart:     '#0a0a0a',
    bgEnd:       '#111111',
    textPrimary: '#ffffff',
    textSub:     '#999999',
    textDomain:  '#666666',
    overlayType: 'accent-bar',
    fontTitle:   '800 82px Syne, sans-serif',
    fontSub:     '400 24px DM Mono, monospace',
    fontDomain:  '500 18px DM Mono, monospace',
    fontAuthor:  '600 22px Plus Jakarta Sans, sans-serif',
    fontCta:     '700 24px Plus Jakarta Sans, sans-serif',
  },
  'studio': {
    label:       'Creative Studio',
    bgStart:     '#1a0a2e',
    bgEnd:       '#0d0820',
    textPrimary: '#f8f0ff',
    textSub:     '#c4a8e8',
    textDomain:  '#8a6ab0',
    overlayType: 'mesh-gradient',
    fontTitle:   'bold 70px Syne, sans-serif',
    fontSub:     '400 26px DM Mono, monospace',
    fontDomain:  '500 18px DM Mono, monospace',
    fontAuthor:  '600 22px Plus Jakarta Sans, sans-serif',
    fontCta:     '700 22px Plus Jakarta Sans, sans-serif',
  },
};

// ---------------------------------------------------------------
// CANVAS REFERENCES
// ---------------------------------------------------------------
const mainCanvas    = document.getElementById('mainCanvas');
const twitterCanvas = document.getElementById('twitterCanvas');
const imessageCanvas= document.getElementById('imessageCanvas');
const discordCanvas = document.getElementById('discordCanvas');

// ---------------------------------------------------------------
// HIDPI DISPLAY CANVAS SETUP
// The main canvas exports at 1200x630 regardless of DPR.
// For the on-screen preview we scale the canvas backing store by
// devicePixelRatio so it's crisp on Retina/HiDPI displays.
// ---------------------------------------------------------------
function setupHiDPICanvas(canvas) {
  const dpr     = window.devicePixelRatio || 1;
  const rect    = canvas.getBoundingClientRect();
  // Only update if size actually changed to avoid unnecessary resets
  const targetW = Math.round(rect.width  * dpr);
  const targetH = Math.round(rect.height * dpr);
  if (canvas.width !== targetW || canvas.height !== targetH) {
    canvas.width  = targetW;
    canvas.height = targetH;
    const ctx = canvas.getContext('2d');
    ctx.scale(dpr, dpr);
  }
}

// Observe main canvas container for size changes (handles resize)
let _resizeObserver = null;
function initHiDPI() {
  _resizeObserver = new ResizeObserver(() => render());
  _resizeObserver.observe(mainCanvas.parentElement);
}

// ---------------------------------------------------------------
// DRAW ENGINE — renders onto a given canvas at native resolution
// ---------------------------------------------------------------
function drawCard(canvas, w, h, isDisplay = false) {
  const dpr = (isDisplay && window.devicePixelRatio) ? window.devicePixelRatio : 1;
  const physW = Math.round(w * dpr);
  const physH = Math.round(h * dpr);

  // Only reset dimensions when they actually change — avoids flash
  if (canvas.width !== physW || canvas.height !== physH) {
    canvas.width  = physW;
    canvas.height = physH;
  }

  const ctx = canvas.getContext('2d');
  ctx.save();
  if (dpr !== 1) ctx.scale(dpr, dpr);
  ctx.clearRect(0, 0, w, h);

  const p     = PRESETS[state.preset];
  const r     = Math.min(state.radius, Math.min(w, h) * 0.06);
  const scale = w / 1200; // scale all measurements from 1200 base

  // ---- BACKGROUND ----
  if (state.bgImage) {
    drawBgImage(ctx, w, h, r);
  } else {
    drawBgGradient(ctx, w, h, r, p);
  }

  // ---- OVERLAY EFFECTS ----
  drawOverlay(ctx, w, h, r, p, scale);

  // ---- BORDER ----
  if (state.border) {
    drawBorder(ctx, w, h, r, scale);
  }

  // ---- GLOW ----
  if (state.glow > 0 && p.overlayType !== 'minimal') {
    drawGlow(ctx, w, h, scale);
  }

  // ---- CONTENT ----
  switch (state.layout) {
    case 'left':   drawContentLeft(ctx, w, h, p, scale); break;
    case 'split':  drawContentSplit(ctx, w, h, p, scale); break;
    default:       drawContentCentered(ctx, w, h, p, scale); break;
  }

  ctx.restore();
}

// ---------------------------------------------------------------
// BACKGROUND HELPERS
// ---------------------------------------------------------------
function drawBgGradient(ctx, w, h, r, p) {
  const grad = ctx.createLinearGradient(0, 0, w, h);
  grad.addColorStop(0, p.bgStart);
  grad.addColorStop(1, p.bgEnd);

  roundRect(ctx, 0, 0, w, h, r);
  ctx.fillStyle = grad;
  ctx.fill();
}

function drawBgImage(ctx, w, h, r) {
  roundRect(ctx, 0, 0, w, h, r);
  ctx.save();
  ctx.clip();
  // Cover-fit the uploaded image
  const img = state.bgImage;
  const iw  = img.naturalWidth  || img.width;
  const ih  = img.naturalHeight || img.height;
  const scale = Math.max(w / iw, h / ih);
  const dw = iw * scale;
  const dh = ih * scale;
  ctx.drawImage(img, (w - dw) / 2, (h - dh) / 2, dw, dh);
  // Darken overlay
  if (state.gradient) {
    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    ctx.fillRect(0, 0, w, h);
  }
  ctx.restore();
}

// ---------------------------------------------------------------
// OVERLAY EFFECTS
// ---------------------------------------------------------------
function drawOverlay(ctx, w, h, r, p, scale) {
  switch (p.overlayType) {
    case 'noise-glow':
      drawNoiseGlow(ctx, w, h, scale);
      break;
    case 'grid-lines':
      drawGridLines(ctx, w, h, scale);
      break;
    case 'accent-bar':
      drawAccentBar(ctx, w, h, scale);
      break;
    case 'mesh-gradient':
      drawMeshGradient(ctx, w, h, scale);
      break;
    case 'soft-fade':
      drawSoftFade(ctx, w, h, scale);
      break;
    default: break;
  }
}

function drawNoiseGlow(ctx, w, h, scale) {
  // Radial cyan glow in corner
  const glo = ctx.createRadialGradient(w * 0.7, h * 0.2, 0, w * 0.7, h * 0.2, w * 0.5);
  const alpha = state.glow / 100 * 0.35;
  glo.addColorStop(0, hexToRgba(state.accentColor, alpha));
  glo.addColorStop(1, 'transparent');
  ctx.fillStyle = glo;
  ctx.fillRect(0, 0, w, h);

  // Violet glow bottom-left
  const glo2 = ctx.createRadialGradient(w * 0.1, h * 0.8, 0, w * 0.1, h * 0.8, w * 0.4);
  glo2.addColorStop(0, hexToRgba('#bf5af2', alpha * 0.7));
  glo2.addColorStop(1, 'transparent');
  ctx.fillStyle = glo2;
  ctx.fillRect(0, 0, w, h);
}

function drawGridLines(ctx, w, h, scale) {
  ctx.strokeStyle = 'rgba(0,0,0,0.06)';
  ctx.lineWidth   = scale;
  const step = 40 * scale;
  for (let x = 0; x < w; x += step) {
    ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke();
  }
  for (let y = 0; y < h; y += step) {
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke();
  }
}

function drawAccentBar(ctx, w, h, scale) {
  // Top accent bar
  ctx.fillStyle = state.accentColor;
  ctx.fillRect(0, 0, w, 8 * scale);
}

function drawMeshGradient(ctx, w, h, scale) {
  // Soft mesh blobs
  const blobs = [
    { x: 0.15, y: 0.3, r: 0.4, c: '#bf5af2' },
    { x: 0.8,  y: 0.7, r: 0.5, c: '#7c3aed' },
    { x: 0.5,  y: 0.1, r: 0.35, c: state.accentColor },
  ];
  blobs.forEach(b => {
    const alpha = (state.glow / 100) * 0.2;
    const g = ctx.createRadialGradient(b.x * w, b.y * h, 0, b.x * w, b.y * h, b.r * w);
    g.addColorStop(0, hexToRgba(b.c, alpha));
    g.addColorStop(1, 'transparent');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
  });
}

function drawSoftFade(ctx, w, h, scale) {
  const g = ctx.createLinearGradient(0, 0, 0, h);
  g.addColorStop(0, 'rgba(255,255,255,0.15)');
  g.addColorStop(1, 'rgba(0,0,0,0.1)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);
}

function drawBorder(ctx, w, h, r, scale) {
  roundRect(ctx, 0, 0, w, h, r);
  ctx.strokeStyle = hexToRgba(state.accentColor, 0.35);
  ctx.lineWidth   = 2 * scale;
  ctx.stroke();
}

function drawGlow(ctx, w, h, scale) {
  const alpha = (state.glow / 100) * 0.6;
  const g = ctx.createLinearGradient(0, 0, w, 0);
  g.addColorStop(0, hexToRgba(state.accentColor, alpha * 0.4));
  g.addColorStop(0.5, 'transparent');
  g.addColorStop(1, hexToRgba(state.accentColor, alpha * 0.2));

  // Edge glow line at top
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, 2 * scale);
}

// ---------------------------------------------------------------
// CONTENT LAYOUTS
// ---------------------------------------------------------------
function drawContentCentered(ctx, w, h, p, scale) {
  const pad = 80 * scale;
  const cx  = w / 2;

  // Logo (centered top)
  let logoY = h * 0.22;
  if (state.logoImage) {
    const lh = 56 * scale;
    const lw = Math.min(state.logoImage.naturalWidth / state.logoImage.naturalHeight * lh, 200 * scale);
    ctx.drawImage(state.logoImage, cx - lw / 2, logoY - lh / 2, lw, lh);
    logoY += lh / 2 + 24 * scale;
  }

  // Title
  ctx.font = scaleFont(p.fontTitle, scale);
  ctx.fillStyle = p.textPrimary;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  const titleY = state.logoImage ? logoY : h * 0.26;
  wrapText(ctx, state.title, cx, titleY, w - pad * 2, lineH(p.fontTitle, scale));

  // Subtitle
  if (state.subtitle) {
    const subY = titleY + estimateTextHeight(ctx, state.title, w - pad * 2, lineH(p.fontTitle, scale)) + 20 * scale;
    ctx.font = scaleFont(p.fontSub, scale);
    ctx.fillStyle = p.textSub;
    wrapText(ctx, state.subtitle, cx, subY, w - pad * 2.5, lineH(p.fontSub, scale), 2);
  }

  // Domain
  if (state.domain) {
    ctx.font = scaleFont(p.fontDomain, scale);
    ctx.fillStyle = p.textDomain;
    ctx.fillText(state.domain.replace(/^https?:\/\//, ''), cx, h - 80 * scale);
  }

  // CTA badge
  if (state.cta) {
    drawCtaBadge(ctx, state.cta, cx, h - 140 * scale, p, scale, true);
  }

  // Author bottom-left
  if (state.author) {
    ctx.font = scaleFont(p.fontAuthor, scale);
    ctx.fillStyle = p.textSub;
    ctx.textAlign = 'left';
    ctx.fillText(state.author, pad, h - 80 * scale);
  }
}

function drawContentLeft(ctx, w, h, p, scale) {
  const pad  = 80 * scale;
  const maxW = w * 0.6;

  // Logo
  let topY = h * 0.14;
  if (state.logoImage) {
    const lh = 50 * scale;
    const lw = Math.min(state.logoImage.naturalWidth / state.logoImage.naturalHeight * lh, 160 * scale);
    ctx.drawImage(state.logoImage, pad, topY - lh / 2, lw, lh);
    topY += lh / 2 + 20 * scale;
  }

  ctx.textAlign  = 'left';
  ctx.textBaseline = 'top';

  // Title
  ctx.font = scaleFont(p.fontTitle, scale);
  ctx.fillStyle = p.textPrimary;
  wrapText(ctx, state.title, pad, topY, maxW, lineH(p.fontTitle, scale));

  // Subtitle
  if (state.subtitle) {
    const subY = topY + estimateTextHeight(ctx, state.title, maxW, lineH(p.fontTitle, scale)) + 16 * scale;
    ctx.font = scaleFont(p.fontSub, scale);
    ctx.fillStyle = p.textSub;
    wrapText(ctx, state.subtitle, pad, subY, maxW * 0.85, lineH(p.fontSub, scale), 2);
  }

  // CTA
  if (state.cta) {
    drawCtaBadge(ctx, state.cta, pad, h - 150 * scale, p, scale, false);
  }

  // Domain + Author bottom
  ctx.font = scaleFont(p.fontDomain, scale);
  ctx.fillStyle = p.textDomain;
  ctx.fillText(state.domain.replace(/^https?:\/\//, ''), pad, h - 76 * scale);

  if (state.author) {
    ctx.font = scaleFont(p.fontAuthor, scale);
    ctx.fillStyle = p.textSub;
    ctx.textAlign = 'right';
    ctx.fillText(state.author, w - pad, h - 76 * scale);
  }
}

function drawContentSplit(ctx, w, h, p, scale) {
  const pad  = 80 * scale;
  const leftW = w * 0.55;

  ctx.textAlign  = 'left';
  ctx.textBaseline = 'top';

  // Logo right
  if (state.logoImage) {
    const logoX = w * 0.72;
    const logoY = h * 0.3;
    const lh = 100 * scale;
    const lw = Math.min(state.logoImage.naturalWidth / state.logoImage.naturalHeight * lh, 200 * scale);
    ctx.drawImage(state.logoImage, logoX - lw / 2, logoY - lh / 2, lw, lh);
  } else {
    // Placeholder box
    ctx.strokeStyle = hexToRgba(state.accentColor, 0.15);
    ctx.lineWidth   = 2 * scale;
    ctx.setLineDash([6 * scale, 4 * scale]);
    ctx.strokeRect(w * 0.65, h * 0.25, 200 * scale, 150 * scale);
    ctx.setLineDash([]);
  }

  // Title
  const titleY = h * 0.22;
  ctx.font = scaleFont(p.fontTitle, scale);
  ctx.fillStyle = p.textPrimary;
  wrapText(ctx, state.title, pad, titleY, leftW - pad, lineH(p.fontTitle, scale));

  // Subtitle
  if (state.subtitle) {
    const subY = titleY + estimateTextHeight(ctx, state.title, leftW - pad, lineH(p.fontTitle, scale)) + 16 * scale;
    ctx.font = scaleFont(p.fontSub, scale);
    ctx.fillStyle = p.textSub;
    wrapText(ctx, state.subtitle, pad, subY, leftW - pad - 20 * scale, lineH(p.fontSub, scale), 2);
  }

  // Bottom row
  if (state.cta) {
    drawCtaBadge(ctx, state.cta, pad, h - 150 * scale, p, scale, false);
  }

  ctx.font = scaleFont(p.fontDomain, scale);
  ctx.fillStyle = p.textDomain;
  ctx.textAlign = 'left';
  ctx.fillText(state.domain.replace(/^https?:\/\//, ''), pad, h - 76 * scale);

  if (state.author) {
    ctx.font = scaleFont(p.fontAuthor, scale);
    ctx.fillStyle = p.textSub;
    ctx.fillText(state.author, pad, h - 48 * scale);
  }
}

// ---------------------------------------------------------------
// CTA BADGE
// ---------------------------------------------------------------
function drawCtaBadge(ctx, text, x, y, p, scale, centered) {
  ctx.font = scaleFont(p.fontCta, scale);
  const m    = ctx.measureText(text);
  const tw   = m.width;
  const ph   = 20 * scale;
  const pv   = 12 * scale;
  const bw   = tw + ph * 2;
  const bh   = 44 * scale;
  const bx   = centered ? x - bw / 2 : x;
  const by   = y;
  const br   = bh / 2;

  // Badge background
  ctx.fillStyle = state.accentColor;
  roundRect(ctx, bx, by, bw, bh, br);
  ctx.fill();

  // Badge text
  ctx.fillStyle = '#000';
  ctx.textAlign = centered ? 'center' : 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, centered ? x : bx + ph, by + bh / 2);
  ctx.textBaseline = 'top';
}

// ---------------------------------------------------------------
// TEXT HELPERS
// ---------------------------------------------------------------

/** Wrap text across multiple lines */
function wrapText(ctx, text, x, y, maxWidth, lineHeight, maxLines = 0) {
  if (!text) return;
  const words = getWrappedTokens(ctx, text, maxWidth);
  let line = '';
  let lineCount = 0;

  for (let i = 0; i < words.length; i++) {
    const testLine  = line + words[i] + ' ';
    const metrics   = ctx.measureText(testLine);

    if (metrics.width > maxWidth && i > 0) {
      ctx.fillText(line.trim(), x, y + lineCount * lineHeight);
      line = words[i] + ' ';
      lineCount++;
      if (maxLines > 0 && lineCount >= maxLines) {
        // Truncate with ellipsis
        const remaining = words.slice(i + 1).join(' ');
        if (remaining) {
          let truncated = line.trim() + '…';
          while (ctx.measureText(truncated).width > maxWidth && truncated.length > 1) {
            truncated = truncated.slice(0, -2) + '…';
          }
          ctx.fillText(truncated, x, y + lineCount * lineHeight);
        }
        return;
      }
    } else {
      line = testLine;
    }
  }
  ctx.fillText(line.trim(), x, y + lineCount * lineHeight);
}

/** Estimate how tall wrapped text will be */
function estimateTextHeight(ctx, text, maxWidth, lineHeight) {
  if (!text) return 0;
  const words = getWrappedTokens(ctx, text, maxWidth);
  let line = '';
  let lines = 1;
  words.forEach(word => {
    const test = line + word + ' ';
    if (ctx.measureText(test).width > maxWidth && line) {
      lines++;
      line = word + ' ';
    } else {
      line = test;
    }
  });
  return lines * lineHeight;
}

function getWrappedTokens(ctx, text, maxWidth) {
  const normalized = text.trim();
  if (!normalized) return [];
  return normalized.split(/\s+/).flatMap(word => splitLongToken(ctx, word, maxWidth));
}

function splitLongToken(ctx, token, maxWidth) {
  if (ctx.measureText(token).width <= maxWidth) return [token];

  const pieces = [];
  let piece = '';
  for (const char of token) {
    const next = piece + char;
    if (piece && ctx.measureText(next).width > maxWidth) {
      pieces.push(piece);
      piece = char;
    } else {
      piece = next;
    }
  }
  if (piece) pieces.push(piece);
  return pieces;
}

/** Scale a font string's size by a ratio */
function scaleFont(fontStr, scale) {
  return fontStr.replace(/(\d+)px/, (_, n) => Math.round(n * scale) + 'px');
}

/** Extract line height from font string */
function lineH(fontStr, scale) {
  const match = fontStr.match(/(\d+)px/);
  return match ? parseInt(match[1]) * scale * 1.25 : 50 * scale;
}

/** Round-rect path helper */
function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
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

/** Hex color to rgba string */
function hexToRgba(hex, alpha) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

// ---------------------------------------------------------------
// RENDER — draw main canvas + sync sub-canvases + update mocks
// ---------------------------------------------------------------

// Offscreen canvas used for clean 1200x630 export and sub-canvas copies
const _exportCanvas = document.createElement('canvas');

function render() {
  // 1. Draw the export-quality 1200x630 onto the offscreen canvas
  drawCard(_exportCanvas, 1200, 630, false);

  // 2. Draw HiDPI version onto the visible preview canvas
  drawCard(mainCanvas, 1200, 630, true);

  // 3. Copy from the clean export canvas into sub-canvases
  syncSubCanvas(twitterCanvas,   600, 315);
  syncSubCanvas(imessageCanvas,  480, 252);
  syncSubCanvas(discordCanvas,   400, 209);

  updateMockText();
  updateMetaTags();
}

function getDraftSnapshot() {
  return DRAFT_FIELDS.reduce((draft, key) => {
    draft[key] = state[key];
    return draft;
  }, {});
}

function saveDraft() {
  try {
    localStorage.setItem(DRAFT_KEY, JSON.stringify(getDraftSnapshot()));
  } catch (err) {
    console.warn('ShareSpark draft could not be saved.', err);
  }
}

const queueSaveDraft = debounce(saveDraft, 250);

function loadDraft() {
  let draft = null;
  try {
    draft = JSON.parse(localStorage.getItem(DRAFT_KEY));
  } catch (err) {
    console.warn('ShareSpark draft could not be loaded.', err);
  }
  if (!draft || typeof draft !== 'object') return;

  DRAFT_FIELDS.forEach(key => {
    if (Object.prototype.hasOwnProperty.call(draft, key)) {
      state[key] = draft[key];
    }
  });

  if (state.logoDataUrl) hydrateImageFromDataUrl(state.logoDataUrl, 'logo');
  if (state.bgDataUrl) hydrateImageFromDataUrl(state.bgDataUrl, 'bg');
}

function hydrateImageFromDataUrl(dataUrl, type) {
  const img = new Image();
  img.onload = () => {
    if (type === 'logo') {
      state.logoImage = img;
      setUploadPreview('logo', dataUrl);
    } else {
      state.bgImage = img;
      setUploadPreview('bg', dataUrl);
    }
    render();
  };
  img.onerror = () => {
    if (type === 'logo') {
      state.logoImage = null;
      state.logoDataUrl = null;
    } else {
      state.bgImage = null;
      state.bgDataUrl = null;
    }
  };
  img.src = dataUrl;
}

function syncControlsFromState() {
  document.getElementById('inputTitle').value    = state.title;
  document.getElementById('inputSubtitle').value = state.subtitle;
  document.getElementById('inputDomain').value   = state.domain;
  document.getElementById('inputAuthor').value   = state.author;
  document.getElementById('inputCta').value      = state.cta;

  document.getElementById('accentColor').value    = state.accentColor;
  document.getElementById('glowIntensity').value  = state.glow;
  document.getElementById('cornerRadius').value   = state.radius;
  document.getElementById('showBorder').checked   = state.border;
  document.getElementById('showGradient').checked = state.gradient;
  document.getElementById('glowVal').textContent  = String(state.glow);
  document.getElementById('cornerVal').textContent = String(state.radius);

  updateCounter('inputTitle',    'counterTitle',    80);
  updateCounter('inputSubtitle', 'counterSubtitle', 160);
  updateCounter('inputCta',      'counterCta',      40);
  setActivePreset(state.preset);
  setActiveLayout(state.layout);
  updateColorSwatches(state.accentColor);
}

/** Copy from the clean export canvas into a smaller display canvas */
function syncSubCanvas(dest, w, h) {
  dest.width  = w;
  dest.height = h;
  const ctx = dest.getContext('2d');
  ctx.drawImage(_exportCanvas, 0, 0, w, h);
}

/** Update text labels in the mock previews */
function updateMockText() {
  const domain   = state.domain.replace(/^https?:\/\//, '') || 'yourdomain.com';
  const title    = state.title    || 'Your Title';
  const subtitle = state.subtitle || 'Your description';

  setText('twitterDomain',  domain);
  setText('twitterTitle',   title);
  setText('twitterDesc',    subtitle);
  setText('imessageTitle',  title);
  setText('imessageDomain', domain);
  setText('discordSite',    domain);
  setText('discordTitle',   title);
  setText('discordDesc',    subtitle);

  // Discord accent color
  const el = document.getElementById('discordAccent');
  if (el) el.style.background = state.accentColor;
}

function setText(id, val) {
  const el = document.getElementById(id);
  if (el) el.textContent = val;
}

// ---------------------------------------------------------------
// META TAG GENERATOR
// ---------------------------------------------------------------
function updateMetaTags() {
  const title  = escHtml(state.title    || 'Your Title');
  const desc   = escHtml(state.subtitle || 'Your description');
  const domain = state.domain.replace(/^https?:\/\//, '') || 'yourdomain.com';
  const imgUrl = `https://${domain}/og-image.png`;

  const snippet =
`<!-- Open Graph -->
<meta property="og:title"       content="${title}">
<meta property="og:description" content="${desc}">
<meta property="og:image"       content="${imgUrl}">
<meta property="og:type"        content="website">
<meta property="og:url"         content="https://${domain}">

<!-- Twitter / X -->
<meta name="twitter:card"        content="summary_large_image">
<meta name="twitter:title"       content="${title}">
<meta name="twitter:description" content="${desc}">
<meta name="twitter:image"       content="${imgUrl}">`;

  const el = document.getElementById('metaOutput');
  if (el) el.textContent = snippet;
}

function escHtml(str) {
  return str.replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

// ---------------------------------------------------------------
// EXPORT — download PNG
// ---------------------------------------------------------------
function downloadPNG() {
  // Always draw a fresh clean 1200x630 to the offscreen canvas before export
  drawCard(_exportCanvas, 1200, 630, false);
  const link = document.createElement('a');
  link.download = 'og-image.png';
  link.href = _exportCanvas.toDataURL('image/png');
  link.click();
  showToast('PNG downloaded ✓');
}

// ---------------------------------------------------------------
// COPY HELPERS
// ---------------------------------------------------------------
function copyMetaTags() {
  const el = document.getElementById('metaOutput');
  if (!el) return;
  writeClipboardText(el.textContent).then(() => {
    showToast('OG tags copied ✓');
    flashCopied(document.getElementById('btnCopyTags'));
    flashCopied(document.getElementById('metaCopyBtn'));
  }).catch(() => {
    showToast('Copy failed. Select the tags manually.');
  });
}

function writeClipboardText(text) {
  if (navigator.clipboard?.writeText) {
    return navigator.clipboard.writeText(text);
  }

  return new Promise((resolve, reject) => {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.setAttribute('readonly', '');
    textarea.style.position = 'fixed';
    textarea.style.top = '-999px';
    document.body.appendChild(textarea);
    textarea.select();

    try {
      document.execCommand('copy') ? resolve() : reject(new Error('Copy failed'));
    } catch (err) {
      reject(err);
    } finally {
      document.body.removeChild(textarea);
    }
  });
}

/** Briefly apply .copied class to a button, then remove it */
function flashCopied(btn) {
  if (!btn) return;
  if (!btn.dataset.originalHtml) btn.dataset.originalHtml = btn.innerHTML;
  btn.classList.add('copied');
  btn.textContent = 'Copied ✓';
  clearTimeout(btn._copyTimer);
  btn._copyTimer = setTimeout(() => {
    btn.classList.remove('copied');
    btn.innerHTML = btn.dataset.originalHtml;
  }, 2000);
}

// ---------------------------------------------------------------
// TOAST
// ---------------------------------------------------------------
function showToast(msg) {
  const toast = document.getElementById('toast');
  toast.textContent = msg;
  toast.classList.add('toast--visible');
  clearTimeout(toast._timer);
  toast._timer = setTimeout(() => toast.classList.remove('toast--visible'), 2400);
}

// ---------------------------------------------------------------
// RESET — returns to the default demo state, not blank
// ---------------------------------------------------------------
function resetAll() {
  initDefaults();
  state.accentColor = '#00e5ff';
  state.preset      = 'dark-neon';
  state.layout      = 'centered';
  state.glow        = 60;
  state.radius      = 16;
  state.border      = true;
  state.gradient    = true;
  state.logoImage   = null;
  state.bgImage     = null;
  state.logoDataUrl = null;
  state.bgDataUrl   = null;

  clearUpload('logo');
  clearUpload('bg');
  syncControlsFromState();
  localStorage.removeItem(DRAFT_KEY);
  render();
  showToast('Design reset ✓');
}

function clearUpload(type) {
  const preview = document.getElementById(`${type}Preview`);
  const inner   = document.getElementById(`${type}Upload`).querySelector('.upload-zone__inner');
  if (preview) preview.hidden = true;
  if (inner)   inner.hidden   = false;
  if (type === 'logo') {
    state.logoImage = null;
    state.logoDataUrl = null;
    document.getElementById('logoFile').value = '';
  } else {
    state.bgImage = null;
    state.bgDataUrl = null;
    document.getElementById('bgFile').value = '';
  }
}

// ---------------------------------------------------------------
// PRESET ACTIVATION
// ---------------------------------------------------------------
function setActivePreset(id) {
  document.querySelectorAll('.preset-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.preset === id);
  });
}

function setActiveLayout(id) {
  document.querySelectorAll('.layout-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.layout === id);
  });
}

function updateColorSwatches(color) {
  document.querySelectorAll('.color-swatch').forEach(s => {
    s.classList.toggle('active', s.dataset.color === color);
  });
  document.getElementById('accentColor').value = color;
}

// ---------------------------------------------------------------
// PREVIEW TABS
// ---------------------------------------------------------------
function activateTab(tabId) {
  document.querySelectorAll('.preview-tab').forEach(t => {
    const isActive = t.dataset.tab === tabId;
    t.classList.toggle('active', isActive);
    t.setAttribute('aria-selected', String(isActive));
  });

  const map = {
    full:     'previewFull',
    twitter:  'previewTwitter',
    imessage: 'previewImessage',
    discord:  'previewDiscord',
  };
  Object.entries(map).forEach(([key, id]) => {
    const el = document.getElementById(id);
    if (el) el.classList.toggle('preview-stage--hidden', key !== tabId);
  });
}

// ---------------------------------------------------------------
// DEBOUNCE
// ---------------------------------------------------------------
function debounce(fn, ms) {
  let t;
  return (...args) => { clearTimeout(t); t = setTimeout(() => fn(...args), ms); };
}
const debouncedRender = debounce(render, 60);

// ---------------------------------------------------------------
// CHAR COUNTER
// ---------------------------------------------------------------

/**
 * Update a char counter element. Turns yellow at 80%, red at 100%.
 */
function updateCounter(inputId, counterId, max) {
  const input   = document.getElementById(inputId);
  const counter = document.getElementById(counterId);
  if (!input || !counter) return;
  const len = input.value.length;
  counter.textContent = `${len} / ${max}`;
  counter.classList.toggle('field__counter--warn',  len >= max * 0.8 && len < max);
  counter.classList.toggle('field__counter--limit', len >= max);
}

// ---------------------------------------------------------------
// EVENT WIRING
// ---------------------------------------------------------------
function initEvents() {

  // TEXT INPUTS + CHAR COUNTERS
  [
    ['inputTitle',    'title',    'counterTitle',    80],
    ['inputSubtitle', 'subtitle', 'counterSubtitle', 160],
    ['inputDomain',   'domain',   null,              0],
    ['inputAuthor',   'author',   null,              0],
    ['inputCta',      'cta',      'counterCta',      40],
  ].forEach(([id, key, counterId, max]) => {
    document.getElementById(id).addEventListener('input', e => {
      state[key] = e.target.value;
      if (counterId) updateCounter(id, counterId, max);
      queueSaveDraft();
      debouncedRender();
    });
  });

  // PRESETS
  document.getElementById('presetsGrid').addEventListener('click', e => {
    const btn = e.target.closest('.preset-btn');
    if (!btn) return;
    state.preset = btn.dataset.preset;
    setActivePreset(state.preset);
    queueSaveDraft();
    render();
  });

  // LAYOUT
  document.getElementById('layoutBtns').addEventListener('click', e => {
    const btn = e.target.closest('.layout-btn');
    if (!btn) return;
    state.layout = btn.dataset.layout;
    setActiveLayout(state.layout);
    queueSaveDraft();
    render();
  });

  // ACCENT COLOR (picker)
  document.getElementById('accentColor').addEventListener('input', e => {
    state.accentColor = e.target.value;
    updateColorSwatches(e.target.value);
    queueSaveDraft();
    debouncedRender();
  });

  // COLOR SWATCHES
  document.getElementById('colorSwatches').addEventListener('click', e => {
    const s = e.target.closest('.color-swatch');
    if (!s) return;
    state.accentColor = s.dataset.color;
    updateColorSwatches(s.dataset.color);
    queueSaveDraft();
    render();
  });

  // GLOW SLIDER
  document.getElementById('glowIntensity').addEventListener('input', e => {
    state.glow = parseInt(e.target.value);
    document.getElementById('glowVal').textContent = state.glow;
    queueSaveDraft();
    debouncedRender();
  });

  // RADIUS SLIDER
  document.getElementById('cornerRadius').addEventListener('input', e => {
    state.radius = parseInt(e.target.value);
    document.getElementById('cornerVal').textContent = state.radius;
    queueSaveDraft();
    debouncedRender();
  });

  // TOGGLES
  document.getElementById('showBorder').addEventListener('change', e => {
    state.border = e.target.checked;
    queueSaveDraft();
    render();
  });
  document.getElementById('showGradient').addEventListener('change', e => {
    state.gradient = e.target.checked;
    queueSaveDraft();
    render();
  });

  // LOGO UPLOAD
  const logoZone = document.getElementById('logoUpload');
  const logoFile = document.getElementById('logoFile');
  logoZone.addEventListener('click', e => {
    if (!e.target.closest('.upload-zone__remove')) logoFile.click();
  });
  logoZone.addEventListener('keydown', e => handleUploadKey(e, logoFile));
  logoFile.addEventListener('change', e => handleImageUpload(e, 'logo'));
  document.getElementById('logoRemove').addEventListener('click', e => {
    e.stopPropagation();
    clearUpload('logo');
    queueSaveDraft();
    render();
  });
  setupDragDrop(logoZone, file => handleImageFile(file, 'logo'));

  // BG UPLOAD
  const bgZone = document.getElementById('bgUpload');
  const bgFile = document.getElementById('bgFile');
  bgZone.addEventListener('click', e => {
    if (!e.target.closest('.upload-zone__remove')) bgFile.click();
  });
  bgZone.addEventListener('keydown', e => handleUploadKey(e, bgFile));
  bgFile.addEventListener('change', e => handleImageUpload(e, 'bg'));
  document.getElementById('bgRemove').addEventListener('click', e => {
    e.stopPropagation();
    clearUpload('bg');
    queueSaveDraft();
    render();
  });
  setupDragDrop(bgZone, file => handleImageFile(file, 'bg'));

  // EXPORT
  document.getElementById('btnDownload').addEventListener('click', downloadPNG);
  document.getElementById('btnCopyTags').addEventListener('click', copyMetaTags);
  document.getElementById('metaCopyBtn').addEventListener('click', copyMetaTags);
  document.getElementById('btnReset').addEventListener('click', resetAll);

  // PREVIEW TABS
  document.getElementById('previewTabs').addEventListener('click', e => {
    const tab = e.target.closest('.preview-tab');
    if (!tab) return;
    activateTab(tab.dataset.tab);
  });

  // HERO CTA scroll
  document.querySelector('.btn--primary')?.addEventListener('click', e => {
    e.preventDefault();
    document.getElementById('editor').scrollIntoView({ behavior: 'smooth' });
  });
}

// ---------------------------------------------------------------
// IMAGE UPLOAD HANDLER
// ---------------------------------------------------------------
function handleImageUpload(e, type) {
  const file = e.target.files[0];
  if (file) handleImageFile(file, type);
}

function handleImageFile(file, type) {
  if (!file || !file.type.startsWith('image/')) return;
  const reader = new FileReader();
  reader.onload = ev => {
    const img = new Image();
    img.onload = () => {
      if (type === 'logo') {
        state.logoImage = img;
        state.logoDataUrl = ev.target.result;
      } else {
        state.bgImage = img;
        state.bgDataUrl = ev.target.result;
      }
      setUploadPreview(type, ev.target.result);
      queueSaveDraft();
      render();
    };
    img.src = ev.target.result;
  };
  reader.readAsDataURL(file);
}

function setUploadPreview(type, dataUrl) {
  const imgId = type === 'logo' ? 'logoImg' : 'bgImg';
  const previewId = type === 'logo' ? 'logoPreview' : 'bgPreview';
  const uploadId = type === 'logo' ? 'logoUpload' : 'bgUpload';

  document.getElementById(imgId).src = dataUrl;
  document.getElementById(previewId).hidden = false;
  document.getElementById(uploadId).querySelector('.upload-zone__inner').hidden = true;
}

// ---------------------------------------------------------------
// DRAG AND DROP FOR UPLOAD ZONES
// ---------------------------------------------------------------
function setupDragDrop(zone, callback) {
  zone.addEventListener('dragover', e => {
    e.preventDefault();
    zone.style.borderColor = 'var(--cyan)';
    zone.style.background  = 'var(--cyan-glow)';
  });
  zone.addEventListener('dragleave', () => {
    zone.style.borderColor = '';
    zone.style.background  = '';
  });
  zone.addEventListener('drop', e => {
    e.preventDefault();
    zone.style.borderColor = '';
    zone.style.background  = '';
    const file = e.dataTransfer.files[0];
    if (file) callback(file);
  });
}

function handleUploadKey(e, input) {
  if (e.key !== 'Enter' && e.key !== ' ') return;
  e.preventDefault();
  input.click();
}

// ---------------------------------------------------------------
// INIT WITH PLACEHOLDER CONTENT
// ---------------------------------------------------------------
function initDefaults() {
  state.title    = 'Build Something Worth Sharing';
  state.subtitle = 'Your website\'s first impression happens before anyone clicks.';
  state.domain   = 'manicwebmaster.com';
  state.author   = 'ManicWebmaster';
  state.cta      = 'Explore Now →';
}

// ---------------------------------------------------------------
// BOOTSTRAP
// ---------------------------------------------------------------
document.addEventListener('DOMContentLoaded', () => {
  initDefaults();
  loadDraft();
  syncControlsFromState();
  initHiDPI();
  initEvents();

  // Gate first render on fonts being loaded so canvas text uses
  // the correct typefaces, not system fallbacks.
  document.fonts.ready.then(() => {
    render();
  });
});
