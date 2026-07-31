/* ============================================================
   Launch Hero — script.js
   ManicWebmaster | Pure vanilla JS, no dependencies
   ============================================================ */

'use strict';

// ── Copy Banks ────────────────────────────────────────────────────────────────

const HEADLINE_PATTERNS = [
  (d) => `${d.name}: ${d.shortOffer}`,
  (d) => `${d.type} built for ${d.audience}`,
  (d) => `The ${d.adjective} ${d.type} your ${d.audience} deserves`,
  (d) => `Finally — ${d.type} that actually delivers`,
  (d) => `${d.name} makes it simple`,
  (d) => `Stop settling for average ${d.type}`,
  (d) => `More than ${d.type}. It's ${d.promise}.`,
  (d) => `Your search for great ${d.type} ends here`,
  (d) => `${d.audience} love ${d.name}`,
  (d) => `${d.type} that works as hard as you do`,
  (d) => `Get ${d.outcome} without the hassle`,
  (d) => `We built ${d.name} for ${d.audience}`,
  (d) => `${d.name} — where ${d.promise} meets results`,
];

const SUBHEADLINE_PATTERNS = [
  (d) => `${d.offer} ${d.audienceDesc} trust us to deliver, every time.`,
  (d) => `We specialize in ${d.type} for ${d.audience}. Fast, reliable, and worth every penny.`,
  (d) => `${d.offer} Thousands of ${d.audience} already know — you should too.`,
  (d) => `${d.name} cuts through the noise. Clear results, real value, zero fluff.`,
  (d) => `From first impression to final delivery, ${d.name} gets it done right.`,
  (d) => `You need ${d.type} that doesn't disappoint. That's exactly what ${d.name} is.`,
  (d) => `${d.audience} deserve better. ${d.name} delivers it.`,
  (d) => `Quality ${d.type} — on time, on budget, no surprises.`,
];

const BENEFIT_CHIP_BANKS = {
  clean:   ['Fast turnaround', 'No hassle', 'Clear pricing', 'Simple process', 'Quality guaranteed'],
  bold:    ['Built different', 'Zero excuses', 'Real results', 'No filler', 'Proven track record'],
  premium: ['White-glove service', 'Premium quality', 'Curated experience', 'Attention to detail', 'Elite results'],
  local:   ['Locally owned', 'Fast response', 'Clear pricing', 'Trusted by neighbors', 'Call anytime'],
  edgy:    ['No BS', 'Actually works', 'Built to last', 'Cuts through noise', 'Raw value'],
  playful: ['Super easy', 'Fun experience', 'No stress', 'You\'ll love it', 'Seriously good'],
  minimal: ['Simple', 'Focused', 'Clean process', 'Efficient', 'No clutter'],
};

const CREDIBILITY_LINES = [
  (d) => `Trusted by ${d.audience} across the area.`,
  (d) => `${d.name} has been serving ${d.audience} with consistent results.`,
  (d) => `Rated highly by the ${d.audience} who matter most to us.`,
  (d) => `Join the growing list of happy ${d.audience} who chose ${d.name}.`,
  (d) => `Built by people who actually understand what ${d.audience} need.`,
  (d) => `No surprises. No fluff. Just solid ${d.type} for ${d.audience}.`,
];

const LEGIT_HEADLINES = [
  (d) => `${d.name} is the ${d.type} ${d.audience} have been waiting for`,
  (d) => `Stop wasting time on the wrong ${d.type}. ${d.name} delivers.`,
  (d) => `${d.audience} deserve ${d.type} that actually shows up — that's ${d.name}`,
  (d) => `The only ${d.type} built specifically for ${d.audience}`,
  (d) => `${d.name}: Proven ${d.type} for ${d.audience} who expect more`,
];

const LEGIT_CHIPS = [
  ['Results guaranteed', 'Transparent pricing', 'Fast response time'],
  ['Top-rated service', 'No hidden fees', 'Dedicated support'],
  ['Industry-proven', 'On-time delivery', 'Real testimonials'],
  ['Locally trusted', 'Fully insured', 'Clear process'],
];

// ── Local Trust Bank ──────────────────────────────────────────────────────────
// Sets of 4 trust chips for the Local Service contact card.
// Each set should feel like a real business, not a generic checklist.
const LOCAL_TRUST_BANK = [
  ['Fast turnaround',    'Clear pricing',    'Locally owned',    'Call anytime'],
  ['Same-day service',   'No hidden fees',   'Free estimates',   'Family operated'],
  ['Licensed & insured', 'On-time arrival',  'Transparent rates','Serving since 2015'],
  ['5-star rated',       'Local crew',       'Fair pricing',     'Quick response'],
  ['Trusted neighbors',  'No surprises',     'Quality work',     'Always available'],
  ['Satisfaction guaranteed', 'Flat-rate pricing', 'Locally rooted', 'Real people'],
];

const ADJECTIVES = ['trusted', 'local', 'reliable', 'modern', 'fast', 'expert', 'premium', 'go-to'];
const PROMISES   = ['excellence', 'quality', 'reliability', 'speed', 'clarity', 'real value'];
const OUTCOMES   = ['real results', 'more time', 'peace of mind', 'better outcomes', 'what you paid for'];

// ── Testimonial Bank ──────────────────────────────────────────────────────────
// Each entry: { quote, initials, name, context }
// Quote should be short — max ~8 words. It's a pip, not a review.
const TESTIMONIAL_BANK = [
  { quote: 'Best decision we made all year.',   initials: 'SR', name: 'Sarah R.',   context: 'Repeat customer' },
  { quote: 'Exactly what we needed. Zero fluff.', initials: 'TK', name: 'Tom K.',    context: 'Referred by a friend' },
  { quote: 'Fast, professional, no surprises.',  initials: 'MJ', name: 'Marcus J.', context: 'Client since 2022' },
  { quote: 'Worth every penny.',                 initials: 'AL', name: 'Amy L.',    context: 'Longtime customer' },
  { quote: "Wish I'd found them sooner.",        initials: 'DC', name: 'Dana C.',   context: 'New customer' },
  { quote: 'Nobody else comes close.',           initials: 'RB', name: 'Ray B.',    context: 'Regular' },
  { quote: 'Legit. Does what it says.',          initials: 'JN', name: 'Jess N.',   context: 'Verified buyer' },
  { quote: 'My go-to, every single time.',       initials: 'PW', name: 'Pat W.',    context: 'Since day one' },
  { quote: 'Straightforward and actually good.', initials: 'CM', name: 'Chris M.',  context: '5-star review' },
  { quote: 'Showed up, delivered, done.',        initials: 'EH', name: 'Elena H.',  context: 'Happy customer' },
];

