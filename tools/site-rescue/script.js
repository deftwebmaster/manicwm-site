/**
 * ManicWebmaster — Site Rescue
 * script.js
 *
 * Handles URL validation, loading state, Worker calls, report rendering,
 * optional Turnstile, share/copy actions, and post-report lead capture.
 */

/* ── Config ───────────────────────────────────────────────── */

// Update this to your deployed Cloudflare Worker base URL.
// Example: https://manicwebmaster-site-rescue.YOUR_SUBDOMAIN.workers.dev
const WORKER_URL = 'https://YOUR_WORKER.YOUR_SUBDOMAIN.workers.dev';

// Optional Cloudflare Turnstile site key. Leave blank for local/mock testing.
const TURNSTILE_SITE_KEY = '';

const USE_MOCK = WORKER_URL === 'MOCK' || WORKER_URL.includes('YOUR_WORKER');
const USE_TURNSTILE = Boolean(TURNSTILE_SITE_KEY) && !USE_MOCK;

/* ── Loading steps ────────────────────────────────────────── */
const LOADING_STEPS = [
  'Scanning first impression...',
  'Checking trust signals...',
  'Looking for conversion friction...',
  'Reviewing SEO basics...',
  'Analyzing mobile readability...',
  'Saving a shareable report...',
  'Writing your fix plan...',
];

/* ── DOM refs ─────────────────────────────────────────────── */
const urlInput        = document.getElementById('urlInput');
const auditBtn        = document.getElementById('auditBtn');
const formError       = document.getElementById('formError');
const loadingSection  = document.getElementById('loadingSection');
const loadingStep     = document.getElementById('loadingStep');
const loadingUrl      = document.getElementById('loadingUrl');
const loadingBar      = document.getElementById('loadingBar');
const reportSection   = document.getElementById('reportSection');
const newAuditBtn     = document.getElementById('newAuditBtn');
const copySummaryBtn  = document.getElementById('copySummaryBtn');
const shareReportBtn  = document.getElementById('shareReportBtn');
const shareUrlWrap    = document.getElementById('shareUrlWrap');
const shareUrlInput   = document.getElementById('shareUrlInput');
const leadForm        = document.getElementById('leadForm');
const leadStatus      = document.getElementById('leadStatus');
const leadSubmitBtn   = document.getElementById('leadSubmitBtn');
const turnstileWrap   = document.getElementById('turnstileWrap');

let _loadingTimer = null;
let _stepIndex = 0;
let _turnstileWidgetId = null;
let _turnstileToken = '';
let _currentReport = null;

/* ── Init ─────────────────────────────────────────────────── */
auditBtn.addEventListener('click', handleSubmit);
urlInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') handleSubmit();
});
urlInput.addEventListener('input', () => {
  if (formError.textContent) formError.textContent = '';
});
newAuditBtn.addEventListener('click', resetToForm);
copySummaryBtn.addEventListener('click', copyReportSummary);
shareReportBtn.addEventListener('click', copyShareLink);
leadForm.addEventListener('submit', handleLeadSubmit);

document.addEventListener('DOMContentLoaded', () => {
  initTurnstile();
  maybeLoadSharedReport();
});

/* ── URL Validation / Normalization ─────────────────────── */
function normalizeUrl(raw) {
  const trimmed = raw.trim();
  if (!trimmed) return { url: null, error: 'Please enter a website URL.' };

  let candidate = trimmed;
  if (/^https?:\/\//i.test(candidate) === false) {
    candidate = 'https://' + candidate;
  }

  try {
    const parsed = new URL(candidate);
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      return { url: null, error: 'Only http and https URLs are supported.' };
    }
    if (parsed.username || parsed.password) {
      return { url: null, error: 'URLs with usernames or passwords are not supported.' };
    }

    const host = parsed.hostname.toLowerCase();
    const blockedHosts = ['localhost', '127.0.0.1', '0.0.0.0', '::1'];
    if (blockedHosts.includes(host)) {
      return { url: null, error: 'That URL can\'t be audited from here.' };
    }
    if (/^192\.168\.|^10\.|^172\.(1[6-9]|2\d|3[01])\./.test(host)) {
      return { url: null, error: 'Private network addresses aren\'t supported.' };
    }
    if (!host.includes('.')) {
      return { url: null, error: 'Please enter a full URL like https://example.com' };
    }

    parsed.hash = '';
    return { url: parsed.href, error: null };
  } catch {
    return { url: null, error: 'That doesn\'t look like a valid URL. Try https://example.com' };
  }
}

