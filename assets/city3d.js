/* ==========================================================================
   Hero cityscape — three.js scene behind the name.
   Procedural low-poly skyline in the site palette, radio masts with pulsing
   coverage rings, light packets arcing between rooftops, mouse parallax,
   hover glow, click-to-ping. Packets attach to a keyless public Bitcoin
   feed when available (each pulse = one real transaction), otherwise run
   synthetic — the HUD labels which honestly.

   Contract: this file is an optional enhancement. If the CDN import, WebGL,
   or anything here fails, the page must remain fully readable — failure adds
   the `no3d` class and bows out.
   ========================================================================== */

import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.164.1/build/three.module.js';

(function () {
  'use strict';

  var mount = document.getElementById('city3d');
  if (!mount) return;

  var REDUCED = window.matchMedia &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function bail() { document.documentElement.classList.add('no3d'); }

  var renderer;
  try {
    renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'low-power' });
  } catch (e) { bail(); return; }

  var SMALL = mount.clientWidth < 700;
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, SMALL ? 1.5 : 1.75));
  renderer.setSize(mount.clientWidth, mount.clientHeight);
  renderer.setClearColor(0x151d27, 1);
  mount.appendChild(renderer.domElement);

  var scene = new THREE.Scene();
  scene.fog = new THREE.Fog(0x151d27, 110, 330);

  var camera = new THREE.PerspectiveCamera(
    40, mount.clientWidth / mount.clientHeight, 1, 500);
  var CAM_BASE = { x: 0, y: 38, z: 106 };
  camera.position.set(CAM_BASE.x, CAM_BASE.y, CAM_BASE.z);
  var LOOK_AT = new THREE.Vector3(0, 13, 0);
  camera.lookAt(LOOK_AT);

  scene.add(new THREE.AmbientLight(0x46586b, 1.15));
  var sun = new THREE.DirectionalLight(0x8ea4bc, 0.85);
  sun.position.set(-40, 90, 60);
  scene.add(sun);

  /* ---------- ground + grid ---------- */

  var ground = new THREE.Mesh(
    new THREE.PlaneGeometry(1400, 1400),
    new THREE.MeshBasicMaterial({ color: 0x121a23 }));
  ground.rotation.x = -Math.PI / 2;
  scene.add(ground);

  var grid = new THREE.GridHelper(700, 70, 0x27394e, 0x1c2938);
  grid.position.y = 0.04;
  scene.add(grid);

  /* ---------- window texture, quantized by height class ---------- */

  function makeWindowTexture(rows) {
    var c = document.createElement('canvas');
    c.width = 96; c.height = 32 * rows;
    var g = c.getContext('2d');
    g.fillStyle = '#1d2836';
    g.fillRect(0, 0, c.width, c.height);
    for (var y = 8; y < c.height; y += 16) {
      for (var x = 8; x < c.width; x += 14) {
        var lit = Math.random() < 0.22;
        g.fillStyle = lit ? 'rgba(210,222,232,0.72)' : 'rgba(203,213,223,0.16)';
        g.fillRect(x, y, 5, 7);
      }
    }
    var t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    return t;
  }

  var CLASSES = [6, 12, 18, 24, 32, 40]; // height buckets
  var sideMats = CLASSES.map(function (h) {
    return new THREE.MeshLambertMaterial({ map: makeWindowTexture(Math.round(h / 4)) });
  });
  var hotMats = CLASSES.map(function (h, i) {
    var m = sideMats[i].clone();
    m.emissive = new THREE.Color(0x2b4058);
    return m;
  });
  var topMat = new THREE.MeshLambertMaterial({ color: 0x25313f });
  var edgeMat = new THREE.LineBasicMaterial({
    color: 0x8595a6, transparent: true, opacity: 0.22
  });

  /* ---------- buildings ---------- */

  var buildings = [];
  var STEP = 11;
  for (var gx = -10; gx <= 10; gx++) {
    for (var gz = -7; gz <= 4; gz++) {
      if (Math.abs(gx) < 3 && gz > 1) continue;           // plaza under the name
      if (Math.random() < (SMALL ? 0.5 : 0.24)) continue; // breathing room
      var x = gx * STEP + (Math.random() - 0.5) * 3;
      var z = gz * STEP + (Math.random() - 0.5) * 3;
      var band = Math.min(Math.abs(gx) / 7, 1);
      var h = 5 + Math.pow(Math.random(), 1.6) * 26 + band * 9;
      var w = 5 + Math.random() * 2.5;
      var d = 5 + Math.random() * 2.5;
      var ci = 0;
      for (var k = 0; k < CLASSES.length; k++) if (CLASSES[k] <= h) ci = k;

      var geo = new THREE.BoxGeometry(w, h, d);
      var mats = [sideMats[ci], sideMats[ci], topMat, topMat, sideMats[ci], sideMats[ci]];
      var mesh = new THREE.Mesh(geo, mats);
      mesh.position.set(x, h / 2, z);
      mesh.userData = { h: h, ci: ci, mats: mats };
      scene.add(mesh);

      var edges = new THREE.LineSegments(new THREE.EdgesGeometry(geo), edgeMat);
      edges.position.copy(mesh.position);
      scene.add(edges);

      buildings.push(mesh);
    }
  }

  /* ---------- radio masts on the three tallest rooftops ---------- */

  var tallest = buildings.slice().sort(function (a, b) {
    return b.userData.h - a.userData.h;
  }).slice(0, 3);

  var mastMat = new THREE.MeshBasicMaterial({ color: 0xcbd5df });
  var masts = tallest.map(function (b) {
    var top = b.position.y + b.userData.h / 2;
    var mast = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.16, 7, 6), mastMat);
    mast.position.set(b.position.x, top + 3.5, b.position.z);
    scene.add(mast);
    var tip = new THREE.Mesh(new THREE.SphereGeometry(0.55, 10, 10),
      new THREE.MeshBasicMaterial({ color: 0xe8eef4 }));
    tip.position.set(b.position.x, top + 7.3, b.position.z);
    scene.add(tip);
    return { x: b.position.x, y: top + 7, z: b.position.z };
  });

  /* ---------- coverage ring pulses ---------- */

  var ringGeo = new THREE.RingGeometry(1, 1.06, 56);
  ringGeo.rotateX(-Math.PI / 2);
  var rings = [];
  function spawnRing(x, y, z, big) {
    var m = new THREE.Mesh(ringGeo, new THREE.MeshBasicMaterial({
      color: 0x7288a0, transparent: true, opacity: 0.5, depthWrite: false
    }));
    m.position.set(x, y, z);
    scene.add(m);
    rings.push({ mesh: m, t: 0, max: big ? 30 : 16 });
  }

  /* ---------- packets along rooftop arcs ---------- */

  var packetGeo = new THREE.SphereGeometry(0.45, 8, 8);
  var packetMat = new THREE.MeshBasicMaterial({ color: 0xdbe5ee });
  var packets = [];
  var packetCount = 0;
  var hudCount = document.getElementById('hud-count');

  function roofPoint(b) {
    return new THREE.Vector3(b.position.x, b.position.y + b.userData.h / 2, b.position.z);
  }

  function spawnPacket() {
    if (packets.length > 46 || !buildings.length) return;
    var a, b;
    if (Math.random() < 0.6 && masts.length) {
      var mst = masts[(Math.random() * masts.length) | 0];
      a = new THREE.Vector3(mst.x, mst.y, mst.z);
      b = roofPoint(buildings[(Math.random() * buildings.length) | 0]);
    } else {
      a = roofPoint(buildings[(Math.random() * buildings.length) | 0]);
      b = roofPoint(buildings[(Math.random() * buildings.length) | 0]);
    }
    if (a.distanceTo(b) < 8) return;
    var mid = a.clone().add(b).multiplyScalar(0.5);
    mid.y += 14 + Math.random() * 18;
    var curve = new THREE.QuadraticBezierCurve3(a, mid, b);
    var m = new THREE.Mesh(packetGeo, packetMat);
    scene.add(m);
    packets.push({ mesh: m, curve: curve, t: 0, speed: 0.35 + Math.random() * 0.4 });
    packetCount++;
    if (hudCount) hudCount.textContent = packetCount.toLocaleString('en-US');
  }

  /* ---------- live feed: each pulse = one real BTC transaction ---------- */

  var live = false;
  var lastSpawn = 0;
  if (!REDUCED && typeof WebSocket !== 'undefined') {
    try {
      var ws = new WebSocket('wss://ws.blockchain.info/inv');
      ws.onopen = function () { ws.send(JSON.stringify({ op: 'unconfirmed_sub' })); };
      ws.onmessage = function () {
        var now = performance.now();
        if (now - lastSpawn < 80) return; // throttle bursts
        lastSpawn = now;
        if (!live) {
          live = true;
          var st = document.getElementById('hud-status');
          if (st) st.textContent = 'LIVE — EACH PULSE IS A REAL BITCOIN TX';
          var note = document.getElementById('feed-note');
          if (note) note.textContent = 'each pulse is a real bitcoin transaction';
        }
        spawnPacket();
      };
      ws.onerror = function () { /* stay synthetic */ };
    } catch (e) { /* stay synthetic */ }
  }

  /* ---------- interaction: parallax, hover glow, click ping ---------- */

  var mouse = { x: 0, y: 0 };
  var ray = new THREE.Raycaster();
  var ndc = new THREE.Vector2();
  var hovered = null;

  function toNdc(e) {
    var r = mount.getBoundingClientRect();
    ndc.x = ((e.clientX - r.left) / r.width) * 2 - 1;
    ndc.y = -((e.clientY - r.top) / r.height) * 2 + 1;
    mouse.x = ndc.x; mouse.y = ndc.y;
  }

  mount.addEventListener('pointermove', function (e) {
    toNdc(e);
    if (REDUCED) return;
    ray.setFromCamera(ndc, camera);
    var hit = ray.intersectObjects(buildings, false)[0];
    var b = hit ? hit.object : null;
    if (hovered && hovered !== b) {
      hovered.material = hovered.userData.mats;
      hovered = null;
      mount.style.cursor = '';
    }
    if (b && hovered !== b) {
      hovered = b;
      var ci = b.userData.ci;
      b.material = [hotMats[ci], hotMats[ci], topMat, topMat, hotMats[ci], hotMats[ci]];
      mount.style.cursor = 'pointer';
    }
  });

  mount.addEventListener('pointerdown', function (e) {
    toNdc(e);
    ray.setFromCamera(ndc, camera);
    var hit = ray.intersectObjects(buildings, false)[0];
    if (hit) {
      var b = hit.object;
      spawnRing(b.position.x, b.position.y + b.userData.h / 2 + 0.5, b.position.z, false);
      for (var i = 0; i < 3; i++) spawnPacket();
    }
  });

  /* ---------- loop ---------- */

  var running = true, inView = true;
  var clock = new THREE.Clock();
  var mastTimer = 0, synthTimer = 0;

  if ('IntersectionObserver' in window) {
    new IntersectionObserver(function (es) {
      inView = es[0].isIntersecting;
    }, { threshold: 0.05 }).observe(mount);
  }
  document.addEventListener('visibilitychange', function () {
    running = !document.hidden;
  });

  function frame() {
    requestAnimationFrame(frame);
    if (!running || !inView) { clock.getDelta(); return; }
    var dt = Math.min(clock.getDelta(), 0.1);

    // parallax
    camera.position.x += ((CAM_BASE.x + mouse.x * 16) - camera.position.x) * 0.045;
    camera.position.y += ((CAM_BASE.y + mouse.y * -7) - camera.position.y) * 0.045;
    camera.lookAt(LOOK_AT);

    // mast pulses
    mastTimer += dt;
    if (mastTimer > 1.7) {
      mastTimer = 0;
      var mst = masts[(Math.random() * masts.length) | 0];
      if (mst) spawnRing(mst.x, mst.y - 6.5, mst.z, true);
    }

    // synthetic packets when the live feed is quiet
    synthTimer += dt;
    if (!live && synthTimer > 0.45) { synthTimer = 0; spawnPacket(); }

    // rings
    for (var i = rings.length - 1; i >= 0; i--) {
      var r = rings[i];
      r.t += dt / 3.2;
      var s = 1 + r.t * r.max;
      r.mesh.scale.set(s, 1, s);
      r.mesh.material.opacity = 0.5 * (1 - r.t);
      if (r.t >= 1) {
        scene.remove(r.mesh);
        r.mesh.material.dispose();
        rings.splice(i, 1);
      }
    }

    // packets
    for (var j = packets.length - 1; j >= 0; j--) {
      var p = packets[j];
      p.t += dt * p.speed;
      if (p.t >= 1) {
        spawnRing(p.curve.v2.x, p.curve.v2.y + 0.4, p.curve.v2.z, false);
        scene.remove(p.mesh);
        packets.splice(j, 1);
      } else {
        p.curve.getPoint(p.t, p.mesh.position);
      }
    }

    renderer.render(scene, camera);
  }

  function resize() {
    var w = mount.clientWidth, h = mount.clientHeight;
    if (!w || !h) return;
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h);
    if (REDUCED) renderer.render(scene, camera);
  }
  window.addEventListener('resize', resize);

  if (REDUCED) {
    // static skyline: no motion, one clean frame
    renderer.render(scene, camera);
  } else {
    frame();
  }

  document.documentElement.classList.add('has3d');
  document.documentElement.classList.remove('no3d'); // in case the watchdog fired first
})();