// ── Stat Bank ─────────────────────────────────────────────────────────────────
// Pools of stats by category. buildStats() picks 3 that don't repeat categories.
// Each stat: { val, lbl }
const STAT_BANK = {
  satisfaction: [
    { val: '4.9★', lbl: 'Avg. rating'    },
    { val: '98%',  lbl: 'Satisfaction'   },
    { val: '5★',   lbl: 'Rated'          },
  ],
  volume: [
    { val: '500+',  lbl: 'Happy clients'  },
    { val: '1k+',   lbl: 'Orders served'  },
    { val: '200+',  lbl: 'Projects done'  },
    { val: '800+',  lbl: 'Customers'      },
  ],
  speed: [
    { val: '24h',  lbl: 'Turnaround'     },
    { val: '<1h',  lbl: 'Response time'  },
    { val: 'Same day', lbl: 'Service'    },
    { val: '20m',  lbl: 'Avg. wait'      },
  ],
  tenure: [
    { val: '10yr', lbl: 'In business'    },
    { val: '5yr+', lbl: 'Experience'     },
    { val: '2018', lbl: 'Est.'           },
  ],
  guarantee: [
    { val: '100%', lbl: 'Guaranteed'     },
    { val: 'Free', lbl: 'Revisions'      },
    { val: '0',    lbl: 'Hidden fees'    },
  ],
};

// Pick 3 stats from distinct categories
function buildStats() {
  const categories = Object.keys(STAT_BANK);
  const picked     = pickN(categories, 3);
  return picked.map(cat => pick(STAT_BANK[cat]));
}

// ── Feature Bank ──────────────────────────────────────────────────────────────
// Each feature: { icon (SVG path data), title, desc }
// Icons are 20×20 viewBox, stroke-based. renderProduct injects them as inline SVG.
const FEATURE_BANK = [
  {
    path: 'M10 3l1.5 4.5H17l-4.5 3 1.5 4.5L10 12l-4 3 1.5-4.5L3 7.5h5.5L10 3z',
    title: 'Built to impress',
    desc:  'First impressions that convert. Quality that keeps them coming back.',
  },
  {
    path: 'M4 10h12M10 4v12',
    title: 'Simple by design',
    desc:  'No bloat, no confusion. Just the features that matter, done right.',
  },
  {
    path: 'M3 10a7 7 0 1014 0A7 7 0 003 10zm4.5 0l2 2 3.5-3.5',
    title: 'Reliable by default',
    desc:  'Ships on time, performs under pressure, no surprises.',
  },
  {
    path: 'M5 3h10a2 2 0 012 2v10a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2zm2 4h6M7 10h6M7 13h4',
    title: 'Clear reporting',
    desc:  'Know what\'s working. Decisions backed by real data, not guesswork.',
  },
  {
    path: 'M13 3L7 10h4l-3 7 7-8h-4l2-6z',
    title: 'Instant results',
    desc:  'Speed isn\'t a feature — it\'s the foundation. Fast from day one.',
  },
  {
    path: 'M4 17L10 3l6 14M6.5 12h7',
    title: 'Built to scale',
    desc:  'Handles day one and day one thousand without missing a beat.',
  },
  {
    path: 'M12 3c0 5-4 7-4 10h8c0-3-4-5-4-10zM8 17h8M10 20h4',
    title: 'Light bulb moments',
    desc:  'Smart features that actually solve the problem you showed up with.',
  },
  {
    path: 'M4 6h12M4 10h12M4 14h8',
    title: 'Organized output',
    desc:  'Everything in its place. Clean structure from the first click.',
  },
];

// ── Product Stat Bar ──────────────────────────────────────────────────────────
// Three-stat traction bar rendered above the feature cards.
// Pulls one entry from each of three categories (no repeats).
const PRODUCT_STAT_SETS = [
  [{ val: '10k+', lbl: 'Users' },       { val: '4.9★', lbl: 'Rating' },    { val: '99%',  lbl: 'Uptime' }],
  [{ val: '500+', lbl: 'Teams' },        { val: '<2s',  lbl: 'Load time' }, { val: 'Free', lbl: 'To start' }],
  [{ val: '2min', lbl: 'Setup time' },   { val: '0',    lbl: 'Lock-in' },   { val: '24/7', lbl: 'Support' }],
  [{ val: '1k+',  lbl: 'Customers' },    { val: '98%',  lbl: 'Retention' }, { val: '$0',   lbl: 'Hidden fees' }],
  [{ val: '50ms', lbl: 'Avg. response'}, { val: '100%', lbl: 'Reliable' },  { val: 'Ship', lbl: 'Same day' }],
];

// ── Creative Services Bank ────────────────────────────────────────────────────
// Sets of 4 discipline/medium tags shown as a services row in the creative template.
const CREATIVE_SERVICES_BANK = [
  ['Brand Identity', 'Web Design', 'Motion', 'Print'],
  ['Strategy', 'Visual Design', 'Copywriting', 'Development'],
  ['Branding', 'UI/UX', 'Photography', 'Art Direction'],
  ['Logos', 'Websites', 'Campaigns', 'Packaging'],
  ['Identity Systems', 'Digital Design', 'Illustration', 'Content'],
  ['Creative Direction', 'Design Systems', 'Video', 'Consulting'],
];

// ── Industry Presets ─────────────────────────────────────────────────────────