/* ── Main Submit Handler ─────────────────────────────────── */
async function handleSubmit() {
  const { url, error } = normalizeUrl(urlInput.value);

  if (error) {
    showError(error);
    urlInput.focus();
    return;
  }

  if (USE_TURNSTILE && !_turnstileToken) {
    showError('Please complete the quick verification before running the audit.');
    return;
  }

  formError.textContent = '';
  urlInput.value = url;
  startLoading(url);

  try {
    const payload = USE_MOCK ? await getMockReport(url) : await fetchAuditReport(url);
    renderReport(url, payload);
    resetTurnstile();
  } catch (err) {
    console.error('[SiteRescue] Error:', err);
    stopLoading();
    document.querySelector('.hero').classList.remove('hidden');
    showError(err.message || 'Something went wrong running the audit. Please try again in a moment.');
    resetTurnstile();
  }
}

/* ── API Calls ───────────────────────────────────────────── */
async function fetchAuditReport(url) {
  const resp = await fetch(workerEndpoint('/audit'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      url,
      turnstileToken: _turnstileToken || undefined,
    }),
  });

  return parseJsonResponse(resp);
}

async function fetchSavedReport(reportId) {
  const resp = await fetch(workerEndpoint(`/report/${encodeURIComponent(reportId)}`));
  return parseJsonResponse(resp);
}

