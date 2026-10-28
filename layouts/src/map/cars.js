// Traffic: low-poly but recognisable cars (shaped body, glasshouse, wheels, lamps, contact shadow) that
// drive on the left, follow their lane round closed loops and make a slow U-turn at each end of a road.

import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';

const FT = 3.28084;

function paint(geo, hex) {
  const c = new THREE.Color(hex);
  const n = geo.attributes.position.count;
  const arr = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) arr.set([c.r, c.g, c.b], i * 3);
  geo.setAttribute('color', new THREE.BufferAttribute(arr, 3));
  return geo.index ? geo.toNonIndexed() : geo;
}

/** side profile (x along the car, y up) extruded across the width, then turned so z is up */
function extrudeProfile(points, width, bevel = 0.06) {
  const shape = new THREE.Shape(points.map(([x, y]) => new THREE.Vector2(x, y)));
  const g = new THREE.ExtrudeGeometry(shape, { depth: width - bevel * 2, bevelEnabled: true, bevelSize: bevel, bevelThickness: bevel, bevelSegments: 2, curveSegments: 4 });
  g.rotateX(Math.PI / 2); // profile-y becomes z (up); extrusion runs along -y
  g.translate(0, (width - bevel * 2) / 2, 0);
  return g;
}

const BODIES = {
  // [rear ... front], metres
  sedan: {
    L: 4.4,
    W: 1.76,
    body: [[-2.18, 0.3], [-2.2, 0.62], [-2.08, 0.88], [-1.42, 0.96], [-0.98, 1.4], [0.3, 1.43], [0.98, 0.98], [1.9, 0.86], [2.18, 0.66], [2.2, 0.3]],
    glass: [[-1.36, 0.97], [-0.96, 1.36], [0.28, 1.39], [0.9, 0.99]],
    axles: [-1.32, 1.36],
  },
  suv: {
    L: 4.3,
    W: 1.84,
    body: [[-2.12, 0.36], [-2.15, 0.8], [-2.05, 1.12], [-1.88, 1.66], [0.42, 1.7], [1.05, 1.12], [1.95, 1.0], [2.13, 0.78], [2.15, 0.36]],
    glass: [[-1.82, 1.13], [-1.72, 1.62], [0.4, 1.66], [0.98, 1.13]],
    axles: [-1.3, 1.32],
  },
};

function buildCarGeometry(kind) {
  const spec = BODIES[kind];
  const body = extrudeProfile(spec.body, spec.W);
  body.deleteAttribute('uv');
  const bodyGeo = body.index ? body.toNonIndexed() : body;

  const parts = [];
  // glasshouse pokes 1.5 cm out of the sides only, so the roof keeps the paint colour
  const glass = extrudeProfile(spec.glass, spec.W + 0.03, 0.02);
  glass.translate(0, 0, -0.02);
  parts.push(paint(glass, '#1b2733'));
  // windscreen and rear window lie on the sloping faces
  const slope = (x0, z0, x1, z1) => {
    const len = Math.hypot(x1 - x0, z1 - z0);
    const g = new THREE.PlaneGeometry(len * 0.86, spec.W * 0.8);
    g.rotateY(-Math.atan2(z1 - z0, x1 - x0));
    const nx = -(z1 - z0) / len;
    const nz = (x1 - x0) / len;
    const s = nz < 0 ? -1 : 1;
    g.translate((x0 + x1) / 2 + nx * 0.025 * s, 0, (z0 + z1) / 2 + nz * 0.025 * s);
    if (nz < 0) g.rotateX(0); // keep winding; DoubleSide material below covers both cases
    return paint(g, '#223140');
  };
  const b = spec.body;
  const front = kind === 'sedan' ? [b[5], b[6]] : [b[4], b[5]];
  const rear = kind === 'sedan' ? [b[3], b[4]] : [b[2], b[3]];
  parts.push(slope(front[0][0], front[0][1], front[1][0], front[1][1]));
  parts.push(slope(rear[0][0], rear[0][1], rear[1][0], rear[1][1]));
  // wheels with lighter hubs
  for (const ax of spec.axles)
    for (const side of [-1, 1]) {
      const tyre = new THREE.CylinderGeometry(0.34, 0.34, 0.24, 14);
      tyre.translate(0, 0, 0);
      tyre.rotateZ(0);
      // cylinder axis is y, which is already the car's width axis
      tyre.translate(ax, side * (spec.W / 2 - 0.1), 0.34);
      parts.push(paint(tyre, '#14171b'));
      const hub = new THREE.CylinderGeometry(0.19, 0.19, 0.26, 10);
      hub.translate(ax, side * (spec.W / 2 - 0.095), 0.34);
      parts.push(paint(hub, '#aeb4bd'));
    }
  // lamps and a dark lower sill so the body does not read as one block
  const lamp = (x, y, z, w, hex) => {
    const g = new THREE.BoxGeometry(0.06, w, 0.14);
    g.translate(x, y, z);
    parts.push(paint(g, hex));
  };
  const hx = spec.L / 2 + 0.005;
  const hz = kind === 'sedan' ? 0.7 : 0.88;
  [-1, 1].forEach((s) => {
    lamp(hx, s * (spec.W / 2 - 0.34), hz, 0.42, '#fff4cf');
    lamp(-hx, s * (spec.W / 2 - 0.3), hz + 0.06, 0.36, '#c81e1e');
  });
  const grille = new THREE.BoxGeometry(0.05, spec.W * 0.5, 0.2);
  grille.translate(hx, 0, hz - 0.22);
  parts.push(paint(grille, '#15181c'));
  const sill = new THREE.BoxGeometry(spec.L * 0.94, spec.W + 0.02, 0.16);
  sill.translate(0, 0, 0.34);
  parts.push(paint(sill, '#1a1d22'));

  parts.forEach((g) => g.deleteAttribute('uv'));
  const details = mergeGeometries(parts.map((g) => (g.index ? g.toNonIndexed() : g)));
  parts.forEach((g) => g.dispose());
  return { body: bodyGeo, details, spec };
}

