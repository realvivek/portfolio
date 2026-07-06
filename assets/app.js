/* ==========================================================================
   VY-PF-001 REV B — Portfolio behavior
   Sections: config → project cards render → constellation arcs → count-up
   stats → reveal-on-scroll (with failsafe). No dependencies; the page must
   stay fully readable if this file never runs.
   ========================================================================== */

'use strict';

document.documentElement.classList.add('js');

var REDUCED = window.matchMedia &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

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
    desc: 'Broadband funding intelligence console — coverage gaps, BEAD allocations, ' +
          'CBRS zones and RDOF defaults across 3,143 US counties.',
    tags: 'BEAD · CBRS · GIS · FUNDING',
    url: 'https://realvivek.github.io/spectral-nexus/',
    source: 'https://github.com/realvivek/spectral-nexus'
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

  // Two dashed ghost slots so the ranking silhouette reads like a chart.
  for (var g = 0; g < 2; g++) {
    var n = PROJECTS.length + g + 1;
    html += (
      '<div class="rank-card rank-ghost" aria-hidden="true">' +
        '<span class="rank-index">/ 0' + n + ' /</span>' +
        '<span class="rank-ghost-label">IN FABRICATION</span>' +
      '</div>'
    );
  }

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

/* ---------- Constellation arcs ----------
   Dashed quadratic curves from the root node to each domain node, endpoints
   measured from the real chip positions so they stay attached on resize. */

(function constellation() {
  var box = document.getElementById('constellation');
  var svg = document.getElementById('arcs');
  if (!box || !svg) return;

  var nodes = box.querySelectorAll('[data-node]');
  if (nodes.length < 2) return;
  var root = box.querySelector('.node-root') || nodes[0];

  function center(el) {
    var b = box.getBoundingClientRect();
    var r = el.getBoundingClientRect();
    return { x: r.left + r.width / 2 - b.left, y: r.top + r.height / 2 - b.top };
  }

  function draw() {
    var b = box.getBoundingClientRect();
    svg.setAttribute('viewBox', '0 0 ' + b.width + ' ' + b.height);
    var rc = center(root);
    var d = '';
    nodes.forEach(function (n) {
      if (n === root) return;
      var c = center(n);
      // control point: midpoint pushed outward for a gentle orbit-like bow
      var mx = (rc.x + c.x) / 2 + (c.x - rc.x) * 0.12;
      var my = (rc.y + c.y) / 2 + Math.abs(c.x - rc.x) * 0.22;
      d += 'M' + rc.x + ',' + rc.y + ' Q' + mx + ',' + my + ' ' + c.x + ',' + c.y + ' ';
    });
    svg.innerHTML = '<path d="' + d.trim() + '"/>';
  }

  draw();
  window.addEventListener('resize', draw);
  // fonts shift chip sizes after load; redraw once settled
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(draw);
  setTimeout(draw, 1200);
})();

/* ---------- Chapter 02: interactive city ----------
   Architecture is real but white-labeled (radios on shared CBRS spectrum,
   an on-prem edge core, a cloud orchestrator with eSIM identity and
   per-app QoS slicing). Use cases span today's (edge vision cameras,
   adaptive intersections) through emerging (drone-as-first-responder,
   digital-twin capture, sidewalk robot teleoperation). */

