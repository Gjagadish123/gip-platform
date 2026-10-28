// Projected ground shadows.
//
// Real shadow maps were tried first: they rendered correctly on a private canvas but never showed up inside
// Google's WebGLOverlayView, and a 4096 px depth pass in Google's GL context is a lot to ask of a phone.
// So shadows are geometry instead: every box or tree gets one flat polygon, the convex hull of its footprint and
// of its top projected along the sun direction. The projection is scaled by the same lift uniform that raises the
// buildings, so shadows grow out of the objects as the plan turns 3D and vanish again in plan view.
// Identical in both renderers, one draw call, no render targets.

import * as THREE from 'three';

/** sun from the west-south-west, 38 degrees up: shadows run east-north-east, 1.28 x the height */
export const SUN = (() => {
  const az = THREE.MathUtils.degToRad(252); // compass bearing the light comes FROM
  const el = THREE.MathUtils.degToRad(38);
  const from = new THREE.Vector3(Math.sin(az) * Math.cos(el), Math.cos(az) * Math.cos(el), Math.sin(el));
  const reach = 1 / Math.tan(el);
  return { from, ground: new THREE.Vector2(-from.x, -from.y).normalize(), reach, el };
})();

function hull(points) {
  // Andrew's monotone chain; points = [{x, y, ...}]
  const p = [...points].sort((a, b) => a.x - b.x || a.y - b.y);
  const cross = (o, a, b) => (a.x - o.x) * (b.y - o.y) - (a.y - o.y) * (b.x - o.x);
  const lower = [];
  for (const q of p) {
    while (lower.length >= 2 && cross(lower[lower.length - 2], lower[lower.length - 1], q) <= 0) lower.pop();
    lower.push(q);
  }
  const upper = [];
  for (const q of p.reverse()) {
    while (upper.length >= 2 && cross(upper[upper.length - 2], upper[upper.length - 1], q) <= 0) upper.pop();
    upper.push(q);
  }
  return lower.slice(0, -1).concat(upper.slice(0, -1));
}

export function makeGroundShadows(uniforms, slabHeight) {
  const pos = [];
  const off = [];
  const high = [];

  /** corners: [[x, y, heightAboveGround]], all belonging to one solid. `onPlot` puts the shadow above the plot slabs. */
  function addSolid(corners, onPlot) {
    const pts = [];
    for (const [x, y, h] of corners) {
      pts.push({ x, y, bx: x, by: y, ox: 0, oy: 0 });
      const ox = SUN.ground.x * h * SUN.reach;
      const oy = SUN.ground.y * h * SUN.reach;
      pts.push({ x: x + ox, y: y + oy, bx: x, by: y, ox, oy });
    }
    const ring = hull(pts);
    if (ring.length < 3) return;
    const cx = corners.reduce((t, c) => t + c[0], 0) / corners.length;
    const cy = corners.reduce((t, c) => t + c[1], 0) / corners.length;
    for (let i = 0; i < ring.length; i++) {
      const a = ring[i];
      const b = ring[(i + 1) % ring.length];
      pos.push(cx, cy, 0, a.bx, a.by, 0, b.bx, b.by, 0);
      off.push(0, 0, a.ox, a.oy, b.ox, b.oy);
      high.push(onPlot ? 1 : 0, onPlot ? 1 : 0, onPlot ? 1 : 0);
    }
  }

  /** an upright box given in a local frame: centre, yaw, size along/across, base and top heights */
  function addBox({ x, y, yaw = 0, w, d, top, onPlot = false }) {
    const c = Math.cos(yaw);
    const s = Math.sin(yaw);
    const corners = [[-1, -1], [1, -1], [1, 1], [-1, 1]].map(([i, j]) => [x + (i * w * c - j * d * s) / 2, y + (i * w * s + j * d * c) / 2, top]);
    addSolid(corners, onPlot);
  }

  /** a tree crown: a sphere of radius r whose centre is `h` up casts an ellipse stretched along the sun direction */
  function addTree({ x, y, r, h, onPlot = false }) {
    const n = 10;
    const g = SUN.ground;
    const stretch = 1 / Math.sin(SUN.el) - 1;
    const ring = [];
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2;
      const px = Math.cos(a) * r;
      const py = Math.sin(a) * r;
      const along = px * g.x + py * g.y;
      ring.push({ bx: x + px, by: y + py, ox: g.x * (h * SUN.reach + along * stretch), oy: g.y * (h * SUN.reach + along * stretch) });
    }
    for (let i = 0; i < n; i++) {
      const a = ring[i];
      const b = ring[(i + 1) % n];
      pos.push(x, y, 0, a.bx, a.by, 0, b.bx, b.by, 0);
      off.push(g.x * h * SUN.reach, g.y * h * SUN.reach, a.ox, a.oy, b.ox, b.oy);
      high.push(onPlot ? 1 : 0, onPlot ? 1 : 0, onPlot ? 1 : 0);
    }
  }

  function build() {
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    geo.setAttribute('aOff', new THREE.Float32BufferAttribute(off, 2));
    geo.setAttribute('aHigh', new THREE.Float32BufferAttribute(high, 1));
    const mat = new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      side: THREE.DoubleSide,
      // Google's overlay shares the map's depth buffer, whose precision at site distances is coarser than the few
      // centimetres between a shadow and the surface under it. Without the offset the shadows lose the depth test.
      polygonOffset: true,
      polygonOffsetFactor: -2,
      polygonOffsetUnits: -60,
      uniforms: { uLift: uniforms.uLift, uReveal: uniforms.uReveal, uSlab: { value: slabHeight } },
      vertexShader: /* glsl */ `
        attribute vec2 aOff; attribute float aHigh;
        uniform float uLift, uReveal, uSlab;
        varying float vK;
        void main() {
          vK = uLift * smoothstep(0.55, 1.0, uReveal);
          float plotTop = 0.1 + uSlab * mix(0.08, 1.0, uLift) + 0.2;   // just above the lawns on a raised plot
          vec3 p = vec3(position.xy + aOff * vK, mix(0.22, plotTop, aHigh));
          gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
        }`,
      fragmentShader: /* glsl */ `
        varying float vK;
        void main() { gl_FragColor = vec4(0.02, 0.05, 0.10, 0.34 * smoothstep(0.05, 0.6, vK)); }`,
    });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.name = 'ground-shadows';
    mesh.frustumCulled = false;
    mesh.renderOrder = 4.5; // after the plot slabs, before outlines and labels
    return mesh;
  }

  return { addBox, addSolid, addTree, build, uniforms, slabHeight };
}
