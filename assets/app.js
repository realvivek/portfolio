/* ==========================================================================
   REV C — Portfolio behavior
   Sections: config → project cards render → 3D-hero fallback watchdog →
   reveal-on-scroll (with failsafe). No dependencies; the page must stay
   fully readable if this file never runs. The 3D hero itself lives in
   assets/city3d.js and is a strictly optional enhancement.
   ========================================================================== */

'use strict';

document.documentElement.classList.add('js');

/* ---------- Config ---------- */

var CONFIG = {
  // Set to the real profile URL. The button stays hidden until this is
  // non-null so the live site never ships a dead anchor.
  linkedin: null
};

/* ---------- Projects ----------
   To add a project: append an object here. Nothing else to touch. */

var PROJECTS = [
  {
    index: '/ 01 /',
    name: 'spectral nexus',
    desc: 'An interactive atlas of America’s broadband story — coverage gaps, ' +
          'BEAD funding flows, CBRS spectrum zones and RDOF defaults across all ' +
          '3,143 US counties. Every county is scored for opportunity, so the map ' +
          'answers one question: where should the next network get built?',
    tags: 'BEAD · CBRS · GIS · FUNDING',
    url: 'https://spectral-nexus.onrender.com',
    source: 'https://github.com/realvivek/spectral-nexus'
  },
  {
    index: '/ 02 /',
    name: 'tx highway',
    desc: 'Live Bitcoin and Ethereum traffic — every vehicle is a real mempool ' +
          'transaction streamed over public WebSockets, sized by USD value. ' +
          'Rewind replays the actual blocks from any past moment.',
    tags: 'BITCOIN · ETHEREUM · WEBSOCKETS · CANVAS',
    url: 'https://txhighway.onrender.com',
    source: 'https://github.com/realvivek/txhighway'
  }
];

/* ---------- Render ranked project cards ---------- */

(function renderSystems() {
  var wrap = document.getElementById('systems-rank');
  if (!wrap) return;

  var html = PROJECTS.map(function (p) {
    return (
      '<article class="rank-card rank-featured">' +
        '<span class="rank-index">' + p.index + '</span>' +
        '<h3 class="rank-name">' + p.name + '</h3>' +
        '<p class="rank-desc">' + p.desc + '</p>' +
        '<p class="rank-tags">' + p.tags + '</p>' +
        '<nav class="rank-links">' +
          '<a class="pill" href="' + p.url + '" target="_blank" rel="noopener">→&nbsp; LAUNCH</a>' +
          (p.source ? '<a class="pill" href="' + p.source + '" target="_blank" rel="noopener">SOURCE</a>' : '') +
        '</nav>' +
      '</article>'
    );
  }).join('');

  // One dashed ghost slot so the row reads as a work-in-progress ranking.
  var n = PROJECTS.length + 1;
  html += (
    '<div class="rank-card rank-ghost" aria-hidden="true">' +
      '<span class="rank-index">/ 0' + n + ' /</span>' +
      '<span class="rank-ghost-label">IN FABRICATION</span>' +
    '</div>'
  );

  wrap.innerHTML = html;
})();

/* ---------- Interfaces ---------- */

(function wireInterfaces() {
  var link = document.getElementById('linkedin-link');
  var pending = document.getElementById('linkedin-pending');
  if (!link) return;
  if (CONFIG.linkedin) {
    link.href = CONFIG.linkedin;
  } else {
    link.hidden = true;
    if (pending) pending.hidden = false;
  }
})();

/* ---------- Colophon date ---------- */

(function stampDate() {
  var el = document.getElementById('colophon-date');
  if (!el) return;
  var d = new Date();
  el.textContent = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0');
})();

/* ---------- 3D-hero fallback watchdog ----------
   city3d.js marks <html> with `has3d` once its scene is up. If that never
   happens (CDN blocked, WebGL unavailable, script error), switch the hero
   to its static fallback so nothing looks broken. city3d.js removes `no3d`
   if it manages to start late. */

setTimeout(function () {
  if (!document.documentElement.classList.contains('has3d')) {
    document.documentElement.classList.add('no3d');
  }
}, 4000);

/* ---------- Reveal on scroll ---------- */

(function reveal() {
  var els = document.querySelectorAll('.reveal');
  if (!('IntersectionObserver' in window)) {
    els.forEach(function (el) { el.classList.add('in'); });
    return;
  }
  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      if (e.isIntersecting) {
        e.target.classList.add('in');
        io.unobserve(e.target);
      }
    });
  }, { threshold: 0.1 });
  els.forEach(function (el) { io.observe(el); });

  // Failsafe: never leave content hidden if the observer misbehaves.
  setTimeout(function () {
    els.forEach(function (el) { el.classList.add('in'); });
  }, 3000);
})();