async function postLead(payload) {
  if (USE_MOCK) {
    await wait(650);
    return { ok: true };
  }

  const resp = await fetch(workerEndpoint('/lead'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  return parseJsonResponse(resp);
}

async function parseJsonResponse(resp) {
  let body = null;
  try {
    body = await resp.json();
  } catch {}

  if (!resp.ok) {
    throw new Error(body?.error || `Server error: ${resp.status}`);
  }

  return body;
}

function workerEndpoint(path) {
  if (WORKER_URL === 'MOCK') return 'MOCK';
  const base = WORKER_URL.replace(/\/audit\/?$/, '').replace(/\/$/, '');
  return `${base}${path}`;
}

/* ── Loading State ───────────────────────────────────────── */
function startLoading(url) {
  auditBtn.disabled = true;

  document.querySelector('.hero').classList.add('hidden');
  loadingSection.classList.remove('hidden');
  loadingSection.setAttribute('aria-busy', 'true');
  reportSection.classList.add('hidden');

  loadingUrl.textContent = url;
  loadingBar.style.width = '0%';

  _stepIndex = 0;
  loadingStep.textContent = LOADING_STEPS[0];

  setTimeout(() => { loadingBar.style.width = '15%'; }, 100);

  _loadingTimer = setInterval(() => {
    _stepIndex = (_stepIndex + 1) % LOADING_STEPS.length;
    loadingStep.style.opacity = '0';
    setTimeout(() => {
      loadingStep.textContent = LOADING_STEPS[_stepIndex];
      loadingStep.style.opacity = '1';
    }, 200);

    const pct = Math.min(90, 15 + _stepIndex * (75 / LOADING_STEPS.length));
    loadingBar.style.width = pct + '%';
  }, 2200);
}

function stopLoading() {
  clearInterval(_loadingTimer);
  loadingSection.classList.add('hidden');
  loadingSection.setAttribute('aria-busy', 'false');
  auditBtn.disabled = false;
}

/* ── Report Rendering ────────────────────────────────────── */
function renderReport(url, payload) {
  stopLoading();

  const report = payload.report || payload;
  const shareUrl = payload.shareUrl || report.shareUrl || '';
  const shareId = payload.shareId || report.shareId || '';
  const reportUrl = payload.url || report.url || url;

  _currentReport = {
    url: reportUrl,
    shareUrl,
    shareId,
    report,
  };

  document.getElementById('reportUrl').textContent = reportUrl;

  const score = Math.max(0, Math.min(100, Number(report.overallScore) || 0));
  document.getElementById('scoreNumber').textContent = score;
  document.getElementById('scoreSummary').textContent = report.summary || '';

  const circumference = 377;
  const offset = circumference - (score / 100) * circumference;
  const scoreCircle = document.getElementById('scoreCircle');

  const svgEl = scoreCircle.closest('svg');
  if (!svgEl.querySelector('#scoreGrad')) {
    const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
    defs.innerHTML = `
      <linearGradient id="scoreGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%"   stop-color="#00e5ff"/>
        <stop offset="50%"  stop-color="#a78bfa"/>
        <stop offset="100%" stop-color="#d946ef"/>
      </linearGradient>`;
    svgEl.insertBefore(defs, svgEl.firstChild);
  }

  const scoreNumberEl = document.getElementById('scoreNumber');
  if (score >= 70) scoreNumberEl.style.color = '#22c55e';
  else if (score >= 45) scoreNumberEl.style.color = '#f59e0b';
  else scoreNumberEl.style.color = '#ef4444';

  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      scoreCircle.style.strokeDashoffset = offset;
    });
  });

  const grid = document.getElementById('sectionsGrid');
  grid.innerHTML = '';
  (report.sections || []).forEach((sec, i) => {
    const card = buildSectionCard(sec);
    card.style.animationDelay = `${0.05 + i * 0.07}s`;
    grid.appendChild(card);
  });

  const fixesList = document.getElementById('fixesList');
  fixesList.innerHTML = '';
  (report.topFixes || []).slice(0, 5).forEach((fix, i) => {
    const card = buildFixCard(fix, i + 1);
    card.style.animationDelay = `${0.1 + i * 0.08}s`;
    fixesList.appendChild(card);
  });

  document.getElementById('finalRecText').textContent = report.finalRecommendation || '';
  updateDynamicCta(score, report.topFixes || []);
  updateShareUi(shareUrl);
  primeLeadMessage(score, report.topFixes || []);

  reportSection.classList.remove('hidden');
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function buildSectionCard(sec) {
  const card = document.createElement('div');
  const sev = normalizeSeverity(sec.severity);
  card.className = `section-card sev-${sev}`;

  const notes = (sec.notes || []).map(n => `<li>${escHtml(n)}</li>`).join('');
  card.innerHTML = `
    <div class="section-card-header">
      <div class="section-card-name">${escHtml(sec.name || '')}</div>
      <div class="severity-badge severity-${sev}">${sev}</div>
    </div>
    <p class="section-card-summary">${escHtml(sec.summary || '')}</p>
    ${notes ? `<ul class="section-card-notes">${notes}</ul>` : ''}
  `;

  return card;
}

function buildFixCard(fix, num) {
  const li = document.createElement('li');
  li.className = 'fix-card';
  li.innerHTML = `
    <div class="fix-number">${num}</div>
    <div class="fix-content">
      <div class="fix-issue">${escHtml(fix.issue || '')}</div>
      <p class="fix-why">${escHtml(fix.whyItMatters || '')}</p>
      <div class="fix-suggestion-wrap">
        <div class="fix-suggestion-label">Suggested Fix</div>
        <p class="fix-suggestion">${escHtml(fix.suggestedFix || '')}</p>
      </div>
    </div>
  `;
  return li;
}