const PRESETS = {
  restaurant: {
    name: 'Midnight Slice',
    type: 'Late-night pizza shop',
    offer: 'Hot, creative pizza for after-dark cravings.',
    audience: 'Night owls and downtown regulars',
    industry: 'Food & drink',
    location: 'Downtown Dallas',
    proof: '4.9 stars from 1k+ orders served',
    value: 'Open late with fast pickup',
    phone: '(555) 000-1234',
    cta1: 'Order Now',
    cta2: 'View Menu',
    ctaUrl: 'https://example.com/order',
    tone: 'edgy',
    color: 'dark-neon',
    tmpl: 'split',
  },
  service: {
    name: 'Peak Local Repair',
    type: 'Home repair service',
    offer: 'Reliable fixes, fair pricing, and clear communication.',
    audience: 'Busy homeowners',
    industry: 'Local service',
    location: 'North Texas',
    proof: 'Licensed, insured, and 5-star rated',
    value: 'Free same-day estimate',
    phone: '(555) 000-1234',
    cta1: 'Get a Quote',
    cta2: 'See Services',
    ctaUrl: 'https://example.com/quote',
    tone: 'local',
    color: 'warm-local',
    tmpl: 'local',
  },
  saas: {
    name: 'FlowBoard',
    type: 'Project dashboard',
    offer: 'A calmer way to see every project, deadline, and blocker.',
    audience: 'Lean teams and founders',
    industry: 'SaaS',
    location: 'Worldwide',
    proof: 'Used by 500+ growing teams',
    value: 'Free to start',
    phone: '',
    cta1: 'Start Free',
    cta2: 'Watch Demo',
    ctaUrl: 'https://example.com/signup',
    tone: 'clean',
    color: 'cyber-cyan',
    tmpl: 'product',
  },
  creator: {
    name: 'North Star Notes',
    type: 'Creator newsletter',
    offer: 'Practical essays for people building a braver creative life.',
    audience: 'Writers, makers, and independent creatives',
    industry: 'Creator',
    location: 'Online',
    proof: 'Read by 8k+ thoughtful subscribers',
    value: 'Weekly notes, always free',
    phone: '',
    cta1: 'Subscribe Free',
    cta2: 'Read Samples',
    ctaUrl: 'https://example.com/subscribe',
    tone: 'minimal',
    color: 'clean-light',
    tmpl: 'centered',
  },
  event: {
    name: 'Signal Night',
    type: 'Founder meetup',
    offer: 'One sharp night of demos, deals, and useful conversations.',
    audience: 'Startup operators and local builders',
    industry: 'Events',
    location: 'Dallas, TX',
    proof: '300+ attendees expected',
    value: 'Early tickets from $25',
    phone: '',
    cta1: 'Reserve a Seat',
    cta2: 'See Lineup',
    ctaUrl: 'https://example.com/tickets',
    tone: 'bold',
    color: 'sunset-punch',
    tmpl: 'centered',
  },
  agency: {
    name: 'Brightline Studio',
    type: 'Brand and web design studio',
    offer: 'Sharp websites and identity systems for serious small businesses.',
    audience: 'Founders and service brands',
    industry: 'Design agency',
    location: 'Dallas and remote',
    proof: '100+ launches delivered',
    value: 'Strategy call included',
    phone: '(555) 000-1234',
    cta1: 'Book a Call',
    cta2: 'View Work',
    ctaUrl: 'https://example.com/book',
    tone: 'premium',
    color: 'premium-mono',
    tmpl: 'creative',
  },
};

// ── Utility Helpers ────────────────────────────────────────────────────────────

function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function pickN(arr, n) {
  const shuffled = [...arr].sort(() => .5 - Math.random());
  return shuffled.slice(0, n);
}

function capitalize(str) {
  if (!str) return '';
  return str.trim().charAt(0).toUpperCase() + str.trim().slice(1);
}

function toSlug(name) {
  return name.toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .trim()
    .replace(/\s+/g, '')
    .substring(0, 24);
}

function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, char => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  }[char]));
}

function safeUrl(value) {
  const raw = String(value || '').trim();
  if (!raw) return '#';
  if (raw.startsWith('#')) return escapeHtml(raw);
  const hasProtocol = /^[a-z][a-z0-9+.-]*:/i.test(raw);
  try {
    const url = new URL(raw);
    if (['http:', 'https:', 'mailto:', 'tel:'].includes(url.protocol)) {
      return escapeHtml(url.href);
    }
  } catch (_) {
    if (hasProtocol) return '#';
    try {
      const url = new URL(`https://${raw}`);
      return escapeHtml(url.href);
    } catch (_) { /* no-op */ }
  }
  return '#';
}

function phoneHref(phone) {
  const digits = String(phone || '').replace(/[^\d+]/g, '');
  return digits ? `tel:${digits}` : '#';
}

function getFormData() {
  const name     = capitalize(document.getElementById('field-name').value)     || 'Midnight Slice';
  const type     = capitalize(document.getElementById('field-type').value)     || 'late-night pizza shop';
  const offer    = capitalize(document.getElementById('field-offer').value)    || 'Hot, creative pizza for after-dark cravings.';
  const audience = capitalize(document.getElementById('field-audience').value) || 'night owls and downtown regulars';
  const industry = capitalize(document.getElementById('field-industry').value);
  const location = capitalize(document.getElementById('field-location').value);
  const proof    = capitalize(document.getElementById('field-proof').value);
  const value    = capitalize(document.getElementById('field-value').value);
  const phone    = document.getElementById('field-phone').value.trim();
  const cta1     = capitalize(document.getElementById('field-cta1').value)     || 'Order Now';
  const cta2     = capitalize(document.getElementById('field-cta2').value)     || 'View Menu';
  const ctaUrl   = document.getElementById('field-cta-url').value.trim();
  const tone     = document.getElementById('field-tone').value;
  const color    = document.getElementById('field-color').value;
  const tmpl     = document.getElementById('field-template').value;
  return { name, type, offer, audience, industry, location, proof, value, phone, cta1, cta2, ctaUrl, tone, color, tmpl };
}

function buildDerivatives(raw) {
  const safe = {};
  ['name', 'type', 'offer', 'audience', 'industry', 'location', 'proof', 'value', 'phone', 'cta1', 'cta2'].forEach(key => {
    safe[key] = escapeHtml(raw[key]);
  });

  return {
    ...raw,
    ...safe,
    shortOffer:   escapeHtml(raw.offer.replace(/\.$/, '').split(',')[0].trim()),
    audienceDesc: escapeHtml(capitalize(raw.audience)),
    adjective:    pick(ADJECTIVES),
    promise:      pick(PROMISES),
    outcome:      pick(OUTCOMES),
    primaryHref:  safeUrl(raw.ctaUrl),
    phoneHref:    raw.phone ? phoneHref(raw.phone) : 'tel:5550001234',
    phoneText:    escapeHtml(raw.phone || '(555) 000-1234'),
    serviceArea:  raw.location ? `Serving ${escapeHtml(raw.location)}` : 'Serving the local area',
    industryTag:  escapeHtml(raw.industry || raw.type),
  };
}

function resolveTemplate(tmplChoice) {
  const options = ['split', 'centered', 'local', 'product', 'creative'];
  return tmplChoice === 'surprise' ? pick(options) : tmplChoice;
}

