/**
 * THE VEYRA SCHOLARIUM — script.js
 * Scroll reveal, archive log staggered entry, signal fluctuation
 * lone wolf, quiet teeth | Matt Livingston
 */

(function () {
  'use strict';

  /* ─── SCROLL REVEAL ─────────────────────────────────────────
     Uses IntersectionObserver to add .is-visible to reveal targets.
     Groups within the same parent section get staggered delays
     via data-reveal-index attributes.
  ─────────────────────────────────────────────────────────────── */

  const REVEAL_SELECTORS = [
    '.faction-card',
    '.artifact-card',
    '.map-fragment__media',
    '.map-fragment__copy',
    '.timeline__entry',
    '.quiet__document',
    '.quiet__sidebar',
    '.creator-note__panel',
    '.log__entry',
  ];

  function initReveal() {
    const allTargets = document.querySelectorAll(REVEAL_SELECTORS.join(', '));

    if (!allTargets.length) return;

    // Assign stagger indices within each parent container
    // so sibling cards animate in sequence
    const groups = new Map();
    allTargets.forEach(el => {
      const parent = el.parentElement;
      if (!groups.has(parent)) groups.set(parent, []);
      groups.get(parent).push(el);
    });

    groups.forEach(siblings => {
      siblings.forEach((el, i) => {
        el.dataset.revealIndex = i + 1;
      });
    });

    // Log entries have their own data-delay from HTML for finer control
    document.querySelectorAll('.log__entry').forEach(el => {
      const delay = el.dataset.delay || 0;
      el.style.transitionDelay = `${parseInt(delay)}ms`;
    });

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            observer.unobserve(entry.target);
          }
        });
      },
      {
        threshold: 0.08,
        rootMargin: '0px 0px -40px 0px',
      }
    );

    allTargets.forEach(el => observer.observe(el));
  }


  /* ─── ARCHIVE LOG TERMINAL REVEAL ──────────────────────────
     Log entries get an additional staggered entrance tied
     to the terminal container entering the viewport.
     Each entry delays progressively once the terminal is visible.
  ─────────────────────────────────────────────────────────────── */

  function initLogTerminal() {
    const terminal = document.querySelector('.log__terminal');
    if (!terminal) return;

    const entries = terminal.querySelectorAll('.log__entry');

    const terminalObserver = new IntersectionObserver(
      (entries_obs) => {
        if (entries_obs[0].isIntersecting) {
          entries.forEach((entry, i) => {
            setTimeout(() => {
              entry.classList.add('is-visible');
            }, 120 + i * 180);
          });
          terminalObserver.disconnect();
        }
      },
      { threshold: 0.15 }
    );

    terminalObserver.observe(terminal);
  }


  /* ─── SIGNAL STRENGTH FLUCTUATION ──────────────────────────
     The "Signal: Unstable" value in the hero metadata strip
     cycles through states to suggest an unreliable archive feed.
  ─────────────────────────────────────────────────────────────── */

  const SIGNAL_STATES = [
    { text: 'Unstable',       cls: 'status-warn'    },
    { text: 'Degraded',       cls: 'status-warn'    },
    { text: 'Partial',        cls: 'status-caution' },
    { text: 'Recovering...',  cls: 'status-caution' },
    { text: 'Lost',           cls: 'status-danger'  },
    { text: 'Unstable',       cls: 'status-warn'    },
    { text: 'Fluctuating',    cls: 'status-warn'    },
  ];

  function initSignalFluctuation() {
    const el = document.getElementById('signal-strength');
    if (!el) return;

    let index = 0;

    function cycleSignal() {
      // Fade out
      el.style.opacity = '0';
      el.style.transition = 'opacity 0.4s ease';

      setTimeout(() => {
        index = (index + 1) % SIGNAL_STATES.length;
        const state = SIGNAL_STATES[index];

        // Remove all possible status classes then apply new one
        el.className = '';
        el.classList.add(state.cls);
        el.textContent = state.text;

        // Fade in
        el.style.opacity = '1';
      }, 400);
    }

    // Start cycling after a short delay, then every 3.5s
    setTimeout(() => {
      cycleSignal();
      setInterval(cycleSignal, 3500);
    }, 2800);
  }


  /* ─── TIMELINE SEQUENCE REVEAL ─────────────────────────────
     Timeline entries reveal top-to-bottom sequentially
     once the timeline section enters view, to reinforce
     the feeling of records being recovered in order.
  ─────────────────────────────────────────────────────────────── */

  function initTimelineReveal() {
    const track = document.querySelector('.timeline__track');
    if (!track) return;

    const entries = track.querySelectorAll('.timeline__entry');

    // Reset any stagger indices from the generic reveal
    entries.forEach((el, i) => {
      el.dataset.revealIndex = undefined;
    });

    const timelineObserver = new IntersectionObserver(
      (obs_entries) => {
        if (obs_entries[0].isIntersecting) {
          entries.forEach((el, i) => {
            // Timeline silence entry gets a longer delay to land with weight
            const baseDelay = i < entries.length - 1
              ? 80 + i * 90
              : 80 + (i * 90) + 400;

            setTimeout(() => {
              el.classList.add('is-visible');
            }, baseDelay);
          });
          timelineObserver.disconnect();
        }
      },
      { threshold: 0.06 }
    );

    timelineObserver.observe(track);
  }


  /* ─── SUBTLE HERO PARALLAX ──────────────────────────────────
     Very gentle parallax on hero background — reinforces the
     sense of a physical document being examined. Disabled on
     mobile and for users preferring reduced motion.
  ─────────────────────────────────────────────────────────────── */

  function initHeroParallax() {
    const heroBg = document.querySelector('.hero__bg img');
    if (!heroBg) return;

    // Bail on mobile or reduced motion
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const isMobile = window.innerWidth < 768;
    if (prefersReduced || isMobile) return;

    let ticking = false;

    window.addEventListener('scroll', () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          const scrollY = window.scrollY;
          const heroHeight = document.querySelector('.hero').offsetHeight;

          if (scrollY <= heroHeight) {
            const offset = scrollY * 0.25;
            heroBg.style.transform = `translateY(${offset}px)`;
          }
          ticking = false;
        });
        ticking = true;
      }
    }, { passive: true });
  }


  /* ─── FACTION CARD GLYPH FLICKER ────────────────────────────
     The Choir of Glass card gets a subtle glow flicker on hover
     to evoke the spectral teal light in the reference image.
  ─────────────────────────────────────────────────────────────── */

  function initChoirGlowEffect() {
    const choirCard = document.querySelector('.faction-card--choir');
    if (!choirCard) return;

    let flickerTimer = null;

    choirCard.addEventListener('mouseenter', () => {
      const img = choirCard.querySelector('.faction-card__image');
      if (!img) return;

      let step = 0;
      const flickerPattern = [0.9, 0.85, 0.95, 0.88, 0.92, 0.90];

      flickerTimer = setInterval(() => {
        const brightness = flickerPattern[step % flickerPattern.length];
        img.style.filter = `brightness(${brightness}) saturate(0.85) hue-rotate(-5deg)`;
        step++;
      }, 120);
    });

    choirCard.addEventListener('mouseleave', () => {
      clearInterval(flickerTimer);
      const img = choirCard.querySelector('.faction-card__image');
      if (img) {
        img.style.filter = '';
      }
    });
  }


  /* ─── ARTIFACT CARD CATALOG ID TYPING EFFECT ───────────────
     On artifact card hover, the catalog ID "types in" briefly
     to suggest a live archive lookup — very subtle.
  ─────────────────────────────────────────────────────────────── */

  function initArtifactCatalogEffect() {
    const cards = document.querySelectorAll('.artifact-card');

    cards.forEach(card => {
      const idEl = card.querySelector('.artifact-card__catalog-id');
      if (!idEl) return;

      const originalText = idEl.textContent.trim();
      let animating = false;

      card.addEventListener('mouseenter', () => {
        if (animating) return;
        animating = true;

        let displayed = '';
        idEl.textContent = '';
        let i = 0;

        const typeInterval = setInterval(() => {
          if (i < originalText.length) {
            displayed += originalText[i];
            idEl.textContent = displayed;
            i++;
          } else {
            clearInterval(typeInterval);
            animating = false;
          }
        }, 28);
      });
    });
  }


  /* ─── DOCUMENT READY ─────────────────────────────────────── */
  function init() {
    initReveal();
    initLogTerminal();
    initSignalFluctuation();
    initTimelineReveal();
    initHeroParallax();
    initChoirGlowEffect();
    initArtifactCatalogEffect();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