function updateDynamicCta(score, fixes) {
  const headline = document.getElementById('ctaHeadline');
  const body = document.getElementById('ctaBody');
  const firstFix = fixes[0]?.issue ? ` The first move I would look at is: ${fixes[0].issue}.` : '';

  if (score < 45) {
    headline.textContent = 'Your site is leaking trust.';
    body.textContent = `The good news: most of this is fixable without starting over.${firstFix}`;
  } else if (score < 70) {
    headline.textContent = 'You are closer than it feels.';
    body.textContent = `A few focused repairs could make the site feel clearer, sharper, and more credible.${firstFix}`;
  } else {
    headline.textContent = 'Good foundation. Sharper conversion next.';
    body.textContent = `The basics are in place. Now the opportunity is polish, persuasion, and fewer points of friction.${firstFix}`;
  }
}

function updateShareUi(shareUrl) {
  if (shareUrl) {
    shareUrlWrap.classList.remove('hidden');
    shareUrlInput.value = shareUrl;
    shareReportBtn.disabled = false;
  } else {
    shareUrlWrap.classList.add('hidden');
    shareUrlInput.value = '';
    shareReportBtn.disabled = true;
  }
}

function primeLeadMessage(score, fixes) {
  const leadMessage = document.getElementById('leadMessage');
  const topThree = fixes.slice(0, 3).map(f => f.issue).filter(Boolean);
  leadMessage.value = topThree.length
    ? `I want help fixing these audit priorities: ${topThree.join(', ')}. Current score: ${score}/100.`
    : `I want help improving this site. Current score: ${score}/100.`;
  leadStatus.textContent = '';
}

/* ── Report Actions ─────────────────────────────────────── */
async function copyReportSummary() {
  if (!_currentReport) return;
  const text = buildReportSummary(_currentReport);
  await copyText(text);
  flashButton(copySummaryBtn, 'Copied');
}

async function copyShareLink() {
  if (!_currentReport?.shareUrl) return;
  await copyText(_currentReport.shareUrl);
  flashButton(shareReportBtn, 'Link Copied');
}

function buildReportSummary(state) {
  const report = state.report;
  const fixes = (report.topFixes || [])
    .slice(0, 5)
    .map((fix, i) => `${i + 1}. ${fix.issue}: ${fix.suggestedFix}`)
    .join('\n');

  return [
    `Site Rescue Report for ${state.url}`,
    `Score: ${report.overallScore}/100`,
    '',
    report.summary || '',
    '',
    'Top Priority Fixes:',
    fixes,
    '',
    report.finalRecommendation || '',
    state.shareUrl ? `\nShare link: ${state.shareUrl}` : '',
  ].filter(Boolean).join('\n');
}

/* ── Lead Capture ───────────────────────────────────────── */
async function handleLeadSubmit(e) {
  e.preventDefault();
  if (!_currentReport) return;

  const name = document.getElementById('leadName').value.trim();
  const email = document.getElementById('leadEmail').value.trim();
  const message = document.getElementById('leadMessage').value.trim();
  const wantsCopy = document.getElementById('leadWantsCopy').checked;

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    leadStatus.textContent = 'Please enter a valid email address.';
    return;
  }

  leadSubmitBtn.disabled = true;
  leadStatus.textContent = 'Sending...';

  try {
    await postLead({
      name,
      email,
      message,
      wantsCopy,
      url: _currentReport.url,
      reportId: _currentReport.shareId,
      shareUrl: _currentReport.shareUrl,
      score: _currentReport.report.overallScore,
      topFixes: (_currentReport.report.topFixes || []).slice(0, 5),
      summary: _currentReport.report.summary,
    });

    leadStatus.textContent = 'Got it. Your audit was sent over.';
    leadForm.classList.add('lead-form-sent');
  } catch (err) {
    console.error('[SiteRescue] Lead error:', err);
    leadStatus.textContent = err.message || 'Could not send that yet. Please text Matt directly.';
  } finally {
    leadSubmitBtn.disabled = false;
  }
}