function colorVibeClass(vibe) {
  const map = {
    'dark-neon':     'lh-vibe-dark-neon',
    'clean-light':   'lh-vibe-clean-light',
    'warm-local':    'lh-vibe-warm-local',
    'premium-mono':  'lh-vibe-premium-mono',
    'cyber-cyan':    'lh-vibe-cyber-cyan',
    'sunset-punch':  'lh-vibe-sunset-punch',
  };
  return map[vibe] || 'lh-vibe-dark-neon';
}

// ── Split Hero Card Visual ─────────────────────────────────────────────────────
// Used exclusively by renderSplit. Stat bank + testimonial pip, CSS-only.

const CHECK_SVG = `<svg width="11" height="11" viewBox="0 0 11 11" fill="none">
  <path d="M2 5.5l2.5 2.5 4.5-4.5" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"/>
</svg>`;

const ARROW_SVG = `<svg width="13" height="13" viewBox="0 0 13 13" fill="none">
  <path d="M2.5 6.5h8M7 3.5l3 3-3 3" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"/>
</svg>`;

function buildSplitCard(d) {
  const pip   = pick(TESTIMONIAL_BANK);
  const stats = buildStats();

  const statsHtml = stats.map(s => `
    <div class="lh-stat">
      <div class="lh-stat-val">${s.val}</div>
      <div class="lh-stat-lbl">${s.lbl}</div>
    </div>`).join('');

  return `
    <div class="lh-visual-col">
      <div class="lh-card">
        <div class="lh-card-orb lh-card-orb-1"></div>
        <div class="lh-card-orb lh-card-orb-2"></div>
        <div class="lh-card-badge">Most popular</div>
        <div class="lh-card-label">${d.name}</div>
        <div class="lh-skel lh-skel-title"></div>
        <div class="lh-skel lh-skel-body"></div>
        <div class="lh-skel lh-skel-body-s"></div>
        <div class="lh-card-rating">
          <div class="lh-stars">★★★★★</div>
          <span class="lh-rating-text">Highly rated</span>
        </div>
        <div class="lh-card-stats">${statsHtml}</div>
        <button class="lh-card-cta">${d.cta1} ${ARROW_SVG}</button>
      </div>
      <div class="lh-float-pip">
        <div class="lh-pip-avatar">${pip.initials}</div>
        <div>
          <div class="lh-pip-quote">"${pip.quote}"</div>
          <div class="lh-pip-meta">${pip.name} · ${pip.context}</div>
        </div>
      </div>
    </div>`;
}

// ── Template Builders ─────────────────────────────────────────────────────────

function buildChips(tone, isLegit = false) {
  const bank = BENEFIT_CHIP_BANKS[tone] || BENEFIT_CHIP_BANKS.clean;
  const items = isLegit ? pick(LEGIT_CHIPS) : pickN(bank, 3);
  return `<div class="lh-chips">${items.map(c => `<span class="lh-chip">${c}</span>`).join('')}</div>`;
}

function buildValueLine(d) {
  return d.value ? `<p class="lh-value-line">${d.value}</p>` : '';
}

function buildHeroContent(d, isLegit = false) {
  const headlineFn = isLegit ? pick(LEGIT_HEADLINES) : pick(HEADLINE_PATTERNS);
  const headline   = headlineFn(d);
  const subheadline = pick(SUBHEADLINE_PATTERNS)(d);
  const cred       = d.proof || pick(CREDIBILITY_LINES)(d);

  return { headline, subheadline, cred };
}

function renderSplit(d, isLegit) {
  const { headline, subheadline, cred } = buildHeroContent(d, isLegit);
  return `
    <section class="lh-generated-hero lh-hero-split ${colorVibeClass(d.color)}">
      <div class="lh-hero-inner">
        <div class="lh-copy-col">
          <span class="lh-eyebrow">${d.type}</span>
          <h1 class="lh-headline lh-headline-lg">${headline}</h1>
          <p class="lh-subheadline">${subheadline}</p>
          <div class="lh-cta-group">
            <a href="${d.primaryHref}" class="lh-cta-primary">${d.cta1} →</a>
            <a href="#" class="lh-cta-secondary">${d.cta2}</a>
          </div>
          ${buildChips(d.tone, isLegit)}
          ${buildValueLine(d)}
          <p class="lh-credibility">${cred}</p>
        </div>
        ${buildSplitCard(d)}
      </div>
    </section>`;
}

function renderCentered(d, isLegit) {
  const { headline, subheadline, cred } = buildHeroContent(d, isLegit);
  // Pick 3 distinct testimonials for the avatar stack
  const pips = pickN(TESTIMONIAL_BANK, 3);
  const stat = pick(STAT_BANK.volume);

  const avatarStack = pips.map((p, i) => `
    <div class="lh-avatar" style="z-index:${3 - i}">${p.initials}</div>`).join('');

  return `
    <section class="lh-generated-hero lh-hero-centered ${colorVibeClass(d.color)}">
      <div class="lh-centered-glow" aria-hidden="true"></div>
      <div class="lh-hero-inner">
        <span class="lh-eyebrow">${d.name} · ${d.type}</span>
        <h1 class="lh-headline lh-headline-xl">${headline}</h1>
        <p class="lh-subheadline">${subheadline}</p>
        <div class="lh-cta-group">
          <a href="${d.primaryHref}" class="lh-cta-primary">${d.cta1} →</a>
          <a href="#" class="lh-cta-secondary">${d.cta2}</a>
        </div>
        ${buildChips(d.tone, isLegit)}
        ${buildValueLine(d)}
        <div class="lh-social-proof">
          <div class="lh-avatar-stack">${avatarStack}</div>
          <div class="lh-social-proof-text">
            <span class="lh-social-proof-count">${stat.val}</span>
            <span class="lh-social-proof-label">${stat.lbl} and counting</span>
          </div>
        </div>
        <p class="lh-credibility">${cred}</p>
      </div>
    </section>`;
}

