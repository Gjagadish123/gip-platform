// Sample villas for sold plots: a modern two-storey house in the spirit of the villa elevations printed on the
// brochure (stacked white volumes, dark slab bands, timber or stone feature wall, glazed balcony), set back from
// the road behind a compound wall, with a lawn, paved drive, car port, roof tank and solar panels.
// Every part is an instanced unit box (or cylinder), so 39 villas cost about a dozen draw calls.

import * as THREE from 'three';
import { makeGroundShadows } from './shadows.js';

const PALETTE = {
  wall: '#f3eee4',
  wallUpper: '#fbfaf6',
  band: '#2b3038',
  timber: '#8a5b3a',
  stone: '#7b7f86',
  glass: '#22303d',
  rail: '#a9cbe0',
  door: '#6a4329',
  paver: '#bdb6a8',
  lawn: '#69a858',
  compound: '#e7e1d5',
  gate: '#30353d',
  solar: '#1c2f52',
  tank: '#17191c',
  hedge: '#3f8a4a',
};

export function makeVillas(plots, slabTop, liftMaterial, track, siteShadows) {
  const group = new THREE.Group();
  group.name = 'villas';

  const unitBox = track(new THREE.BoxGeometry(1, 1, 1));
  unitBox.translate(0, 0, 0.5); // sits on z = 0, grows upward
  const unitCyl = track(new THREE.CylinderGeometry(0.5, 0.5, 1, 14));
  unitCyl.rotateX(Math.PI / 2);
  unitCyl.translate(0, 0, 0.5);

  // villa shadows live in their own mesh so they disappear with the 'sample villas' toggle
  const shadows = makeGroundShadows(siteShadows.uniforms, siteShadows.slabHeight);
  const bins = {}; // material key -> list of matrices
  const M = new THREE.Matrix4();
  const Q = new THREE.Quaternion();
  const Z = new THREE.Vector3(0, 0, 1);

  plots.forEach((p, vi) => {
    // plot frame: f points at the road, r is to the right when you stand on the plot looking at the road
    const f = new THREE.Vector2(p.fn ? p.fn[0] : Math.cos(p.la), p.fn ? p.fn[1] : Math.sin(p.la)).normalize();
    const r = new THREE.Vector2(f.y, -f.x);
    let minF = Infinity;
    let maxF = -Infinity;
    let minR = Infinity;
    let maxR = -Infinity;
    for (const [x, y] of p.xy) {
      const df = (x - p.c[0]) * f.x + (y - p.c[1]) * f.y;
      const dr = (x - p.c[0]) * r.x + (y - p.c[1]) * r.y;
      minF = Math.min(minF, df);
      maxF = Math.max(maxF, df);
      minR = Math.min(minR, dr);
      maxR = Math.max(maxR, dr);
    }
    const depth = maxF - minF;
    const width = maxR - minR;
    if (depth < 9 || width < 6.5) return; // too small or odd for a believable house
    const yaw = Math.atan2(f.y, f.x); // local +x points at the road
    Q.setFromAxisAngle(Z, yaw);
    const mirror = p.n % 2 ? 1 : -1;
    const accent = p.n % 3 === 0 ? 'stone' : 'timber';

    // local (a along f from plot centre, b along r) -> world
    const put = (key, a, b, z, sa, sb, sz, geo = 'box') => {
      const wx = p.c[0] + f.x * a + r.x * b;
      const wy = p.c[1] + f.y * a + r.y * b;
      M.compose(new THREE.Vector3(wx, wy, z), Q, new THREE.Vector3(sa, sb, sz));
      (bins[`${key}|${geo}`] ||= []).push(M.clone());
    };

    const front = maxF; // road edge
    const back = minF;
    const midR = (minR + maxR) / 2;
    const inset = 1.0; // status colour stays visible as a band round the garden
    const z0 = slabTop + 0.02;

    // garden and drive
    put('lawn', (front + back) / 2, midR, z0, depth - inset * 2, width - inset * 2, 0.05);
    const houseD = Math.min(depth * 0.46, 13.5);
    const houseW = Math.min(width - 2.6, 11);
    const setback = Math.max(depth * 0.2, 3.2);
    const hx = front - inset - setback - houseD / 2; // house centre along f
    const driveW = Math.min(3.4, houseW * 0.42);
    const driveB = midR + mirror * (houseW / 2 - driveW / 2);
    put('paver', front - inset - setback / 2, driveB, z0 + 0.04, setback + 0.4, driveW, 0.05);
    put('paver', front - inset - 0.9, midR - mirror * (houseW * 0.18), z0 + 0.04, 1.5, 1.3, 0.05);

    // compound wall with a gate gap in front of the drive
    const wallH = 1.35;
    const t = 0.18;
    const wa = depth - 0.5;
    const wb = width - 0.5;
    put('compound', back + 0.25, midR, z0, t, wb, wallH);
    put('compound', (front + back) / 2, minR + 0.25, z0, wa, t, wallH);
    put('compound', (front + back) / 2, maxR - 0.25, z0, wa, t, wallH);
    const gapLo = driveB - driveW / 2;
    const gapHi = driveB + driveW / 2;
    const segA = gapLo - (minR + 0.25);
    const segB = maxR - 0.25 - gapHi;
    if (segA > 0.4) put('compound', front - 0.25, minR + 0.25 + segA / 2, z0, t, segA, wallH);
    if (segB > 0.4) put('compound', front - 0.25, gapHi + segB / 2, z0, t, segB, wallH);
    put('gate', front - 0.25, driveB, z0, 0.08, driveW, 1.2);

    // house volumes
    const g = z0 + 0.05;
    const H1 = 3.25;
    const H2 = 3.05;
    put('wall', hx, midR, g, houseD, houseW, H1);
    put('band', hx, midR, g + H1, houseD + 0.5, houseW + 0.5, 0.2);
    const upD = houseD * 0.8;
    const upW = houseW * 0.74;
    const upA = hx - houseD * 0.08;
    const upB = midR - mirror * (houseW - upW) * 0.5;
    put('wallUpper', upA, upB, g + H1 + 0.2, upD, upW, H2);
    put('band', upA, upB, g + H1 + 0.2 + H2, upD + 0.7, upW + 0.7, 0.22);
    put('wallUpper', upA, upB, g + H1 + H2 + 0.42, upD + 0.2, upW + 0.2, 0.45); // parapet
    // feature wall rising through both floors beside the entrance
    put(accent, hx + houseD / 2 - 0.45, midR - mirror * (houseW * 0.2), g, 1.2, houseW * 0.2, H1 + H2 + 0.5);

    // car port over the drive
    const portA = hx + houseD / 2 + 1.7;
    put('band', portA, driveB, g + 2.55, 3.6, driveW + 0.5, 0.16);
    put('band', portA + 1.55, driveB - driveW / 2, g, 0.16, 0.16, 2.55);
    put('band', portA + 1.55, driveB + driveW / 2, g, 0.16, 0.16, 2.55);

    // glazing on the road side: living-room window, door, first-floor sliders behind a glass balcony
    const face = hx + houseD / 2 + 0.03;
    put('glass', face, midR - mirror * houseW * 0.02, g + 0.75, 0.08, houseW * 0.3, 1.9);
    put('door', face, midR - mirror * houseW * 0.34, g + 0.05, 0.1, 1.15, 2.25);
    const upFace = upA + upD / 2 + 0.03;
    put('glass', upFace, upB, g + H1 + 0.55, 0.08, upW * 0.62, 2.05);
    put('band', upFace + 0.75, upB, g + H1 + 0.2, 1.5, upW * 0.7, 0.14);
    put('rail', upFace + 1.47, upB, g + H1 + 0.34, 0.05, upW * 0.7, 1.0);
    put('rail', upFace + 0.75, upB - upW * 0.35, g + H1 + 0.34, 1.5, 0.05, 1.0);
    put('rail', upFace + 0.75, upB + upW * 0.35, g + H1 + 0.34, 1.5, 0.05, 1.0);
    // side and rear windows
    for (const s of [-1, 1]) {
      put('glass', hx - houseD * 0.12, midR + s * (houseW / 2 + 0.03), g + 1.0, houseD * 0.26, 0.08, 1.4);
      put('glass', upA + upD * 0.1, upB + s * (upW / 2 + 0.03), g + H1 + 1.1, upD * 0.24, 0.08, 1.3);
    }
    put('glass', hx - houseD / 2 - 0.03, midR, g + 1.0, 0.08, houseW * 0.34, 1.4);

    // roof: black water tank on a stand and two rows of solar panels
    const roofZ = g + H1 + H2 + 0.87;
    put('band', upA - upD * 0.28, upB - mirror * upW * 0.26, roofZ, 1.3, 1.3, 0.6);
    put('tank', upA - upD * 0.28, upB - mirror * upW * 0.26, roofZ + 0.6, 1.15, 1.15, 1.2, 'cyl');
    put('solar', upA + upD * 0.12, upB + mirror * upW * 0.12, roofZ + 0.12, upD * 0.34, upW * 0.5, 0.1);
    // terrace over the ground-floor part that is not covered by the first floor
    put('hedge', hx + houseD * 0.3, midR + mirror * (houseW / 2 - 0.5), g + H1 + 0.2, houseD * 0.3, 0.5, 0.5);

    // one shadow per house: the hull of the ground floor, the first floor, the feature wall and the car port.
    // Heights are measured from the lawn, which is what the shadow falls on.
    const W = (a, b, top) => [p.c[0] + f.x * a + r.x * b, p.c[1] + f.y * a + r.y * b, top];
    const boxPts = (ca, cb, da, db, top) => [[-1, -1], [1, -1], [1, 1], [-1, 1]].map(([i, j]) => W(ca + (i * da) / 2, cb + (j * db) / 2, top));
    shadows.addSolid(
      [
        ...boxPts(hx, midR, houseD + 0.5, houseW + 0.5, H1 + 0.2),
        ...boxPts(upA, upB, upD + 0.7, upW + 0.7, H1 + H2 + 0.9),
        ...boxPts(portA, driveB, 3.6, driveW + 0.5, 2.7),
      ],
      true
    );

    // a clipped hedge along the front wall
    if (segA > 1.2) put('hedge', front - 0.95, minR + 0.25 + segA / 2, z0 + 0.05, 0.7, segA - 0.5, 0.75);
    if (segB > 1.2) put('hedge', front - 0.95, gapHi + segB / 2, z0 + 0.05, 0.7, segB - 0.5, 0.75);

    p._villa = { driveA: front - inset - setback * 0.45, driveB, yaw, f, r, vi };
  });

  const meshes = [];
  for (const [k, mats] of Object.entries(bins)) {
    const [key, geo] = k.split('|');
    const flat = key === 'lawn' || key === 'paver';
    const mesh = new THREE.InstancedMesh(geo === 'cyl' ? unitCyl : unitBox, liftMaterial(PALETTE[key], {}, flat ? 1 : undefined), mats.length);
    mats.forEach((m, i) => mesh.setMatrixAt(i, m));
    mesh.frustumCulled = false;
    mesh.userData.flat = flat;
    group.add(mesh);
    meshes.push(mesh);
  }
  return { group, meshes, shadows, parked: plots.filter((p) => p._villa).map((p) => p._villa) };
}
