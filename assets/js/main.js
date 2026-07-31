/* ==========================================================================
   ManicWebmaster — progressive enhancement only.
   Nothing here is required to read the page, use the nav, open the FAQ,
   or contact Matt. Every block degrades to working static HTML.
   ========================================================================== */
(function () {
  'use strict';

  // Signals to CSS that JS is available, so reveal animations can start hidden.
  document.documentElement.classList.add('js');

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* --- Sticky header state ---------------------------------------------- */
  var header = document.getElementById('site-header');
  if (header) {
    var ticking = false;
    var onScroll = function () {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(function () {
        header.classList.toggle('is-scrolled', window.scrollY > 8);
        ticking = false;
      });
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  /* --- Mobile navigation ------------------------------------------------- */
  var toggle = document.getElementById('nav-toggle');
  var panel = document.getElementById('nav-panel');

  if (toggle && panel) {
    var isOpen = function () { return toggle.getAttribute('aria-expanded') === 'true'; };

    var setOpen = function (open) {
      toggle.setAttribute('aria-expanded', String(open));
      panel.hidden = !open;
      document.body.style.overflow = open ? 'hidden' : '';
      if (open) {
        var first = panel.querySelector('a');
        if (first) first.focus();
      }
    };

    toggle.addEventListener('click', function () { setOpen(!isOpen()); });

    // Close on selection, on Escape, and when the desktop nav takes over.
    panel.addEventListener('click', function (e) {
      if (e.target.closest('a')) setOpen(false);
    });

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && isOpen()) {
        setOpen(false);
        toggle.focus();
      }
    });

    // Focus trap: cycle between the toggle and the panel's focusable children.
    document.addEventListener('keydown', function (e) {
      if (e.key !== 'Tab' || !isOpen()) return;
      var items = [toggle].concat(
        Array.prototype.slice.call(panel.querySelectorAll('a, button'))
      );
      var firstItem = items[0];
      var lastItem = items[items.length - 1];
      if (e.shiftKey && document.activeElement === firstItem) {
        e.preventDefault();
        lastItem.focus();
      } else if (!e.shiftKey && document.activeElement === lastItem) {
        e.preventDefault();
        firstItem.focus();
      }
    });

    var desktop = window.matchMedia('(min-width: 56.25rem)');
    var syncDesktop = function () { if (desktop.matches && isOpen()) setOpen(false); };
    desktop.addEventListener('change', syncDesktop);
  }

  /* --- Before / after comparison ----------------------------------------
     The range input is the source of truth; JS only mirrors its value into a
     CSS custom property. With JS off the stage renders a fixed 50/50 split. */
  var range = document.getElementById('compare-range');
  var stage = document.getElementById('compare-stage');

  if (range && stage) {
    var figure = stage.closest('.compare');

    var apply = function () {
      figure.style.setProperty('--pos', range.value + '%');
      range.setAttribute('aria-valuetext', 'Redesigned version revealed ' + range.value + '%');
    };

    range.addEventListener('input', apply);
    apply();
  }

  /* --- Scroll reveal ------------------------------------------------------
     Content starts hidden only because .js was set above, so any failure here
     must fall back to showing everything rather than hiding the page. */
  var revealables = document.querySelectorAll('.reveal');

  var revealAll = function () {
    Array.prototype.forEach.call(revealables, function (el) {
      el.classList.add('is-visible');
    });
  };

  if (reduceMotion || !('IntersectionObserver' in window)) {
    revealAll();
  } else {
    try {
      var observer = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        });
      }, { rootMargin: '0px 0px -8% 0px', threshold: 0.05 });

      Array.prototype.forEach.call(revealables, function (el, i) {
        // Small stagger within a group, capped so nothing feels slow.
        el.style.transitionDelay = (i % 4) * 60 + 'ms';
        observer.observe(el);
      });
    } catch (err) {
      revealAll();
    }
  }

  /* --- Footer year -------------------------------------------------------- */
  var year = document.getElementById('year');
  if (year) year.textContent = String(new Date().getFullYear());
})();