/* ── Shared Report Loading ───────────────────────────────── */
async function maybeLoadSharedReport() {
  const params = new URLSearchParams(window.location.search);
  const reportId = params.get('report');
  if (!reportId || USE_MOCK) return;

  startLoading('saved report');
  try {
    const payload = await fetchSavedReport(reportId);
    renderReport(payload.url || 'saved report', payload);
  } catch (err) {
    console.error('[SiteRescue] Saved report error:', err);
    stopLoading();
    document.querySelector('.hero').classList.remove('hidden');
    showError('That saved report link could not be loaded. You can run a fresh audit below.');
  }
}

/* ── Turnstile ───────────────────────────────────────────── */
function initTurnstile() {
  if (!USE_TURNSTILE || !turnstileWrap) return;

  turnstileWrap.classList.remove('hidden');

  const render = () => {
    if (!window.turnstile || _turnstileWidgetId !== null) return;
    _turnstileWidgetId = window.turnstile.render('#turnstileWidget', {
      sitekey: TURNSTILE_SITE_KEY,
      action: 'site_rescue_audit',
      callback: (token) => { _turnstileToken = token; },
      'expired-callback': () => { _turnstileToken = ''; },
      'error-callback': () => { _turnstileToken = ''; },
    });
  };

  if (window.turnstile) render();
  else {
    const timer = setInterval(() => {
      if (window.turnstile) {
        clearInterval(timer);
        render();
      }
    }, 200);
  }
}

function resetTurnstile() {
  _turnstileToken = '';
  if (USE_TURNSTILE && window.turnstile && _turnstileWidgetId !== null) {
    window.turnstile.reset(_turnstileWidgetId);
  }
}

/* ── Reset ───────────────────────────────────────────────── */
function resetToForm() {
  reportSection.classList.add('hidden');
  loadingSection.classList.add('hidden');
  document.querySelector('.hero').classList.remove('hidden');

  const scoreCircle = document.getElementById('scoreCircle');
  if (scoreCircle) scoreCircle.style.strokeDashoffset = '377';

  _currentReport = null;
  leadForm.reset();
  leadForm.classList.remove('lead-form-sent');
  leadStatus.textContent = '';
  urlInput.value = '';
  urlInput.focus();

  if (window.location.search.includes('report=')) {
    window.history.replaceState({}, document.title, window.location.pathname);
  }

  window.scrollTo({ top: 0, behavior: 'smooth' });
}

/* ── Helpers ─────────────────────────────────────────────── */
function showError(msg) {
  formError.textContent = msg;
}

function normalizeSeverity(sev) {
  return ['Low', 'Medium', 'High'].includes(sev) ? sev : 'Low';
}

function escHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

async function copyText(text) {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(text);
    return;
  }

  const textarea = document.createElement('textarea');
  textarea.value = text;
  textarea.setAttribute('readonly', '');
  textarea.style.position = 'fixed';
  textarea.style.left = '-9999px';
  document.body.appendChild(textarea);
  textarea.select();
  document.execCommand('copy');
  textarea.remove();
}

function flashButton(btn, label) {
  const oldText = btn.textContent;
  btn.textContent = label;
  setTimeout(() => { btn.textContent = oldText; }, 1400);
}