function shadowTexture() {
  const c = document.createElement('canvas');
  c.width = c.height = 128;
  const ctx = c.getContext('2d');
  const g = ctx.createRadialGradient(64, 64, 8, 64, 64, 62);
  g.addColorStop(0, 'rgba(0,0,0,0.55)');
  g.addColorStop(0.6, 'rgba(0,0,0,0.3)');
  g.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 128, 128);
  return new THREE.CanvasTexture(c);
}

/** Closed driving loop for a road centre-line: out on the left lane, U-turn, back on the other side, U-turn. */
function buildLoop(pts, lane) {
  const P = pts.map(([x, y]) => new THREE.Vector2(x, y));
  const n = P.length;
  const dirAt = (i) => {
    const a = P[Math.max(i - 1, 0)];
    const b = P[Math.min(i + 1, n - 1)];
    return b.clone().sub(a).normalize();
  };
  const left = (d) => new THREE.Vector2(-d.y, d.x);
  const out = [];
  const add = (v, slow) => out.push({ x: v.x, y: v.y, slow });
  for (let i = 0; i < n; i++) add(P[i].clone().add(left(dirAt(i)).multiplyScalar(lane)), false);
  const turn = (centre, u) => {
    const nrm = left(u);
    for (let k = 1; k < 10; k++) {
      const t = (k / 10) * Math.PI;
      add(centre.clone().add(nrm.clone().multiplyScalar(Math.cos(t) * lane)).add(u.clone().multiplyScalar(Math.sin(t) * lane)), true);
    }
  };
  turn(P[n - 1], dirAt(n - 1));
  for (let i = n - 1; i >= 0; i--) add(P[i].clone().sub(left(dirAt(i)).multiplyScalar(lane)), false);
  turn(P[0], dirAt(0).negate());
  // cumulative length, closed
  const seg = [];
  let total = 0;
  for (let i = 0; i < out.length; i++) {
    const a = out[i];
    const b = out[(i + 1) % out.length];
    const len = Math.hypot(b.x - a.x, b.y - a.y);
    seg.push(len);
    total += len;
  }
  return { pts: out, seg, total };
}

const PAINTS = ['#f4f5f6', '#f4f5f6', '#c9ced6', '#c9ced6', '#8b9199', '#23262b', '#9b1c1f', '#1f4e8c', '#6b4a35', '#e9e4d8'];

