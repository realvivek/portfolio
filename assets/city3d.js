/* ==========================================================================
   Hero cityscape v2 — three.js scene behind the name.
   Procedural low-poly city in the site palette: buildings with lit windows,
   roads with traffic, a park with trees, street lights, pedestrians, a
   patrol drone, radio masts that beamform onto moving targets, an edge-AI
   hub that attracts packet arcs, mouse parallax, hover glow, click-to-ping
   (rooftops) and beam bursts (masts). All repeated geometry is instanced.

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
  grid.position.y = 0.03;
  scene.add(grid);

  /* ---------- roads ----------
     axis 'x': runs along X at z = pos. axis 'z': runs along Z at x = pos. */

  var ROADS = [
    { axis: 'x', pos: 17,    len: 240 },  // boulevard in front of the towers
    { axis: 'x', pos: -38.5, len: 240 },  // back street
    { axis: 'z', pos: -49.5, len: 170 },  // west avenue
    { axis: 'z', pos: 49.5,  len: 170 }   // east avenue
  ];
  var ROAD_W = 5;

  var asphalt = new THREE.MeshBasicMaterial({ color: 0x0e141b });
  var curbMat = new THREE.MeshBasicMaterial({ color: 0x232f3c });

  function dashTexture() {
    var c = document.createElement('canvas');
    c.width = 64; c.height = 8;
    var g = c.getContext('2d');
    g.fillStyle = 'rgba(203,213,223,0.45)';
    g.fillRect(4, 3, 26, 2);
    var t = new THREE.CanvasTexture(c);
    t.wrapS = THREE.RepeatWrapping;
    return t;
  }
  var dashTex = dashTexture();

  ROADS.forEach(function (r) {
    var road = new THREE.Mesh(new THREE.PlaneGeometry(r.len, ROAD_W), asphalt);
    road.rotation.x = -Math.PI / 2;

    var tex = dashTex.clone();
    tex.repeat.set(r.len / 9, 1);
    var line = new THREE.Mesh(new THREE.PlaneGeometry(r.len, 0.28),
      new THREE.MeshBasicMaterial({ map: tex, transparent: true }));
    line.rotation.x = -Math.PI / 2;

    var curbA = new THREE.Mesh(new THREE.PlaneGeometry(r.len, 0.45), curbMat);
    var curbB = curbA.clone();
    curbA.rotation.x = curbB.rotation.x = -Math.PI / 2;

    if (r.axis === 'x') {
      road.position.set(0, 0.06, r.pos);
      line.position.set(0, 0.08, r.pos);
      curbA.position.set(0, 0.07, r.pos - ROAD_W / 2 - 0.3);
      curbB.position.set(0, 0.07, r.pos + ROAD_W / 2 + 0.3);
    } else {
      road.rotation.z = Math.PI / 2;
      line.rotation.z = Math.PI / 2;
      curbA.rotation.z = curbB.rotation.z = Math.PI / 2;
      road.position.set(r.pos, 0.06, -15);
      line.position.set(r.pos, 0.08, -15);
      curbA.position.set(r.pos - ROAD_W / 2 - 0.3, 0.07, -15);
      curbB.position.set(r.pos + ROAD_W / 2 + 0.3, 0.07, -15);
    }
    scene.add(road, line, curbA, curbB);
  });

  function nearRoad(x, z, halfW, halfD) {
    for (var i = 0; i < ROADS.length; i++) {
      var r = ROADS[i];
      if (r.axis === 'x' && Math.abs(z - r.pos) < ROAD_W / 2 + halfD + 0.8) return true;
      if (r.axis === 'z' && Math.abs(x - r.pos) < ROAD_W / 2 + halfW + 0.8) return true;
    }
    return false;
  }

  /* ---------- park (fills the plaza in front of the name) ---------- */

  var PARK = { x0: -26, x1: 26, z0: 26, z1: 52 };
  var park = new THREE.Mesh(
    new THREE.PlaneGeometry(PARK.x1 - PARK.x0, PARK.z1 - PARK.z0),
    new THREE.MeshBasicMaterial({ color: 0x17222a }));
  park.rotation.x = -Math.PI / 2;
  park.position.set(0, 0.05, (PARK.z0 + PARK.z1) / 2);
  scene.add(park);

  var pathMat = new THREE.MeshBasicMaterial({ color: 0x223040 });
  var pathH = new THREE.Mesh(new THREE.PlaneGeometry(PARK.x1 - PARK.x0, 1.6), pathMat);
  pathH.rotation.x = -Math.PI / 2;
  pathH.position.set(0, 0.08, 39);
  var pathV = new THREE.Mesh(new THREE.PlaneGeometry(1.6, PARK.z1 - PARK.z0), pathMat);
  pathV.rotation.x = -Math.PI / 2;
  pathV.position.set(0, 0.08, (PARK.z0 + PARK.z1) / 2);
  scene.add(pathH, pathV);

  /* trees (instanced trunk + canopy) */
  var treeSpots = [];
  for (var ti = 0; ti < 60 && treeSpots.length < (SMALL ? 10 : 18); ti++) {
    var tx = PARK.x0 + 2 + Math.random() * (PARK.x1 - PARK.x0 - 4);
    var tz = PARK.z0 + 2 + Math.random() * (PARK.z1 - PARK.z0 - 4);
    if (Math.abs(tz - 39) < 2.4 || Math.abs(tx) < 2.4) continue;
    treeSpots.push({ x: tx, z: tz, s: 0.7 + Math.random() * 0.6 });
  }
  var tmpM = new THREE.Matrix4();
  var tmpQ = new THREE.Quaternion();
  var tmpV = new THREE.Vector3();
  var ONE = new THREE.Vector3(1, 1, 1);

  var trunks = new THREE.InstancedMesh(
    new THREE.CylinderGeometry(0.22, 0.3, 1.6, 6),
    new THREE.MeshLambertMaterial({ color: 0x3a3f3c }), treeSpots.length);
  var canopies = new THREE.InstancedMesh(
    new THREE.IcosahedronGeometry(1.25, 0),
    new THREE.MeshLambertMaterial({ color: 0x39493f }), treeSpots.length);
  treeSpots.forEach(function (t, i) {
    tmpM.compose(tmpV.set(t.x, 0.8, t.z), tmpQ.identity(), ONE);
    trunks.setMatrixAt(i, tmpM);
    tmpM.compose(tmpV.set(t.x, 1.5 + 1.0 * t.s, t.z), tmpQ,
      new THREE.Vector3(t.s, t.s, t.s));
    canopies.setMatrixAt(i, tmpM);
    canopies.setColorAt(i, new THREE.Color().setHSL(0.35, 0.13, 0.3 + Math.random() * 0.08));
  });
  scene.add(trunks, canopies);

  /* ---------- street lights (instanced) ---------- */

  var lightSpots = [];
  for (var lx = -78; lx <= 78; lx += 26) {
    lightSpots.push({ x: lx, z: 17 - ROAD_W / 2 - 1.4 });
    lightSpots.push({ x: lx + 13, z: 17 + ROAD_W / 2 + 1.4 });
  }
  for (var lz = -70; lz <= 40; lz += 26) {
    lightSpots.push({ x: -49.5 - ROAD_W / 2 - 1.4, z: lz });
    lightSpots.push({ x: 49.5 + ROAD_W / 2 + 1.4, z: lz + 13 });
  }

  var poles = new THREE.InstancedMesh(
    new THREE.CylinderGeometry(0.09, 0.12, 4.4, 5),
    new THREE.MeshLambertMaterial({ color: 0x3c4a58 }), lightSpots.length);
  var lamps = new THREE.InstancedMesh(
    new THREE.SphereGeometry(0.26, 8, 8),
    new THREE.MeshBasicMaterial({ color: 0xe9eff5 }), lightSpots.length);
  var pools = new THREE.InstancedMesh(
    new THREE.CircleGeometry(2.4, 20),
    new THREE.MeshBasicMaterial({ color: 0xcbd5df, transparent: true, opacity: 0.05, depthWrite: false }),
    lightSpots.length);
  var poolQ = new THREE.Quaternion().setFromEuler(new THREE.Euler(-Math.PI / 2, 0, 0));
  lightSpots.forEach(function (p, i) {
    tmpM.compose(tmpV.set(p.x, 2.2, p.z), tmpQ.identity(), ONE);
    poles.setMatrixAt(i, tmpM);
    tmpM.compose(tmpV.set(p.x, 4.5, p.z), tmpQ, ONE);
    lamps.setMatrixAt(i, tmpM);
    tmpM.compose(tmpV.set(p.x, 0.09, p.z), poolQ, ONE);
    pools.setMatrixAt(i, tmpM);
  });
  scene.add(poles, lamps, pools);

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

  var CLASSES = [6, 12, 18, 24, 32, 40];
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
      if (Math.abs(gx) < 3 && gz > 1) continue;           // the park lives here
      if (Math.random() < (SMALL ? 0.5 : 0.24)) continue; // breathing room
      var x = gx * STEP + (Math.random() - 0.5) * 3;
      var z = gz * STEP + (Math.random() - 0.5) * 3;
      var w = 5 + Math.random() * 2.5;
      var d = 5 + Math.random() * 2.5;
      if (nearRoad(x, z, w / 2, d / 2)) continue;
      var band = Math.min(Math.abs(gx) / 7, 1);
      var h = 5 + Math.pow(Math.random(), 1.6) * 26 + band * 9;
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
  var mastTips = [];
  var masts = tallest.map(function (b) {
    var top = b.position.y + b.userData.h / 2;
    var mast = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.16, 7, 6), mastMat);
    mast.position.set(b.position.x, top + 3.5, b.position.z);
    scene.add(mast);
    var tip = new THREE.Mesh(new THREE.SphereGeometry(0.6, 10, 10),
      new THREE.MeshBasicMaterial({ color: 0xe8eef4 }));
    tip.position.set(b.position.x, top + 7.3, b.position.z);
    tip.userData.isMast = true;
    scene.add(tip);
    mastTips.push(tip);
    return { x: b.position.x, y: top + 7, z: b.position.z };
  });

  /* ---------- edge-AI hub: rooftop gear + blinking LED ---------- */

  var edgeHub = null;
  var bestScore = Infinity;
  buildings.forEach(function (b) {
    if (b.userData.h < 14 || b.userData.h > 26) return;
    var s = Math.abs(b.position.x - 18) + Math.abs(b.position.z + 6);
    if (s < bestScore) { bestScore = s; edgeHub = b; }
  });
  var ledMat = null;
  if (edgeHub) {
    var roofY = edgeHub.position.y + edgeHub.userData.h / 2;
    var gearMat = new THREE.MeshLambertMaterial({ color: 0x2c3a49 });
    var gear = new THREE.Mesh(new THREE.BoxGeometry(2.6, 1.2, 1.8), gearMat);
    gear.position.set(edgeHub.position.x, roofY + 0.6, edgeHub.position.z);
    scene.add(gear);
    for (var ai = -1; ai <= 1; ai++) {
      var ant = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 2.2, 4), mastMat);
      ant.position.set(edgeHub.position.x + ai * 0.8, roofY + 2.2, edgeHub.position.z);
      scene.add(ant);
    }
    ledMat = new THREE.MeshBasicMaterial({ color: 0x9fe0b8, transparent: true });
    var led = new THREE.Mesh(new THREE.SphereGeometry(0.22, 8, 8), ledMat);
    led.position.set(edgeHub.position.x, roofY + 1.4, edgeHub.position.z + 1);
    scene.add(led);
  }

  /* ---------- coverage rings ---------- */

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

  /* ---------- packet arcs (simulated network traffic) ---------- */

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
    if (Math.random() < 0.55 && masts.length) {
      var mst = masts[(Math.random() * masts.length) | 0];
      a = new THREE.Vector3(mst.x, mst.y, mst.z);
    } else {
      a = roofPoint(buildings[(Math.random() * buildings.length) | 0]);
    }
    // the edge hub attracts traffic
    b = (edgeHub && Math.random() < 0.45)
      ? roofPoint(edgeHub)
      : roofPoint(buildings[(Math.random() * buildings.length) | 0]);
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

  /* ---------- pedestrians (instanced, walking routes) ---------- */

  var WALK_SEGS = [
    { ax: -75, az: 12.7, bx: 75, bz: 12.7 },   // boulevard south sidewalk
    { ax: -75, az: 21.3, bx: 75, bz: 21.3 },   // boulevard north sidewalk
    { ax: -24, az: 39,   bx: 24, bz: 39 },     // park path east-west
    { ax: 0,   az: 27,   bx: 0,  bz: 51 },     // park path north-south
    { ax: -44.7, az: -60, bx: -44.7, bz: 8 },  // west avenue sidewalk
    { ax: 54.3,  az: -60, bx: 54.3,  bz: 8 }   // east avenue sidewalk
  ];
  var N_PEOPLE = SMALL ? 14 : 26;
  var walkers = [];
  var bodies = new THREE.InstancedMesh(
    new THREE.CapsuleGeometry(0.26, 0.75, 2, 8),
    new THREE.MeshLambertMaterial({ color: 0xffffff }), N_PEOPLE);
  var heads = new THREE.InstancedMesh(
    new THREE.SphereGeometry(0.21, 8, 8),
    new THREE.MeshLambertMaterial({ color: 0xffffff }), N_PEOPLE);
  bodies.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  heads.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  var TONES = [0x8595a6, 0xa9b6c2, 0x6e8093, 0xcbd5df, 0x5d7186];
  for (var wi = 0; wi < N_PEOPLE; wi++) {
    var seg = WALK_SEGS[(Math.random() * WALK_SEGS.length) | 0];
    walkers.push({
      seg: seg,
      t: Math.random(),
      dir: Math.random() < 0.5 ? 1 : -1,
      speed: 0.9 + Math.random() * 1.1,
      phase: Math.random() * 6.28
    });
    var tone = new THREE.Color(TONES[(Math.random() * TONES.length) | 0]);
    bodies.setColorAt(wi, tone);
    heads.setColorAt(wi, tone.clone().multiplyScalar(1.15));
  }
  scene.add(bodies, heads);

  function segLen(s) {
    return Math.hypot(s.bx - s.ax, s.bz - s.az);
  }

  function updateWalkers(dt, time) {
    for (var i = 0; i < walkers.length; i++) {
      var w = walkers[i];
      w.t += (w.dir * w.speed * dt) / segLen(w.seg);
      if (w.t > 1) { w.t = 1; w.dir = -1; }
      if (w.t < 0) { w.t = 0; w.dir = 1; }
      var x = w.seg.ax + (w.seg.bx - w.seg.ax) * w.t;
      var z = w.seg.az + (w.seg.bz - w.seg.az) * w.t;
      var bob = REDUCED ? 0 : Math.sin(time * 7 + w.phase) * 0.05;
      tmpM.compose(tmpV.set(x, 0.75 + bob, z), tmpQ.identity(), ONE);
      bodies.setMatrixAt(i, tmpM);
      tmpM.compose(tmpV.set(x, 1.5 + bob, z), tmpQ, ONE);
      heads.setMatrixAt(i, tmpM);
    }
    bodies.instanceMatrix.needsUpdate = true;
    heads.instanceMatrix.needsUpdate = true;
  }

  /* ---------- traffic (instanced cars) ---------- */

  var N_CARS = SMALL ? 6 : 10;
  var cars = [];
  var carMesh = new THREE.InstancedMesh(
    new THREE.BoxGeometry(2.6, 0.9, 1.2),
    new THREE.MeshLambertMaterial({ color: 0xffffff }), N_CARS);
  carMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  var CAR_TONES = [0x3d4c5c, 0x55677a, 0x2e3b49, 0x74879b];
  var qZ = new THREE.Quaternion().setFromEuler(new THREE.Euler(0, Math.PI / 2, 0));
  for (var ciX = 0; ciX < N_CARS; ciX++) {
    var lane;
    if (ciX < N_CARS / 2) {
      // boulevard + back street (run along X)
      var r = ciX % 2 === 0 ? ROADS[0] : ROADS[1];
      lane = { axis: 'x', fixed: r.pos + (ciX % 4 < 2 ? -1.3 : 1.3), dir: ciX % 4 < 2 ? 1 : -1, range: 105 };
    } else {
      var r2 = ciX % 2 === 0 ? ROADS[2] : ROADS[3];
      lane = { axis: 'z', fixed: r2.pos + (ciX % 4 < 2 ? -1.3 : 1.3), dir: ciX % 4 < 2 ? 1 : -1, range: 75 };
    }
    cars.push({
      lane: lane,
      p: -lane.range + Math.random() * lane.range * 2,
      speed: 7 + Math.random() * 6
    });
    carMesh.setColorAt(ciX, new THREE.Color(CAR_TONES[(Math.random() * CAR_TONES.length) | 0]));
  }
  scene.add(carMesh);

  function carPos(i, out) {
    var c = cars[i];
    return c.lane.axis === 'x'
      ? out.set(c.p, 0.55, c.lane.fixed)
      : out.set(c.lane.fixed, 0.55, c.p);
  }

  function updateCars(dt) {
    for (var i = 0; i < cars.length; i++) {
      var c = cars[i];
      c.p += c.lane.dir * c.speed * dt;
      if (c.p > c.lane.range) c.p = -c.lane.range;
      if (c.p < -c.lane.range) c.p = c.lane.range;
      carPos(i, tmpV);
      tmpM.compose(tmpV, c.lane.axis === 'x' ? tmpQ.identity() : qZ, ONE);
      carMesh.setMatrixAt(i, tmpM);
    }
    carMesh.instanceMatrix.needsUpdate = true;
  }

  /* ---------- patrol drone ---------- */

  var drone = new THREE.Group();
  var dArm1 = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.12, 0.12), mastMat);
  var dArm2 = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.12, 2.4), mastMat);
  var dLightMat = new THREE.MeshBasicMaterial({ color: 0xe8eef4, transparent: true });
  var dLight = new THREE.Mesh(new THREE.SphereGeometry(0.2, 8, 8), dLightMat);
  dLight.position.y = -0.25;
  drone.add(dArm1, dArm2, dLight);
  scene.add(drone);
  var DRONE_WPS = [
    new THREE.Vector3(-58, 46, -30),
    new THREE.Vector3(48, 50, -48),
    new THREE.Vector3(68, 44, 14),
    new THREE.Vector3(-38, 52, 26)
  ];
  var droneWp = 0;
  drone.position.copy(DRONE_WPS[0]);

  function updateDrone(dt, time) {
    var target = DRONE_WPS[droneWp];
    tmpV.copy(target).sub(drone.position);
    var dist = tmpV.length();
    if (dist < 2) { droneWp = (droneWp + 1) % DRONE_WPS.length; return; }
    tmpV.normalize().multiplyScalar(Math.min(9 * dt, dist));
    drone.position.add(tmpV);
    drone.position.y += Math.sin(time * 2.2) * 0.02;
    dLightMat.opacity = 0.4 + 0.6 * Math.abs(Math.sin(time * 4));
  }

  /* ---------- beamforming: masts track moving targets ---------- */

  var beams = [];
  function spawnBeam(fromMast, getTarget) {
    var g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(6), 3));
    var line = new THREE.Line(g, new THREE.LineBasicMaterial({
      color: 0x9fb8d0, transparent: true, opacity: 0.55
    }));
    scene.add(line);
    beams.push({ line: line, from: fromMast, get: getTarget, t: 0 });
  }

  function randomTargetGetter() {
    var roll = Math.random();
    if (roll < 0.5 && cars.length) {
      var i = (Math.random() * cars.length) | 0;
      return function (out) { return carPos(i, out); };
    }
    if (roll < 0.75) {
      return function (out) { return out.copy(drone.position); };
    }
    var wIdx = (Math.random() * walkers.length) | 0;
    return function (out) {
      var w = walkers[wIdx];
      out.set(
        w.seg.ax + (w.seg.bx - w.seg.ax) * w.t,
        1.4,
        w.seg.az + (w.seg.bz - w.seg.az) * w.t);
      return out;
    };
  }

  function updateBeams(dt) {
    for (var i = beams.length - 1; i >= 0; i--) {
      var bm = beams[i];
      bm.t += dt / 1.1;
      var pos = bm.line.geometry.attributes.position;
      pos.setXYZ(0, bm.from.x, bm.from.y, bm.from.z);
      bm.get(tmpV);
      pos.setXYZ(1, tmpV.x, tmpV.y, tmpV.z);
      pos.needsUpdate = true;
      bm.line.material.opacity = 0.55 * (1 - bm.t);
      if (bm.t >= 1) {
        scene.remove(bm.line);
        bm.line.geometry.dispose();
        bm.line.material.dispose();
        beams.splice(i, 1);
      }
    }
  }

  /* ---------- RF coverage lens (hold + drag with a mouse) ----------
     Ground heatmap of mast signal strength with real line-of-sight
     occlusion: at init, rays are traced from each mast to a grid of
     ground cells against every building footprint. Taller masts get
     more range. Revealed only inside a draggable lens. */

  var AREA = { x0: -115, x1: 115, z0: -85, z1: 60 };
  var OCC_N = SMALL ? 64 : 96;
  var occData = null;

  function mastRange(m) { return 30 + m.y * 1.15; }

  var lensUniforms = {
    uOcc:  { value: null },
    uM0:   { value: new THREE.Vector3(0, 0, 1) },
    uM1:   { value: new THREE.Vector3(0, 0, 1) },
    uM2:   { value: new THREE.Vector3(0, 0, 1) },
    uLens: { value: new THREE.Vector2(0, 39) },
    uR:    { value: 26 },
    uAmt:  { value: 0 },
    uArea: { value: new THREE.Vector4(AREA.x0, AREA.z0, AREA.x1 - AREA.x0, AREA.z1 - AREA.z0) }
  };

  var lensMat = new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    uniforms: lensUniforms,
    vertexShader: [
      'varying vec3 vW;',
      'void main() {',
      '  vW = (modelMatrix * vec4(position, 1.0)).xyz;',
      '  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);',
      '}'
    ].join('\n'),
    fragmentShader: [
      'uniform sampler2D uOcc;',
      'uniform vec3 uM0; uniform vec3 uM1; uniform vec3 uM2;',
      'uniform vec2 uLens; uniform float uR; uniform float uAmt; uniform vec4 uArea;',
      'varying vec3 vW;',
      'float contrib(vec3 m, float vis) {',
      '  float d = distance(vW.xz, m.xy);',
      '  float base = pow(clamp(1.0 - d / m.z, 0.0, 1.0), 1.55);',
      '  return base * (0.18 + 0.82 * vis);',
      '}',
      'void main() {',
      '  vec2 uv = vec2((vW.x - uArea.x) / uArea.z, (vW.z - uArea.y) / uArea.w);',
      '  vec3 vis = texture2D(uOcc, uv).rgb;',
      '  float s = max(contrib(uM0, vis.r), max(contrib(uM1, vis.g), contrib(uM2, vis.b)));',
      '  vec3 c1 = vec3(0.086, 0.114, 0.153);',
      '  vec3 c2 = vec3(0.169, 0.251, 0.345);',
      '  vec3 c3 = vec3(0.447, 0.533, 0.627);',
      '  vec3 c4 = vec3(0.910, 0.937, 0.957);',
      '  vec3 col = s < 0.34 ? mix(c1, c2, s / 0.34)',
      '           : s < 0.67 ? mix(c2, c3, (s - 0.34) / 0.33)',
      '           : mix(c3, c4, (s - 0.67) / 0.33);',
      '  float dl = distance(vW.xz, uLens);',
      '  float mask = 1.0 - smoothstep(uR * 0.8, uR, dl);',
      '  float rim = smoothstep(uR * 0.93, uR * 0.985, dl) * (1.0 - smoothstep(uR * 0.985, uR * 1.03, dl));',
      '  float a = uAmt * (mask * (0.42 + 0.5 * s) + rim * 0.85);',
      '  gl_FragColor = vec4(col + rim * vec3(0.55, 0.63, 0.72), a);',
      '}'
    ].join('\n')
  });

  var lensPlane = new THREE.Mesh(
    new THREE.PlaneGeometry(AREA.x1 - AREA.x0, AREA.z1 - AREA.z0), lensMat);
  lensPlane.rotation.x = -Math.PI / 2;
  lensPlane.position.set((AREA.x0 + AREA.x1) / 2, 0.12, (AREA.z0 + AREA.z1) / 2);
  lensPlane.visible = false;
  scene.add(lensPlane);

  function buildOcclusion() {
    var boxes = buildings.map(function (b) {
      var g = b.geometry.parameters;
      return {
        minx: b.position.x - g.width / 2, maxx: b.position.x + g.width / 2,
        minz: b.position.z - g.depth / 2, maxz: b.position.z + g.depth / 2
      };
    });
    function blocked(ax, az, bx, bz) {
      var dx = bx - ax, dz = bz - az;
      for (var i = 0; i < boxes.length; i++) {
        var o = boxes[i];
        var tmin = 0, tmax = 1;
        if (Math.abs(dx) < 1e-6) {
          if (ax < o.minx || ax > o.maxx) continue;
        } else {
          var t1 = (o.minx - ax) / dx, t2 = (o.maxx - ax) / dx;
          if (t1 > t2) { var t = t1; t1 = t2; t2 = t; }
          tmin = Math.max(tmin, t1); tmax = Math.min(tmax, t2);
          if (tmin > tmax) continue;
        }
        if (Math.abs(dz) < 1e-6) {
          if (az < o.minz || az > o.maxz) continue;
        } else {
          var t3 = (o.minz - az) / dz, t4 = (o.maxz - az) / dz;
          if (t3 > t4) { var u = t3; t3 = t4; t4 = u; }
          tmin = Math.max(tmin, t3); tmax = Math.min(tmax, t4);
          if (tmin > tmax) continue;
        }
        if (tmax > 0.02 && tmin < 0.98) return true;
      }
      return false;
    }
    var data = new Uint8Array(OCC_N * OCC_N * 4);
    for (var iy = 0; iy < OCC_N; iy++) {
      for (var ix = 0; ix < OCC_N; ix++) {
        var wx = AREA.x0 + (ix + 0.5) / OCC_N * (AREA.x1 - AREA.x0);
        var wz = AREA.z0 + (iy + 0.5) / OCC_N * (AREA.z1 - AREA.z0);
        var off = (iy * OCC_N + ix) * 4;
        for (var mi = 0; mi < 3; mi++) {
          var m = masts[mi];
          data[off + mi] = (m && !blocked(m.x, m.z, wx, wz)) ? 255 : 0;
        }
        data[off + 3] = 255;
      }
    }
    occData = data;
    var tex = new THREE.DataTexture(data, OCC_N, OCC_N);
    tex.magFilter = THREE.LinearFilter;
    tex.minFilter = THREE.LinearFilter;
    tex.needsUpdate = true;
    lensUniforms.uOcc.value = tex;
    for (var k = 0; k < 3; k++) {
      var mm = masts[k];
      if (mm) lensUniforms['uM' + k].value.set(mm.x, mm.z, mastRange(mm));
    }
  }
  if (!REDUCED) setTimeout(buildOcclusion, 600);

  function dbmAt(x, z) {
    if (!occData) return -110;
    var ix = Math.max(0, Math.min(OCC_N - 1, ((x - AREA.x0) / (AREA.x1 - AREA.x0) * OCC_N) | 0));
    var iy = Math.max(0, Math.min(OCC_N - 1, ((z - AREA.z0) / (AREA.z1 - AREA.z0) * OCC_N) | 0));
    var off = (iy * OCC_N + ix) * 4;
    var s = 0;
    for (var i = 0; i < 3 && i < masts.length; i++) {
      var m = masts[i];
      var d = Math.hypot(x - m.x, z - m.z);
      var base = Math.pow(Math.max(0, 1 - d / mastRange(m)), 1.55);
      s = Math.max(s, base * (0.18 + 0.82 * occData[off + i] / 255));
    }
    return Math.round(-110 + 70 * s);
  }

  /* ---------- interaction: parallax, hover glow, clicks, lens ---------- */

  var mouse = { x: 0, y: 0 };
  var ray = new THREE.Raycaster();
  var ndc = new THREE.Vector2();
  var hovered = null;
  var groundPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
  var groundHit = new THREE.Vector3();
  var press = { down: false, x: 0, y: 0, at: 0 };
  var lens = { on: false, amt: 0 };
  var hudStatus = document.getElementById('hud-status');

  function toNdc(e) {
    var r = mount.getBoundingClientRect();
    ndc.x = ((e.clientX - r.left) / r.width) * 2 - 1;
    ndc.y = -((e.clientY - r.top) / r.height) * 2 + 1;
    mouse.x = ndc.x; mouse.y = ndc.y;
  }

  function updateLensPos() {
    ray.setFromCamera(ndc, camera);
    if (ray.ray.intersectPlane(groundPlane, groundHit)) {
      lensUniforms.uLens.value.set(groundHit.x, groundHit.z);
    }
  }

  mount.addEventListener('pointermove', function (e) {
    toNdc(e);
    if (REDUCED) return;
    if (press.down && e.pointerType === 'mouse' && !lens.on) {
      var moved = Math.hypot(e.clientX - press.x, e.clientY - press.y);
      if (moved > 6 || performance.now() - press.at > 220) lens.on = true;
    }
    if (lens.on) { updateLensPos(); return; }
    ray.setFromCamera(ndc, camera);
    var hit = ray.intersectObjects(buildings.concat(mastTips), false)[0];
    var obj = hit ? hit.object : null;
    if (hovered && hovered !== obj) {
      if (!hovered.userData.isMast) hovered.material = hovered.userData.mats;
      hovered = null;
      mount.style.cursor = '';
    }
    if (obj && hovered !== obj) {
      hovered = obj;
      if (!obj.userData.isMast) {
        var ci = obj.userData.ci;
        obj.material = [hotMats[ci], hotMats[ci], topMat, topMat, hotMats[ci], hotMats[ci]];
      }
      mount.style.cursor = 'pointer';
    }
  });

  mount.addEventListener('pointerdown', function (e) {
    toNdc(e);
    press.down = true; press.x = e.clientX; press.y = e.clientY;
    press.at = performance.now();
    if (!REDUCED && e.pointerType === 'mouse') updateLensPos();
  });

  window.addEventListener('pointerup', function (e) {
    var wasLens = lens.on;
    lens.on = false;
    if (!press.down) return;
    press.down = false;
    if (wasLens) return;                              // a sweep, not a click
    if (performance.now() - press.at > 400) return;   // a long hold, not a click
    toNdc(e);
    ray.setFromCamera(ndc, camera);
    var hit = ray.intersectObjects(buildings.concat(mastTips), false)[0];
    if (!hit) return;
    var obj = hit.object;
    if (obj.userData.isMast) {
      spawnRing(obj.position.x, obj.position.y - 6.5, obj.position.z, true);
      for (var i = 0; i < 3; i++) spawnBeam(obj.position, randomTargetGetter());
    } else {
      spawnRing(obj.position.x, obj.position.y + obj.userData.h / 2 + 0.5, obj.position.z, false);
      for (var j = 0; j < 3; j++) spawnPacket();
    }
  });

  mount.addEventListener('pointerleave', function () { lens.on = false; });

  /* ---------- loop ---------- */

  var running = true, inView = true;
  var clock = new THREE.Clock();
  var elapsed = 0;
  var mastTimer = 0, packetTimer = 0, beamTimer = 0;

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
    elapsed += dt;

    camera.position.x += ((CAM_BASE.x + mouse.x * 16) - camera.position.x) * 0.045;
    camera.position.y += ((CAM_BASE.y + mouse.y * -7) - camera.position.y) * 0.045;
    camera.lookAt(LOOK_AT);

    mastTimer += dt;
    if (mastTimer > 1.7) {
      mastTimer = 0;
      var mst = masts[(Math.random() * masts.length) | 0];
      if (mst) spawnRing(mst.x, mst.y - 6.5, mst.z, true);
    }

    packetTimer += dt;
    if (packetTimer > 0.45) { packetTimer = 0; spawnPacket(); }

    beamTimer += dt;
    if (beamTimer > 2.1 && masts.length) {
      beamTimer = 0;
      var m = masts[(Math.random() * masts.length) | 0];
      spawnBeam(new THREE.Vector3(m.x, m.y, m.z), randomTargetGetter());
    }

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

    updateWalkers(dt, elapsed);
    updateCars(dt);
    updateDrone(dt, elapsed);
    updateBeams(dt);
    if (ledMat) ledMat.opacity = 0.35 + 0.65 * Math.abs(Math.sin(elapsed * 3));

    // RF lens fade + live dBm readout
    var lensTarget = (lens.on && occData) ? 1 : 0;
    lens.amt += (lensTarget - lens.amt) * 0.14;
    if (lens.amt > 0.01) {
      lensPlane.visible = true;
      lensUniforms.uAmt.value = lens.amt;
      if (lens.on && hudStatus) {
        hudStatus.textContent = 'RF LENS: ' +
          dbmAt(lensUniforms.uLens.value.x, lensUniforms.uLens.value.y) + ' dBm';
      }
    } else if (lensPlane.visible) {
      lensPlane.visible = false;
      if (hudStatus) hudStatus.textContent = 'NETWORK: SIMULATED';
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
    // static frame: place the movers once, then render without animating
    updateWalkers(0, 0);
    updateCars(0);
    renderer.render(scene, camera);
  } else {
    frame();
  }

  document.documentElement.classList.add('has3d');
  document.documentElement.classList.remove('no3d'); // in case the watchdog fired first
})();