function wait(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/* ── Mock Data (local testing) ───────────────────────────── */
function getMockReport(url) {
  console.log('[SiteRescue] Using mock response for:', url);
  return new Promise(resolve => {
    setTimeout(() => {
      const report = {
        overallScore: 62,
        summary: "The site has solid bones but several trust and conversion signals are missing. A few targeted fixes could meaningfully improve how credible and actionable it feels to first-time visitors.",
        sections: [
          {
            name: "First Impression",
            severity: "Medium",
            summary: "The page loads reasonably fast, but the hero section doesn't immediately communicate who this is for or what action to take.",
            notes: [
              "The headline is descriptive but not benefit-driven.",
              "No social proof or trust indicator above the fold.",
              "Primary CTA is present but visually undersized.",
            ],
          },
          {
            name: "Trust & Legitimacy",
            severity: "High",
            summary: "Several key trust signals are absent, which may cause skeptical visitors to leave before converting.",
            notes: [
              "No visible phone number or physical address found.",
              "No SSL trust badge or security language near checkout/contact areas.",
              "Review or testimonial content not detected on the page.",
            ],
          },
          {
            name: "Conversion Clarity",
            severity: "High",
            summary: "The site doesn't make it obvious what the visitor should do next. Multiple competing CTAs dilute focus.",
            notes: [
              "Three separate calls-to-action with similar visual weight.",
              "Contact form is not visible without scrolling past the fold.",
              "No urgency or value proposition reinforcement near the main CTA.",
            ],
          },
          {
            name: "Mobile Readability",
            severity: "Low",
            summary: "Viewport meta tag is present and the layout adapts reasonably well on small screens.",
            notes: [
              "Font sizes are acceptable at 16px baseline.",
              "Touch targets appear to be adequately sized.",
            ],
          },
          {
            name: "SEO Basics",
            severity: "Medium",
            summary: "Core SEO tags are partially in place but there are gaps that could hurt discoverability.",
            notes: [
              "Meta description is missing.",
              "OpenGraph image not found — social previews will be blank.",
              "H1 tag is present, but H2 structure is sparse.",
              "No canonical tag detected.",
            ],
          },
          {
            name: "Design / Visual Polish",
            severity: "Medium",
            summary: "The visual design is functional but feels dated compared to current standards in this space.",
            notes: [
              "Color palette is generic — lacks a distinctive brand accent.",
              "Images are present but 4 are missing alt text.",
              "Whitespace usage is inconsistent; sections feel cramped on mobile.",
            ],
          },
        ],
        topFixes: [
          {
            issue: "Missing meta description",
            whyItMatters: "Search engines use this as your site's elevator pitch. Without it, Google writes one for you — and it's usually bad.",
            suggestedFix: "Write a 150-160 character meta description that states what you do and who you serve. Include one keyword naturally.",
          },
          {
            issue: "No visible contact info above the fold",
            whyItMatters: "First-time visitors, especially mobile users, need to trust you fast. A phone number in the header signals legitimacy immediately.",
            suggestedFix: "Add a phone number or email to the header or near the top of the page. Even a simple 'Call us: 555-0100' line helps.",
          },
          {
            issue: "Competing calls-to-action",
            whyItMatters: "When everything is equally emphasized, nothing gets clicked. Confused visitors leave.",
            suggestedFix: "Pick one primary CTA per page section. Make it visually dominant. Demote secondary actions to text links.",
          },
          {
            issue: "OpenGraph image not set",
            whyItMatters: "Every time someone shares your link on social media, it shows a blank box. That kills click-through and looks unfinished.",
            suggestedFix: "Add a 1200x630px OG image. Even a simple branded graphic with your logo and tagline is better than nothing.",
          },
          {
            issue: "Images missing alt text",
            whyItMatters: "Alt text helps screen readers, affects SEO, and displays if an image fails to load. Skipping it is an easy mistake to fix.",
            suggestedFix: "Audit all img tags and add descriptive alt attributes. For decorative images, use alt=''.",
          },
        ],
        finalRecommendation: "This site has a workable foundation, but it's leaving trust and conversions on the table. The highest-leverage moves are: add contact info near the top, consolidate your CTAs, and fix the missing SEO tags. These aren't design overhauls — they're quick wins that can make the site feel noticeably more credible within a few hours of work.",
      };

      resolve({
        url,
        report,
        shareId: 'mock-report',
        shareUrl: `${window.location.origin}${window.location.pathname}?report=mock-report`,
      });
    }, 2600);
  });
}