export function makeTraffic(data, liftMaterial, track) {
  const group = new THREE.Group();
  group.name = 'traffic';
  // The longest roads get traffic, wider ones more of it, about sixteen cars in all.
  const lengthOf = (pts) => pts.slice(1).reduce((t, p, i) => t + Math.hypot(p[0] - pts[i][0], p[1] - pts[i][1]), 0);
  const routes = [];
  let total = 0;
  for (const line of [...(data.centerlines || [])].filter((c) => c.pts?.length > 1 && c.w).sort((a, b) => lengthOf(b.pts) - lengthOf(a.pts))) {
    if (total >= 16 || lengthOf(line.pts) < 40) break;
    const count = line.w >= 80 ? 3 : line.w >= 40 ? 2 : 1;
    routes.push({ line, count });
    total += count;
  }

  const kinds = ['sedan', 'suv'].map((k) => buildCarGeometry(k));
  kinds.forEach((k) => {
    track(k.body);
    track(k.details);
  });
  const cars = [];
  routes.forEach((r, ri) => {
    const lane = Math.max((r.line.w / FT) * 0.22, 1.7);
    const loop = buildLoop(r.line.pts, lane);
    for (let k = 0; k < r.count; k++) {
      const kind = (ri + k) % 3 === 0 ? 1 : 0;
      cars.push({ loop, s: ((k + 0.37 * ri) / r.count) % 1, speed: r.line.w >= 80 ? 11 + k : 5.5 + ((ri * 7 + k * 3) % 4) * 0.7, kind, paint: PAINTS[(ri * 3 + k * 5) % PAINTS.length], heading: 0 });
    }
  });

  const meshes = kinds.map((k, ki) => {
    const count = cars.filter((c) => c.kind === ki).length;
    const body = new THREE.InstancedMesh(k.body, liftMaterial('#ffffff'), Math.max(count, 1));
    const details = new THREE.InstancedMesh(k.details, liftMaterial('#ffffff', { vertexColors: true, side: THREE.DoubleSide }), Math.max(count, 1));
    body.count = details.count = count;
    // moving cars use the blob shadow below: the sun's shadow map is only refreshed when the static scene changes
    body.frustumCulled = details.frustumCulled = false;
    group.add(body, details);
    return { body, details, n: 0 };
  });
  const tmp = new THREE.Color();
  cars.forEach((c) => {
    const m = meshes[c.kind];
    c.slot = m.n++;
    m.body.setColorAt(c.slot, tmp.set(c.paint));
  });
  meshes.forEach((m) => m.body.instanceColor && (m.body.instanceColor.needsUpdate = true));

  const shadowTex = track(shadowTexture());
  const shadowGeo = track(new THREE.PlaneGeometry(5.6, 2.9));
  const shadows = new THREE.InstancedMesh(shadowGeo, track(new THREE.MeshBasicMaterial({ map: shadowTex, transparent: true, depthWrite: false, opacity: 0.8 })), cars.length);
  shadows.frustumCulled = false;
  shadows.renderOrder = 2;
  group.add(shadows);

  const M = new THREE.Matrix4();
  const Q = new THREE.Quaternion();
  const Z = new THREE.Vector3(0, 0, 1);
  const one = new THREE.Vector3(1, 1, 1);
  const pos = new THREE.Vector3();

  function place(c) {
    const { pts, seg, total } = c.loop;
    let d = c.s * total;
    let i = 0;
    while (d > seg[i]) {
      d -= seg[i];
      i = (i + 1) % seg.length;
    }
    const a = pts[i];
    const b = pts[(i + 1) % pts.length];
    const t = seg[i] ? d / seg[i] : 0;
    const target = Math.atan2(b.y - a.y, b.x - a.x);
    // ease the yaw so corners and U-turns do not snap
    let diff = target - c.heading;
    diff = Math.atan2(Math.sin(diff), Math.cos(diff));
    c.heading += diff * 0.28;
    c.slow = a.slow || b.slow;
    pos.set(a.x + (b.x - a.x) * t, a.y + (b.y - a.y) * t, 0.12);
    Q.setFromAxisAngle(Z, c.heading);
    M.compose(pos, Q, one);
    const m = meshes[c.kind];
    m.body.setMatrixAt(c.slot, M);
    m.details.setMatrixAt(c.slot, M);
    pos.z = 0.125;
    M.compose(pos, Q, one);
    shadows.setMatrixAt(cars.indexOf(c), M);
  }

  cars.forEach((c) => {
    place(c);
    const { pts } = c.loop;
    c.heading = Math.atan2(pts[1].y - pts[0].y, pts[1].x - pts[0].x);
    place(c);
  });

  function update(dt) {
    for (const c of cars) {
      c.s = (c.s + ((c.slow ? c.speed * 0.4 : c.speed) * dt) / c.loop.total) % 1;
      place(c);
    }
    meshes.forEach((m) => {
      m.body.instanceMatrix.needsUpdate = true;
      m.details.instanceMatrix.needsUpdate = true;
    });
    shadows.instanceMatrix.needsUpdate = true;
  }
  update(0);

  return { group, update, carGeometry: kinds };
}