function renderLocal(d, isLegit) {
  const { headline, subheadline, cred } = buildHeroContent(d, isLegit);
  const trustSet = pick(LOCAL_TRUST_BANK);
  const stat     = pick(STAT_BANK.satisfaction);

  const trustHtml = trustSet.map(t => `
    <div class="lh-trust-chip">
      <svg class="lh-trust-check" width="11" height="11" viewBox="0 0 11 11" fill="none">
        <path d="M2 5.5l2.5 2.5 4.5-4.5" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
      ${t}
    </div>`).join('');

  return `
    <section class="lh-generated-hero lh-hero-local ${colorVibeClass(d.color)}">
      <div class="lh-hero-inner">

        <div class="lh-copy-col">
          <span class="lh-eyebrow">${d.name} · Local &amp; Trusted</span>
          <h1 class="lh-headline lh-headline-lg">${headline}</h1>
          <p class="lh-subheadline">${subheadline}</p>
          <div class="lh-cta-group">
            <a href="${d.primaryHref}" class="lh-cta-primary">${d.cta1}</a>
            <a href="#" class="lh-cta-secondary">${d.cta2}</a>
          </div>
          ${buildChips(d.tone, isLegit)}
          ${buildValueLine(d)}
          <p class="lh-credibility">${cred}</p>
        </div>

        <div class="lh-local-card">
          <div class="lh-local-card-top">
            <div class="lh-local-rating">
              <span class="lh-local-stars">★★★★★</span>
              <span class="lh-local-rating-val">${stat.val}</span>
            </div>
            <div class="lh-local-rating-lbl">${stat.lbl}</div>
          </div>

          <div class="lh-local-divider"></div>

          <div class="lh-local-contact-label">Call or Text</div>
          <a href="${d.phoneHref}" class="lh-local-phone">${d.phoneText}</a>

          <div class="lh-local-meta">
            <div class="lh-local-meta-row">
              <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
                <circle cx="6.5" cy="6.5" r="5.5" stroke="currentColor" stroke-width="1.25"/>
                <path d="M6.5 4v3l2 1.5" stroke="currentColor" stroke-width="1.25" stroke-linecap="round"/>
              </svg>
              <span>Mon–Sat, 8am–6pm</span>
            </div>
            <div class="lh-local-meta-row">
              <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
                <path d="M6.5 1.5C4.567 1.5 3 3.067 3 5c0 2.5 3.5 6.5 3.5 6.5S10 7.5 10 5c0-1.933-1.567-3.5-3.5-3.5z" stroke="currentColor" stroke-width="1.25"/>
                <circle cx="6.5" cy="5" r="1.25" stroke="currentColor" stroke-width="1.25"/>
              </svg>
              <span>${d.serviceArea}</span>
            </div>
          </div>

          <div class="lh-local-divider"></div>

          <div class="lh-trust-chips">${trustHtml}</div>
        </div>

      </div>
    </section>`;
}

function renderProduct(d, isLegit) {
  const { headline, subheadline, cred } = buildHeroContent(d, isLegit);
  const features  = pickN(FEATURE_BANK, 3);
  const statSet   = pick(PRODUCT_STAT_SETS);

  const featureHtml = features.map(f => `
    <div class="lh-feature-card">
      <div class="lh-feature-icon-wrap">
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
          <path d="${f.path}"/>
        </svg>
      </div>
      <div class="lh-feature-title">${f.title}</div>
      <div class="lh-feature-desc">${f.desc}</div>
    </div>`).join('');

  const statHtml = statSet.map(s => `
    <div class="lh-product-stat">
      <div class="lh-product-stat-val">${s.val}</div>
      <div class="lh-product-stat-lbl">${s.lbl}</div>
    </div>`).join('');

  return `
    <section class="lh-generated-hero lh-hero-product ${colorVibeClass(d.color)}">
      <div class="lh-product-glow" aria-hidden="true"></div>
      <div class="lh-hero-inner">
        <span class="lh-eyebrow">${d.name} · ${d.type}</span>
        <h1 class="lh-headline lh-headline-xl">${headline}</h1>
        <p class="lh-subheadline">${subheadline}</p>
        <div class="lh-cta-group">
          <a href="${d.primaryHref}" class="lh-cta-primary">${d.cta1} →</a>
          <a href="#" class="lh-cta-secondary">${d.cta2}</a>
        </div>
        ${buildValueLine(d)}
        <div class="lh-product-stat-bar">${statHtml}</div>
        <div class="lh-feature-grid">${featureHtml}</div>
        <p class="lh-credibility" style="margin-top:1.5rem;text-align:center;">${cred}</p>
      </div>
    </section>`;
}

function renderCreative(d, isLegit) {
  const { headline, subheadline, cred } = buildHeroContent(d, isLegit);
  const services = pick(CREATIVE_SERVICES_BANK);
  const pip      = pick(TESTIMONIAL_BANK);

  // Split headline: first ~40% of words get large treatment, rest go outline
  const words   = headline.split(' ');
  const breakAt = Math.max(2, Math.ceil(words.length * 0.4));
  const line1   = words.slice(0, breakAt).join(' ');
  const line2   = words.slice(breakAt).join(' ');

  const serviceTagsHtml = services.map(s =>
    `<span class="lh-creative-service-tag">${s}</span>`
  ).join('');

  return `
    <section class="lh-generated-hero lh-hero-creative ${colorVibeClass(d.color)}">
      <div class="lh-creative-top-bar"></div>
      <div class="lh-hero-inner">

        <div class="lh-creative-left">
          <div class="lh-creative-meta">
            <span class="lh-creative-index">001</span>
            <span class="lh-creative-divider-dot"></span>
            <span class="lh-creative-label">${d.type}</span>
          </div>
          <h1 class="lh-creative-headline">
            <span class="lh-creative-line-solid">${line1}</span>
            <span class="lh-creative-line-outline">${line2}</span>
          </h1>
          <p class="lh-creative-sub">${subheadline}</p>
          <div class="lh-cta-group">
            <a href="${d.primaryHref}" class="lh-cta-primary">${d.cta1} →</a>
            <a href="#" class="lh-cta-secondary">${d.cta2}</a>
          </div>
          ${buildValueLine(d)}
          <div class="lh-creative-services">${serviceTagsHtml}</div>
        </div>

        <div class="lh-creative-right">
          <div class="lh-creative-tiles">
            <div class="lh-tile lh-tile-lg">
              <div class="lh-tile-orb"></div>
              <div class="lh-tile-label">${d.name}</div>
              <div class="lh-tile-line lh-tile-line-w70"></div>
              <div class="lh-tile-line lh-tile-line-w50"></div>
            </div>
            <div class="lh-tile lh-tile-sm lh-tile-accent">
              <div class="lh-tile-stat-val">★★★★★</div>
              <div class="lh-tile-stat-lbl">Rated</div>
            </div>
            <div class="lh-tile lh-tile-sm">
              <div class="lh-tile-stat-val">100+</div>
              <div class="lh-tile-stat-lbl">Projects</div>
            </div>
          </div>
          <div class="lh-creative-pip">
            <div class="lh-pip-avatar">${pip.initials}</div>
            <div>
              <div class="lh-pip-quote">"${pip.quote}"</div>
              <div class="lh-pip-meta">${pip.name} · ${pip.context}</div>
            </div>
          </div>
        </div>

      </div>
      <div class="lh-creative-bottom-bar">
        <span class="lh-creative-cred">${cred}</span>
        <span class="lh-creative-year">${d.name} © ${new Date().getFullYear()}</span>
      </div>
    </section>`;
}

