/* ============================================================
   DIGITAL RELICS // ARCHIVE
   script.js - ManicWebmaster
   ============================================================ */

(function () {
  'use strict';

  const relics = {
    '01': {
      id: 'RELIC_01',
      title: 'THE SCANNER',
      image: 'assets/relic-01-the-scanner.webp',
      alt: 'The Scanner - SCN-27M logistics unit with active red laser and cyan edge lighting',
      desc: 'A handheld scanner transformed into technological mythology: logistics, verification, signal, and control reduced to a single floating artifact.',
      meta: {
        class: 'Field Unit',
        signal: 'Verified',
        condition: 'Worn',
        lighting: 'Cyan / Red',
        note: 'Recovered from inactive fulfillment corridor'
      }
    },
    '02': {
      id: 'RELIC_02',
      title: 'THE COMPASS',
      image: 'assets/relic-02-the-compass.webp',
      alt: 'The Compass - VCTR-02 tactical navigation instrument with cyan backlit dial',
      desc: 'Navigation hardware from an autonomous field unit. Direction persists even when origin data is missing.',
      meta: {
        class: 'Navigation Instrument',
        signal: 'Vector Locked',
        condition: 'Operational',
        lighting: 'Cyan',
        note: 'Aligned to unknown field coordinates'
      }
    },
    '03': {
      id: 'RELIC_03',
      title: 'THE BLACK BOX',
      image: 'assets/relic-03-the-black-box.webp',
      alt: 'The Black Box - sealed intelligence core with cyan indicator light',
      desc: 'Sealed intelligence core. Activity persists, but all external interfaces return incomplete origin data.',
      meta: {
        class: 'Intelligence Core',
        signal: 'System Dormant',
        condition: 'Sealed',
        lighting: 'Cyan',
        note: 'Intermittent pulse repeats every 47 minutes'
      }
    },
    '04': {
      id: 'RELIC_04',
      title: 'THE CASSETTE',
      image: 'assets/relic-04-the-cassette.webp',
      alt: 'The Cassette - analog tape cartridge with illuminated cyan reels',
      desc: 'Analog memory preserved inside future hardware. The oldest storage format in the archive still reads.',
      meta: {
        class: 'Memory Carrier',
        signal: 'Memory Intact',
        condition: 'Readable',
        lighting: 'Cyan',
        note: 'Estimated 60 minutes of magnetic residue'
      }
    },
    '05': {
      id: 'RELIC_05',
      title: 'THE LIGHTER',
      image: 'assets/relic-05-the-lighter.webp',
      alt: 'The Lighter - ignition control unit with violet-blue open flame',
      desc: 'Controlled ignition device with violet-blue flame. A field tool from a culture that still trusted fire.',
      meta: {
        class: 'Field Tool',
        signal: 'Manual Override',
        condition: 'Unknown',
        lighting: 'Violet / Blue',
        note: 'Origin unconfirmed'
      }
    },
    '06': {
      id: 'RELIC_06',
      title: 'THE KEYCARD',
      image: 'assets/relic-06-the-keycard.webp',
      alt: 'The Keycard - clearance level 7A secure access token',
      desc: 'Access token recovered with clearance data intact. The door it opened has not been located.',
      meta: {
        class: 'Access Token',
        signal: 'Clearance Level 7A',
        condition: 'Scratched',
        lighting: 'Cyan',
        note: 'Authorization chain partially preserved'
      }
    },
    '07': {
      id: 'RELIC_07',
      title: 'THE NODE',
      image: 'assets/relic-07-the-node.webp',
      alt: 'The Node - spherical distributed signal relay with active cyan ports',
      desc: 'Distributed signal relay. Network activity remains nominal despite no confirmed parent system.',
      meta: {
        class: 'Comms Array',
        signal: 'Link Active',
        condition: 'Stable',
        lighting: 'Cyan',
        note: 'Ports respond to proximity only'
      }
    },
    '08': {
      id: 'RELIC_08',
      title: 'THE DRIVE',
      image: 'assets/relic-08-the-drive.webp',
      alt: 'The Drive - portable data cache with alloy ceramic composite enclosure',
      desc: 'Portable data cache. Unknown origin. Never accessed. Opening may trigger failsafe protocol.',
      meta: {
        class: 'Data Cache',
        signal: 'Files Sealed',
        condition: 'Locked',
        lighting: 'Cyan',
        note: 'Last accessed: never'
      }
    },
    '09': {
      id: 'RELIC_09',
      title: 'THE MEMORY MODULE',
      image: 'assets/relic-09-the-memory-module.webp',
      alt: 'The Memory Module - preserved read-only memory container with verified files',
      desc: 'Preserved memory container. Read-only. Contents verified, but the indexing language is incomplete.',
      meta: {
        class: 'Memory Module',
        signal: 'Data Integrity Verified',
        condition: 'Read-only',
        lighting: 'Cyan',
        note: '3,847 files indexed'
      }
    },
    '10': {
      id: 'RELIC_10',
      title: 'THE LIGHT',
      image: 'assets/relic-10-the-light.webp',
      alt: 'The Light - sealed field lamp with cyan internal illumination',
      desc: 'Sealed field lamp. Low power. High reliability. Maintenance free. Still operational without a verified source.',
      meta: {
        class: 'Field Lamp',
        signal: 'Power Nominal',
        condition: 'Stable',
        lighting: 'Cyan / White',
        note: 'Do not open'
      }
    },
    '11': {
      id: 'RELIC_11',
      title: 'THE TOKEN',
      image: 'assets/relic-11-the-token.webp',
      alt: 'The Token - authentication and access disc with cyan encrypted markings',
      desc: 'Authentication and access token. One token. One entry. The receiving system is still listening.',
      meta: {
        class: 'Authentication Disc',
        signal: 'Verified',
        condition: 'Encrypted',
        lighting: 'Cyan',
        note: 'Access verify authorize'
      }
    },
    '12': {
      id: 'RELIC_12',
      title: 'THE WATCH',
      image: 'assets/relic-12-the-watch.webp',
      alt: 'The Watch - titanium AMOLED timepiece displaying UTC time',
      desc: 'Timepiece. Synchronized. Built for endurance. Trusted by the few who still measured drift.',
      meta: {
        class: 'Timekeeping Device',
        signal: 'Sync Locked',
        condition: 'Operational',
        lighting: 'Cyan',
        note: 'Quartz and atomic movement'
      }
    },
    '13': {
      id: 'RELIC_13',
      title: 'THE PHOTOGRAPH',
      image: 'assets/relic-13-the-photograph.webp',
      alt: 'The Photograph - sealed archival sleeve containing an unidentified location printed on an unknown substrate',
      desc: 'A physical photograph in a sealed archival sleeve. The image depicts a location, not a person. The location has not been identified, and the date on the back is in the future.',
      meta: {
        class: 'Record',
        signal: 'Location Unverified',
        condition: 'Excellent',
        substrate: 'Unidentified',
        note: 'No matches found in global architectural or satellite databases'
      }
    },
    '14': {
      id: 'RELIC_14',
      title: 'THE CASE',
      image: 'assets/relic-14-the-case.webp',
      alt: 'The Case - rigid foam-lined carrying case with eleven archived objects and one empty recess',
      desc: 'A rigid military-grade carrying case with twelve precisely cut recesses. Eleven contain objects already in the archive. One recess is empty.',
      meta: {
        class: 'Container',
        signal: 'Set Incomplete',
        condition: 'Recovered',
        material: 'Polymer Composite',
        note: 'No cutting tools or methods known to achieve this result have been identified'
      }
    },
    '15': {
      id: 'RELIC_15',
      title: 'THE SIGNAL',
      image: 'assets/relic-15-the-signal.webp',
      alt: 'The Signal - captured waveform and interval analysis from a repeating transmission of unknown origin',
      desc: 'Not a physical object. A repeating transmission of unknown origin, captured on isolated media and cataloged as a relic because it behaves like one.',
      meta: {
        class: 'Unknown',
        signal: 'Transmission Active',
        condition: 'Non-periodic',
        storage: 'Isolated Media',
        note: 'Transmission frequency appears responsive to archive population count'
      }
    }
  };

  const formatLabel = (key) => key.replace(/^\w/, (char) => char.toUpperCase());

  // Archive Log: staggered reveal on scroll
  const logEntries = document.querySelectorAll('.log-entry');

  if (logEntries.length && 'IntersectionObserver' in window) {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const el = entry.target;
            const idx = Array.from(logEntries).indexOf(el);

            setTimeout(() => {
              el.classList.add('visible');
            }, idx * 180);

            observer.unobserve(el);
          }
        });
      },
      { threshold: 0.15, rootMargin: '0px 0px -40px 0px' }
    );

    logEntries.forEach((entry) => observer.observe(entry));
  } else {
    // Fallback: just show them all
    logEntries.forEach((el) => el.classList.add('visible'));
  }

  // Hero meta coords: subtle timestamp update
  const coords = document.querySelector('.hero-coords');
  if (coords) {
    // Append live UTC timestamp to the coords row
    const tsSpan = document.createElement('span');
    const updateTs = () => {
      const now = new Date();
      const h = String(now.getUTCHours()).padStart(2, '0');
      const m = String(now.getUTCMinutes()).padStart(2, '0');
      const s = String(now.getUTCSeconds()).padStart(2, '0');
      tsSpan.textContent = `UTC ${h}:${m}:${s}`;
    };
    updateTs();
    setInterval(updateTs, 1000);
    coords.appendChild(tsSpan);
  }

  // Relic entry modal
  const modal = document.getElementById('relicModal');
  const modalImage = document.getElementById('modalImage');
  const modalId = document.getElementById('modalId');
  const modalTitle = document.getElementById('modalTitle');
  const modalDesc = document.getElementById('modalDesc');
  const modalMeta = document.getElementById('modalMeta');
  const closeButton = document.querySelector('[data-modal-close]');
  let lastTrigger = null;

  const closeModal = () => {
    if (!modal) return;

    if (typeof modal.close === 'function') {
      modal.close();
    } else {
      modal.removeAttribute('open');
    }

    document.body.classList.remove('modal-open');
    if (lastTrigger) lastTrigger.focus();
  };

  const openRelic = (relicKey, trigger) => {
    if (!modal || !modalImage || !modalId || !modalTitle || !modalDesc || !modalMeta) return;

    const relic = relics[relicKey];
    if (!relic) return;

    lastTrigger = trigger;
    modalImage.src = relic.image;
    modalImage.alt = relic.alt;
    modalId.textContent = relic.id;
    modalTitle.textContent = relic.title;
    modalDesc.textContent = relic.desc;
    modalMeta.replaceChildren();

    Object.entries(relic.meta).forEach(([key, value]) => {
      const row = document.createElement('div');
      const dt = document.createElement('dt');
      const dd = document.createElement('dd');

      row.className = 'relic-modal__meta-row';
      dt.textContent = formatLabel(key);
      dd.textContent = value;
      row.append(dt, dd);
      modalMeta.append(row);
    });

    if (typeof modal.showModal === 'function') {
      modal.showModal();
    } else {
      modal.setAttribute('open', '');
    }

    document.body.classList.add('modal-open');
    if (closeButton) closeButton.focus();
  };

  document.querySelectorAll('.relic-entry-trigger').forEach((trigger) => {
    trigger.addEventListener('click', () => {
      openRelic(trigger.dataset.relic, trigger);
    });
  });

  if (closeButton) {
    closeButton.addEventListener('click', closeModal);
  }

  if (modal) {
    modal.addEventListener('click', (event) => {
      if (event.target === modal) closeModal();
    });

    modal.addEventListener('close', () => {
      document.body.classList.remove('modal-open');
      if (lastTrigger) lastTrigger.focus();
    });
  }

})();