var CITY = {
  macro: {
    cat: 'RADIO ACCESS',
    name: 'rooftop macro radio',
    desc: 'A carrier-grade outdoor radio on shared CBRS spectrum (3550–3700 MHz, ' +
          'band n48), authorized by a spectrum access system. One unit lights up ' +
          'the whole block — this is the cell tower, shrunk to a shoebox the city owns.',
    path: 'CBRS n48 → EDGE CORE → CITY OPS'
  },
  pole: {
    cat: 'RADIO ACCESS',
    name: 'street-level radio',
    desc: 'A compact radio on a smart pole fills the street canyon the rooftop ' +
          'can’t reach, and serves everything below it — cameras, sensors, robots, ' +
          'kiosks — on the same private network.',
    path: 'SMART POLE → FIBER → EDGE CORE'
  },
  edge: {
    cat: 'COMPUTE',
    name: 'edge core',
    desc: 'The network’s brain, in a basement rack: a converged packet core plus ' +
          'GPU inference, on-premises. Traffic never leaves the block, round trips ' +
          'stay in single-digit milliseconds, and the vision AI runs next to the data.',
    path: 'RADIOS → EDGE CORE (UPF + AI) → ONLY EVENTS LEAVE'
  },
  cloud: {
    cat: 'OPERATIONS',
    name: 'cloud orchestrator',
    desc: 'The one piece that lives off-block: zero-touch provisioning for every ' +
          'radio, eSIM identity for every device, and per-app QoS slicing — a ' +
          'guaranteed lane for the drone feed even when the network is busy.',
    path: 'ORCHESTRATOR → POLICY + eSIM + QoS SLICES → FLEET'
  },
  camera: {
    cat: 'USE CASE — TODAY',
    name: 'edge vision camera',
    desc: '4K video parsed by AI at the edge core: counts, flows, stalled vehicles, ' +
          'incidents. Raw footage stays on the block; only events and alerts travel. ' +
          'Guaranteed uplink means it never fights the public network for bandwidth.',
    path: '4K SENSOR → eSIM → POLE RADIO → EDGE AI → ALERT'
  },
  drone: {
    cat: 'USE CASE — EMERGING',
    name: 'security drone on patrol',
    desc: 'Drone-as-first-responder: on an alert it launches from the rooftop dock, ' +
          'streams live 4K over a guaranteed slice, and arrives minutes before anyone ' +
          'else. Next: beyond-line-of-sight patrols and photogrammetry passes that ' +
          'keep the city’s digital twin fresh.',
    path: 'DOCK → MACRO RADIO → GUARANTEED SLICE → OPS + TWIN'
  },
  traffic: {
    cat: 'USE CASE — TODAY',
    name: 'adaptive intersection',
    desc: 'Radar and vision watch the junction; an AI model at the edge retimes ' +
          'signals in real time and talks vehicle-to-infrastructure — transit and ' +
          'emergency vehicles get green lights first.',
    path: 'RADAR + VISION → EDGE AI → SIGNAL TIMING + V2X'
  },
  air: {
    cat: 'USE CASE — TODAY',
    name: 'environmental sensor',
    desc: 'Air quality, noise, and microclimate telemetry riding the same network ' +
          'as everything else — low-power devices with years of battery, no ' +
          'separate IoT network to build or babysit.',
    path: 'SENSOR → POLE RADIO → TIME-SERIES DB → OPEN DATA'
  },
  agv: {
    cat: 'USE CASE — EMERGING',
    name: 'sidewalk robot',
    desc: 'Delivery and inspection robots roam with autonomy on board — and a ' +
          'guaranteed low-latency slice for remote teleoperation the moment ' +
          'autonomy asks a human for help.',
    path: 'ROBOT → POLE RADIO → TELEOP SLICE (<20 ms) → PILOT'
  },
  kiosk: {
    cat: 'USE CASE — TODAY',
    name: 'civic kiosk',
    desc: 'Wayfinding, service alerts, and an emergency callbox — wirelessly ' +
          'backhauled, so it can move wherever the city needs it next weekend ' +
          'without trenching a single foot of conduit.',
    path: 'KIOSK → POLE RADIO → EDGE CORE → CITY SERVICES'
  },
  vault: {
    cat: 'USE CASE — TODAY',
    name: 'utility vault sensor',
    desc: 'Leak and level monitoring under the street, where Wi-Fi can’t reach — ' +
          'licensed-band signal penetrates below grade, and the fiber ring it ' +
          'protects runs right alongside.',
    path: 'BELOW-GRADE SENSOR → MACRO RADIO → MAINTENANCE QUEUE'
  }
};

(function cityInteractive() {
  var svg = document.getElementById('cityscape');
  var elCat = document.getElementById('city-cat');
  var elName = document.getElementById('city-name');
  var elDesc = document.getElementById('city-desc');
  var elPath = document.getElementById('city-path');
  if (!svg || !elName) return;

  var nodes = svg.querySelectorAll('.cnode');

  function select(id) {
    var d = CITY[id];
    if (!d) return;
    nodes.forEach(function (n) {
      var on = n.getAttribute('data-id') === id;
      n.classList.toggle('on', on);
      n.setAttribute('aria-pressed', on ? 'true' : 'false');
    });
    elCat.textContent = d.cat;
    elName.textContent = d.name;
    elDesc.textContent = d.desc;
    elPath.textContent = d.path;
  }

  nodes.forEach(function (n) {
    var id = n.getAttribute('data-id');
    n.setAttribute('role', 'button');
    n.setAttribute('tabindex', '0');
    n.setAttribute('aria-label', (CITY[id] && CITY[id].name) || id);
    n.addEventListener('click', function () { select(id); });
    n.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); select(id); }
    });
  });

  select('macro');
})();

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