// ── Render Dispatcher ─────────────────────────────────────────────────────────

const RENDERERS = {
  split:    renderSplit,
  centered: renderCentered,
  local:    renderLocal,
  product:  renderProduct,
  creative: renderCreative,
};

function renderHero(rawData, isLegit = false) {
  const d = buildDerivatives(rawData);
  const tmpl = resolveTemplate(d.tmpl);
  const renderer = RENDERERS[tmpl] || renderCentered;
  return renderer(d, isLegit);
}

// ── State ─────────────────────────────────────────────────────────────────────

let state = {
  html:     '',
  css:      '',
  isLegit:  false,
  viewMode: 'desktop', // 'desktop' | 'mobile'
  rawCss:   '',        // full style.css text, fetched once at init
  lastRaw:  null,
};

const STORAGE_KEY = 'launchHero.savedHeroes.v1';
const FORM_FIELDS = {
  name: 'field-name',
  type: 'field-type',
  offer: 'field-offer',
  audience: 'field-audience',
  industry: 'field-industry',
  location: 'field-location',
  proof: 'field-proof',
  value: 'field-value',
  phone: 'field-phone',
  cta1: 'field-cta1',
  cta2: 'field-cta2',
  ctaUrl: 'field-cta-url',
  tone: 'field-tone',
  color: 'field-color',
  tmpl: 'field-template',
};

// ── Preview Injection ─────────────────────────────────────────────────────────

// Build a full srcdoc string for the mobile iframe — self-contained HTML with
// inline CSS so vw units, media queries, and responsive layouts all fire at 375px.
// Uses the raw style.css text fetched at init — works on file:// and https://.
function buildPreviewDoc(heroHtml) {
  const css = state.rawCss || extractHeroCss();
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1.0"/>
<style>
*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
body { font-family: 'Segoe UI', system-ui, -apple-system, sans-serif; }
${css}
</style>
</head>
<body>${heroHtml}</body>
</html>`;
}

function injectPreview(heroHtml) {
  if (state.viewMode === 'mobile') {
    injectMobilePreview(heroHtml);
  } else {
    injectDesktopPreview(heroHtml);
  }
}

function injectDesktopPreview(heroHtml) {
  const wrap = document.getElementById('preview-viewport-wrap');
  // Remove any existing iframe
  const existing = document.getElementById('preview-iframe');
  if (existing) existing.remove();
  // Ensure the div exists and is visible
  let div = document.getElementById('preview-viewport');
  if (!div) {
    div = document.createElement('div');
    div.id = 'preview-viewport';
    wrap.appendChild(div);
  }
  div.style.display = '';
  div.innerHTML = heroHtml;
}

function injectMobilePreview(heroHtml) {
  const wrap = document.getElementById('preview-viewport-wrap');
  // Hide the desktop div
  const div = document.getElementById('preview-viewport');
  if (div) div.style.display = 'none';
  // Remove stale iframe if present
  const existing = document.getElementById('preview-iframe');
  if (existing) existing.remove();
  // Create fresh iframe — srcdoc gives it a real 375px viewport
  const iframe = document.createElement('iframe');
  iframe.id = 'preview-iframe';
  iframe.setAttribute('srcdoc', buildPreviewDoc(heroHtml));
  iframe.setAttribute('scrolling', 'yes');
  wrap.appendChild(iframe);
}

function updateBrowserUrl(name) {
  const slug = toSlug(name) || 'yoursite';
  document.getElementById('browser-url').textContent = `${slug}.com`;
}

function showToast(msg) {
  const el = document.getElementById('copy-toast');
  el.textContent = msg;
  clearTimeout(el._timer);
  el._timer = setTimeout(() => { el.textContent = ''; }, 2500);
}

function applyFormData(data = {}) {
  Object.entries(FORM_FIELDS).forEach(([key, id]) => {
    const el = document.getElementById(id);
    if (!el || data[key] === undefined) return;
    el.value = data[key];
  });
}

function markPreset(key) {
  document.querySelectorAll('.preset-chip').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.preset === key);
  });
}

function updateQualityPanel(raw) {
  const panel = document.getElementById('quality-panel');
  if (!panel) return;

  const checks = [
    { ok: !!raw.cta1 && !!raw.ctaUrl, label: raw.ctaUrl ? 'CTA linked' : 'CTA label ready' },
    { ok: !!raw.proof, label: raw.proof ? 'Proof included' : 'Add proof' },
    { ok: !!raw.value, label: raw.value ? 'Offer value clear' : 'Add offer value' },
    { ok: !!raw.phone || raw.tmpl !== 'local', label: raw.phone ? 'Contact ready' : 'Contact optional' },
    { ok: true, label: 'Mobile preview ready' },
  ];

  panel.innerHTML = checks.map(check => `
    <span class="quality-badge ${check.ok ? 'good' : 'warn'}">${check.ok ? '✓' : '!'} ${escapeHtml(check.label)}</span>
  `).join('');
}

function getSavedHeroes() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
  } catch (_) {
    return [];
  }
}

function setSavedHeroes(items) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items.slice(0, 8)));
}

function renderSavedHeroes() {
  const wrap = document.getElementById('saved-heroes');
  if (!wrap) return;
  const items = getSavedHeroes();
  if (!items.length) {
    wrap.innerHTML = '';
    return;
  }

  wrap.innerHTML = `
    <div class="saved-heroes-title">Saved Heroes</div>
    <div class="saved-hero-list">
      ${items.map(item => `
        <div class="saved-hero-item" data-id="${escapeHtml(item.id)}">
          <div>
            <div class="saved-hero-name">${escapeHtml(item.name || 'Untitled Hero')}</div>
            <div class="saved-hero-meta">${escapeHtml(item.template || 'hero')} · ${escapeHtml(item.date || '')}</div>
          </div>
          <button type="button" data-action="load">Load</button>
          <button type="button" data-action="delete">Delete</button>
        </div>
      `).join('')}
    </div>`;
}

function saveCurrentHero() {
  if (!state.lastRaw) {
    showToast('Generate a hero first.');
    return;
  }

  const items = getSavedHeroes().filter(item => item.id !== state.lastRaw.name + state.lastRaw.tmpl);
  const saved = {
    id: String(Date.now()),
    name: state.lastRaw.name,
    template: state.lastRaw.tmpl,
    date: new Date().toLocaleDateString(),
    data: state.lastRaw,
  };
  setSavedHeroes([saved, ...items]);
  renderSavedHeroes();
  showToast('Hero saved ✓');
}

function encodeShareData(data) {
  return btoa(encodeURIComponent(JSON.stringify(data)));
}

function decodeShareData(encoded) {
  try {
    return JSON.parse(decodeURIComponent(atob(encoded)));
  } catch (_) {
    return null;
  }
}

function copyShareLink() {
  if (!state.lastRaw) {
    showToast('Generate a hero first.');
    return;
  }
  const url = `${location.origin}${location.pathname}#hero=${encodeShareData(state.lastRaw)}`;
  copyToClipboard(url, 'Share link');
}

function loadSharedHero() {
  const match = location.hash.match(/^#hero=(.+)$/);
  if (!match) return false;
  const data = decodeShareData(match[1]);
  if (!data) return false;
  applyFormData(data);
  generate(false);
  return true;
}

// ── CSS Extraction ────────────────────────────────────────────────────────────
// We pull the hero-relevant CSS from the stylesheet in the DOM to bundle exports.

function extractHeroCss() {
  let css = '';
  try {
    const sheets = Array.from(document.styleSheets);
    for (const sheet of sheets) {
      try {
        const rules = Array.from(sheet.cssRules || []);
        for (const rule of rules) {
          const text = rule.cssText || '';
          // Only grab rules that belong to generated hero styles
          if (
            text.includes('lh-') ||
            text.includes('--lh-') ||
            (rule.selectorText && rule.selectorText.includes('lh-'))
          ) {
            css += rule.cssText + '\n';
          }
        }
      } catch (_) {
        // CORS-blocked sheet; skip
      }
    }
  } catch (_) { /* no-op */ }
  return css || '/* Hero CSS — see style.css in the Launch Hero download */';
}

// ── Download Builder ──────────────────────────────────────────────────────────

function buildStandaloneHtml(heroHtml, name) {
  const css = extractHeroCss();
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${escapeHtml(name || 'Hero Section')}</title>
  <style>
*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
body { font-family: 'Segoe UI', system-ui, -apple-system, sans-serif; }
${css}
  </style>
</head>
<body>
${heroHtml}
</body>
</html>`;
}

function htmlToJsx(html) {
  return html
    .replace(/\bclass=/g, 'className=')
    .replace(/\bfor=/g, 'htmlFor=')
    .replace(/stroke-width=/g, 'strokeWidth=')
    .replace(/stroke-linecap=/g, 'strokeLinecap=')
    .replace(/stroke-linejoin=/g, 'strokeLinejoin=')
    .replace(/fill-rule=/g, 'fillRule=')
    .replace(/clip-rule=/g, 'clipRule=')
    .replace(/style="z-index:(\d+)"/g, 'style={{ zIndex: $1 }}');
}

function buildReactComponent(heroHtml) {
  return `import './launch-hero.css';

export default function LaunchHero() {
  return (
    <>
${htmlToJsx(heroHtml).split('\n').map(line => `      ${line}`).join('\n')}
    </>
  );
}
`;
}

function buildTailwindHero(raw) {
  const d = buildDerivatives(raw);
  const { headline, subheadline, cred } = buildHeroContent(d, state.isLegit);
  return `<section class="relative overflow-hidden bg-slate-950 px-6 py-20 text-white">
  <div class="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(34,211,238,.22),transparent_34%),radial-gradient(circle_at_bottom_left,rgba(168,85,247,.16),transparent_30%)]"></div>
  <div class="relative mx-auto grid max-w-6xl items-center gap-12 lg:grid-cols-[1fr_380px]">
    <div>
      <p class="mb-4 inline-flex rounded-md border border-cyan-300/25 bg-cyan-300/10 px-3 py-1 text-xs font-bold uppercase tracking-wider text-cyan-200">${d.industryTag}</p>
      <h1 class="max-w-3xl text-4xl font-black leading-tight text-white md:text-6xl">${headline}</h1>
      <p class="mt-5 max-w-2xl text-lg leading-8 text-slate-300">${subheadline}</p>
      <div class="mt-8 flex flex-wrap gap-3">
        <a href="${d.primaryHref}" class="rounded-md bg-cyan-300 px-5 py-3 text-sm font-bold text-slate-950">${d.cta1}</a>
        <a href="#" class="rounded-md border border-white/15 px-5 py-3 text-sm font-bold text-slate-200">${d.cta2}</a>
      </div>
      ${d.value ? `<p class="mt-5 inline-flex rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm font-bold text-slate-100">${d.value}</p>` : ''}
      <p class="mt-5 text-sm text-slate-400">${cred}</p>
    </div>
    <div class="rounded-xl border border-white/10 bg-white/[.04] p-6 shadow-2xl">
      <div class="mb-5 h-2 w-28 rounded bg-cyan-300"></div>
      <div class="space-y-3">
        <div class="h-4 w-3/4 rounded bg-white/10"></div>
        <div class="h-3 w-full rounded bg-white/10"></div>
        <div class="h-3 w-2/3 rounded bg-white/10"></div>
      </div>
      <div class="mt-8 grid grid-cols-3 gap-3 text-center">
        <div class="rounded-md bg-white/5 p-3"><strong class="block text-lg">4.9★</strong><span class="text-xs text-slate-400">Rating</span></div>
        <div class="rounded-md bg-white/5 p-3"><strong class="block text-lg">24h</strong><span class="text-xs text-slate-400">Reply</span></div>
        <div class="rounded-md bg-white/5 p-3"><strong class="block text-lg">100%</strong><span class="text-xs text-slate-400">Focus</span></div>
      </div>
    </div>
  </div>
</section>`;
}

function downloadFile(content, filename) {
  const blob = new Blob([content], { type: 'text/html' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href     = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

async function copyToClipboard(text, label) {
  try {
    await navigator.clipboard.writeText(text);
    showToast(`${label} copied to clipboard ✓`);
  } catch (_) {
    // Fallback
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    document.execCommand('copy');
    document.body.removeChild(ta);
    showToast(`${label} copied ✓`);
  }
}

// ── Main Actions ──────────────────────────────────────────────────────────────

function generate(isLegit = false) {
  const raw = getFormData();
  state.isLegit = isLegit;
  state.lastRaw = raw;

  const heroHtml = renderHero(raw, isLegit);
  state.html = heroHtml;
  state.css  = extractHeroCss();

  injectPreview(heroHtml);
  updateBrowserUrl(raw.name);
  updateQualityPanel(raw);
  markPreset('');

  const serviceNudge = document.getElementById('service-nudge');
  if (serviceNudge) serviceNudge.hidden = false;
}

function shuffleStyle() {
  const raw = getFormData();

  // Randomize style fields but keep content fields
  const colors    = ['dark-neon','clean-light','warm-local','premium-mono','cyber-cyan','sunset-punch'];
  const tones     = ['clean','bold','premium','local','edgy','playful','minimal'];
  const templates = ['split','centered','local','product','creative'];

  document.getElementById('field-color').value    = pick(colors);
  document.getElementById('field-tone').value     = pick(tones);
  document.getElementById('field-template').value = pick(templates);

  generate(state.isLegit);
}

// ── Mobile Preview Toggle ─────────────────────────────────────────────────────

function initPreviewToggles() {
  const toggles = document.querySelectorAll('.preview-toggle');
  const wrap    = document.getElementById('preview-wrap');

  toggles.forEach(btn => {
    btn.addEventListener('click', () => {
      const view = btn.dataset.view;
      if (view === state.viewMode) return; // nothing to do

      toggles.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      state.viewMode = view;

      if (view === 'mobile') {
        wrap.classList.add('mobile-view');
      } else {
        wrap.classList.remove('mobile-view');
      }

      // Re-inject with the correct renderer for the new view mode
      if (state.html) injectPreview(state.html);
    });
  });
}

// ── Default / Empty State ─────────────────────────────────────────────────────

function loadDefaultPreview() {
  applyFormData(PRESETS.restaurant);
  markPreset('restaurant');

  generate();
  markPreset('restaurant');
}

// ── Footer Year ───────────────────────────────────────────────────────────────

function initFooterYear() {
  const el = document.getElementById('footer-year');
  if (el) el.textContent = new Date().getFullYear();
}

// ── Event Wiring ──────────────────────────────────────────────────────────────

function initEvents() {
  document.getElementById('btn-generate').addEventListener('click', () => generate(false));
  document.getElementById('btn-shuffle').addEventListener('click', shuffleStyle);
  document.getElementById('btn-legit').addEventListener('click', () => generate(true));

  document.querySelectorAll('.preset-chip').forEach(btn => {
    btn.addEventListener('click', () => {
      const preset = PRESETS[btn.dataset.preset];
      if (!preset) return;
      applyFormData(preset);
      generate(false);
      markPreset(btn.dataset.preset);
    });
  });

  document.getElementById('btn-copy-html').addEventListener('click', () => {
    if (!state.html) { showToast('Generate a hero first.'); return; }
    copyToClipboard(state.html, 'HTML');
  });

  document.getElementById('btn-copy-css').addEventListener('click', () => {
    const css = extractHeroCss();
    if (!css) { showToast('Generate a hero first.'); return; }
    copyToClipboard(css, 'CSS');
  });

  document.getElementById('btn-copy-all').addEventListener('click', () => {
    if (!state.html) { showToast('Generate a hero first.'); return; }
    const raw = getFormData();
    copyToClipboard(buildStandaloneHtml(state.html, raw.name), 'Standalone HTML');
  });

  document.getElementById('btn-copy-react').addEventListener('click', () => {
    if (!state.html) { showToast('Generate a hero first.'); return; }
    copyToClipboard(buildReactComponent(state.html), 'React component');
  });

  document.getElementById('btn-copy-tailwind').addEventListener('click', () => {
    if (!state.lastRaw) { showToast('Generate a hero first.'); return; }
    copyToClipboard(buildTailwindHero(state.lastRaw), 'Tailwind starter');
  });

  document.getElementById('btn-download').addEventListener('click', () => {
    if (!state.html) { showToast('Generate a hero first.'); return; }
    const raw  = getFormData();
    const name = raw.name || 'hero';
    const slug = toSlug(name);
    const full = buildStandaloneHtml(state.html, name);
    downloadFile(full, `${slug}-hero.html`);
    showToast(`Downloaded ${slug}-hero.html ✓`);
  });

  document.getElementById('btn-save-hero').addEventListener('click', saveCurrentHero);
  document.getElementById('btn-share-link').addEventListener('click', copyShareLink);

  document.getElementById('saved-heroes').addEventListener('click', (e) => {
    const button = e.target.closest('button[data-action]');
    if (!button) return;
    const item = button.closest('.saved-hero-item');
    const items = getSavedHeroes();
    const saved = items.find(entry => entry.id === item.dataset.id);
    if (!saved) return;

    if (button.dataset.action === 'load') {
      applyFormData(saved.data);
      generate(false);
      showToast('Saved hero loaded ✓');
    }

    if (button.dataset.action === 'delete') {
      setSavedHeroes(items.filter(entry => entry.id !== saved.id));
      renderSavedHeroes();
      showToast('Saved hero deleted');
    }
  });

  // Allow Enter key in form fields to trigger generate
  const inputs = document.querySelectorAll('#generator input[type="text"]');
  inputs.forEach(input => {
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') generate(false);
    });
  });

  // Smooth scroll for "Build My Hero" hero CTA
  const heroCtaLink = document.querySelector('.tool-hero-cta-group a.btn-primary');
  if (heroCtaLink) {
    heroCtaLink.addEventListener('click', (e) => {
      e.preventDefault();
      document.getElementById('generator').scrollIntoView({ behavior: 'smooth' });
    });
  }
}

// ── Init ──────────────────────────────────────────────────────────────────────

document.addEventListener('DOMContentLoaded', () => {
  initFooterYear();
  initPreviewToggles();
  initEvents();
  renderSavedHeroes();

  // Fetch style.css once and cache raw text for mobile iframe srcdoc.
  // Works on file://, http://, and https:// — no CORS issues since it's
  // a relative fetch on the same origin as the page itself.
  fetch('style.css')
    .then(r => r.text())
    .then(css => { state.rawCss = css; })
    .catch(() => { /* rawCss stays '', iframe falls back gracefully */ })
    .finally(() => {
      // Always load a preview, with or without cached CSS
      if (!loadSharedHero()) loadDefaultPreview();
    });
});

/* <!-- * lone wolf, own sky | Matt Livingston --> */
