// Builds a whole layout as one THREE.Group in local ENU metres
// (x east, y north, z up). The same group is mounted either inside Google's
// WebGLOverlayView (real satellite ground) or in the standalone fallback renderer.
//
// Per-plot state (reveal, lift, hover, selection) lives in shader uniforms plus a
// small colour buffer, so 288 plots + labels stay at a handful of draw calls and
// state changes never rebuild geometry.

import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { makeTraffic } from './cars.js';
import { makeVillas } from './villas.js';
import { makeAmenities } from './amenities.js';
import { makeGroundShadows, SUN } from './shadows.js';
import { STATUS_COLOR, VILLA_STATUSES } from '../lib/plots.js';

export { STATUS_COLOR };
const DIM_COLOR = new THREE.Color('#b9c3d1');
const SLAB_H = 0.45; // metres; plots are land, not buildings, so they only rise a little
const FT = 3.28084;

const shapeFrom = (outer, holes = []) => {
  const s = new THREE.Shape(outer.map(([x, y]) => new THREE.Vector2(x, y)));
  holes.forEach((h) => s.holes.push(new THREE.Path(h.map(([x, y]) => new THREE.Vector2(x, y)))));
  return s;
};

function insetRing(ring, d) {
  // inward offset of a (near) convex CCW ring by d metres using angle bisectors
  const n = ring.length;
  const cx = ring.reduce((s, p) => s + p[0], 0) / n;
  const cy = ring.reduce((s, p) => s + p[1], 0) / n;
  const out = [];
  for (let i = 0; i < n; i++) {
    const p0 = ring[(i - 1 + n) % n];
    const p1 = ring[i];
    const p2 = ring[(i + 1) % n];
    const nrm = (a, b) => {
      let nx = b[1] - a[1];
      let ny = -(b[0] - a[0]);
      const l = Math.hypot(nx, ny) || 1;
      nx /= l;
      ny /= l;
      if (nx * (cx - a[0]) + ny * (cy - a[1]) < 0) {
        nx = -nx;
        ny = -ny;
      }
      return [nx, ny];
    };
    const n1 = nrm(p0, p1);
    const n2 = nrm(p1, p2);
    let bx = n1[0] + n2[0];
    let by = n1[1] + n2[1];
    const bl = Math.hypot(bx, by) || 1;
    bx /= bl;
    by /= bl;
    const k = d / Math.max(bx * n1[0] + by * n1[1], 0.35);
    out.push([p1[0] + bx * k, p1[1] + by * k]);
  }
  return out;
}

/** Shared uniforms: every material that must follow the plot animation reads these. */
function makeUniforms() {
  return {
    uReveal: { value: 0 },
    uLift: { value: 0 },
    uSel: { value: -1 },
    uHover: { value: -1 },
    uTime: { value: 0 },
    uLabelFade: { value: 1 },
    uAreaFade: { value: 1 },
  };
}

const PLOT_VERT_PARS = /* glsl */ `
  attribute float aPlot;
  attribute vec2 aCenter;
  attribute float aDelay;
  uniform float uReveal, uLift, uSel, uHover, uTime;
  varying float vHi;
  float plotPop(float delay) {
    float r = clamp((uReveal - delay * 0.78) / 0.22, 0.0, 1.0);
    return 1.0 - pow(1.0 - r, 3.0);
  }
  float plotRise(float plot) {
    float sel = 1.0 - step(0.5, abs(plot - uSel));
    float hov = 1.0 - step(0.5, abs(plot - uHover));
    return 1.0 + sel * (3.2 + 0.35 * sin(uTime * 3.0)) + hov * 1.1;
  }
`;
const PLOT_VERT_BODY = /* glsl */ `
  float pop = plotPop(aDelay);
  float selF = 1.0 - step(0.5, abs(aPlot - uSel));
  float hovF = 1.0 - step(0.5, abs(aPlot - uHover));
  vHi = max(selF, hovF * 0.55);
  transformed.xy = aCenter + (transformed.xy - aCenter) * pop;
  transformed.z = transformed.z * mix(0.08, 1.0, uLift) * pop * plotRise(aPlot);
`;

function patchPlotMaterial(mat, uniforms, { highlight = true } = {}) {
  mat.onBeforeCompile = (shader) => {
    Object.assign(shader.uniforms, uniforms);
    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', `#include <common>\n${PLOT_VERT_PARS}`)
      .replace('#include <begin_vertex>', `#include <begin_vertex>\n${PLOT_VERT_BODY}`);
    if (highlight) {
      shader.fragmentShader = shader.fragmentShader
        .replace('#include <common>', '#include <common>\nvarying float vHi;')
        .replace(
          '#include <color_fragment>',
          '#include <color_fragment>\n diffuseColor.rgb = mix(diffuseColor.rgb, vec3(1.0, 0.84, 0.32), vHi * 0.6);\n diffuseColor.a = mix(diffuseColor.a, 1.0, vHi);'
        );
    } else {
      shader.fragmentShader = shader.fragmentShader.replace('#include <common>', '#include <common>\nvarying float vHi;');
    }
  };
  return mat;
}

/** Things that stand up (trees, villas, gate...) flatten in plan view and grow in 3D. */
export function patchLiftMaterial(mat, uniforms, flat = 0.04) {
  mat.onBeforeCompile = (shader) => {
    shader.uniforms.uLift = uniforms.uLift;
    shader.uniforms.uReveal = uniforms.uReveal;
    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', '#include <common>\nuniform float uLift, uReveal;')
      .replace(
        '#include <begin_vertex>',
        `#include <begin_vertex>\n transformed.z *= mix(${flat.toFixed(3)}, 1.0, uLift) * smoothstep(0.55, 1.0, uReveal);`
      );
  };
  // one program per flat factor, otherwise three would reuse the first compiled variant
  mat.customProgramCacheKey = () => `lift-${flat}`;
  return mat;
}

// ---------------------------------------------------------------- labels
const GLYPHS = '0123456789.';
function buildGlyphAtlas() {
  const cell = { w: 72, h: 112 };
  const c = document.createElement('canvas');
  c.width = 1024;
  c.height = 128;
  const ctx = c.getContext('2d');
  ctx.clearRect(0, 0, c.width, c.height);
  // the stretch keyword inside the shorthand is understood by every browser; ctx.fontStretch is not
  ctx.font = '800 extra-condensed 96px Archivo, "Arial Narrow", Arial, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.lineJoin = 'round';
  for (let i = 0; i < GLYPHS.length; i++) {
    const x = i * cell.w + cell.w / 2;
    ctx.lineWidth = 14;
    ctx.strokeStyle = 'rgba(1, 20, 42, 0.9)';
    ctx.strokeText(GLYPHS[i], x, 66);
    ctx.fillStyle = '#ffffff';
    ctx.fillText(GLYPHS[i], x, 66);
  }
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  tex.generateMipmaps = true;
  tex.minFilter = THREE.LinearMipmapLinearFilter;
  // how far one digit really advances, as a fraction of the glyph height, for whichever font actually rendered
  const adv = Math.min(Math.max(ctx.measureText('0').width / 96 + 0.035, 0.36), 0.6);
  return { tex, cell, size: { w: c.width, h: c.height }, adv };
}

function buildLabels(plots, uniforms, delays) {
  const atlas = buildGlyphAtlas();
  const base = new THREE.PlaneGeometry(1, 1);
  const geo = new THREE.InstancedBufferGeometry();
  geo.index = base.index;
  geo.setAttribute('position', base.attributes.position);
  geo.setAttribute('uv', base.attributes.uv);

  const iPos = [];
  const iRot = [];
  const iSize = [];
  const iUV = [];
  const iPlot = [];
  const iDelay = [];
  const iKind = [];

  plots.forEach((p, idx) => {
    // local frame: u along the label direction, v across it
    const ca = Math.cos(p.la);
    const sa = Math.sin(p.la);
    let minU = Infinity;
    let maxU = -Infinity;
    let minV = Infinity;
    let maxV = -Infinity;
    for (const [x, y] of p.xy) {
      const u = (x - p.c[0]) * ca + (y - p.c[1]) * sa;
      const v = -(x - p.c[0]) * sa + (y - p.c[1]) * ca;
      minU = Math.min(minU, u);
      maxU = Math.max(maxU, u);
      minV = Math.min(minV, v);
      maxV = Math.max(maxV, v);
    }
    const spanU = maxU - minU;
    const spanV = maxV - minV;
    const num = String(p.n);
    const area = Number.isInteger(p.a) ? String(p.a) : p.a.toFixed(2);
    // the condensed digits fill ~55% of their atlas cell, so they advance less than the quad is wide
    const ADV = atlas.adv;
    const numH = Math.min(spanV * 0.46, (spanU * 0.78) / (num.length * ADV), 4.4);
    const areaH = Math.min(numH * 0.55, (spanU * 0.78) / (area.length * ADV));
    const place = (text, h, vOff, kind) => {
      const adv = (ch) => h * (ch === '.' ? ADV * 0.55 : ADV);
      const total = [...text].reduce((t, ch) => t + adv(ch), 0);
      let cursor = -total / 2;
      for (let k = 0; k < text.length; k++) {
        const gi = GLYPHS.indexOf(text[k]);
        const a = adv(text[k]);
        const u = cursor + a / 2;
        cursor += a;
        if (gi < 0) continue;
        iPos.push(p.c[0] + u * ca - vOff * sa, p.c[1] + u * sa + vOff * ca, 0);
        iRot.push(p.la);
        iSize.push(h * 0.643 * 1.16, h * 1.16);
        iUV.push((gi * atlas.cell.w) / atlas.size.w, 1 - atlas.cell.h / atlas.size.h, atlas.cell.w / atlas.size.w, atlas.cell.h / atlas.size.h);
        iPlot.push(idx);
        iDelay.push(delays[idx]);
        iKind.push(kind);
      }
    };
    place(num, numH, numH * 0.34, 0);
    place(area, areaH, -areaH * 0.78, 1);
  });

  const inst = (arr, size) => new THREE.InstancedBufferAttribute(new Float32Array(arr), size);
  geo.setAttribute('iPos', inst(iPos, 3));
  geo.setAttribute('iRot', inst(iRot, 1));
  geo.setAttribute('iSize', inst(iSize, 2));
  geo.setAttribute('iUV', inst(iUV, 4));
  geo.setAttribute('iPlot', inst(iPlot, 1));
  geo.setAttribute('iDelay', inst(iDelay, 1));
  geo.setAttribute('iKind', inst(iKind, 1));
  geo.instanceCount = iPlot.length;

  const mat = new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    uniforms: { ...uniforms, uAtlas: { value: atlas.tex }, uSlab: { value: SLAB_H } },
    vertexShader: /* glsl */ `
      attribute vec3 iPos; attribute float iRot; attribute vec2 iSize; attribute vec4 iUV;
      attribute float iPlot, iDelay, iKind;
      uniform float uReveal, uLift, uSel, uHover, uTime, uSlab, uLabelFade, uAreaFade;
      varying vec2 vUv; varying float vAlpha;
      void main() {
        float r = clamp((uReveal - iDelay * 0.78) / 0.22, 0.0, 1.0);
        float pop = 1.0 - pow(1.0 - r, 3.0);
        float sel = 1.0 - step(0.5, abs(iPlot - uSel));
        float hov = 1.0 - step(0.5, abs(iPlot - uHover));
        float rise = 1.0 + sel * (3.2 + 0.35 * sin(uTime * 3.0)) + hov * 1.1;
        float c = cos(iRot), s = sin(iRot);
        vec2 q = position.xy * iSize;
        vec3 p = vec3(iPos.x + q.x * c - q.y * s, iPos.y + q.x * s + q.y * c, uSlab * mix(0.08, 1.0, uLift) * pop * rise + 0.06);
        vUv = iUV.xy + uv * iUV.zw;
        vAlpha = smoothstep(0.85, 1.0, pop) * mix(uLabelFade, min(uLabelFade, uAreaFade), iKind);
        gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
      }`,
    fragmentShader: /* glsl */ `
      uniform sampler2D uAtlas; varying vec2 vUv; varying float vAlpha;
      void main() {
        vec4 t = texture2D(uAtlas, vUv);
        if (t.a * vAlpha < 0.02) discard;
        gl_FragColor = vec4(t.rgb, t.a * vAlpha);
      }`,
  });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.frustumCulled = false;
  mesh.renderOrder = 6;
  return mesh;
}

// ---------------------------------------------------------------- helpers for built objects
function textPlane(text, { w, h, bg = '#033967', fg = '#ffffff', font = '700 86px Archivo, Arial, sans-serif', stretch = 'semi-expanded' }) {
  const c = document.createElement('canvas');
  c.width = 1024;
  c.height = Math.round((1024 * h) / w);
  const ctx = c.getContext('2d');
  if (bg) {
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, c.width, c.height);
  }
  ctx.fillStyle = fg;
  ctx.font = font;
  if ('fontStretch' in ctx) ctx.fontStretch = stretch;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, c.width / 2, c.height / 2 + 4);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  return new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ map: tex, transparent: !bg, side: THREE.DoubleSide }));
}

// ---------------------------------------------------------------- main
/** Frees every GPU resource under `root` (geometries, materials, their textures, instance buffers). */
export function disposeTree(root) {
  root.traverse((o) => {
    o.geometry?.dispose();
    for (const m of [].concat(o.material || [])) {
      m.map?.dispose();
      for (const u of Object.values(m.uniforms || {})) if (u?.value?.isTexture) u.value.dispose();
      m.dispose();
    }
    if (o.isInstancedMesh) o.dispose();
  });
}

/**
 * data: the project's masterplan (plot numbers as strings). brand: {name, logo} for the entrance arch.
 * Plots start without a status (light grey) until paint() gets the live ones.
 */
export function buildSite(data, { brand = {} } = {}) {
  const uniforms = makeUniforms();
  const group = new THREE.Group();
  group.name = 'site';
  const disposables = [];
  const track = (o) => {
    disposables.push(o);
    return o;
  };

  const lambert = (color, opts = {}) => track(new THREE.MeshLambertMaterial({ color, ...opts }));
  const liftLambert = (color, opts = {}) => patchLiftMaterial(lambert(color, opts), uniforms);
  const features = data.features || {};
  const ext = data.extent;

  const shadows = makeGroundShadows(uniforms, SLAB_H);

  // ---- reveal order: the layout unfurls outward from features.revealFrom, else the entrance gate, else its centre
  // revealFrom is [x, y] or {at: [x, y]} (careful: an array's .at is Array.prototype.at)
  const rf = features.revealFrom;
  const from = (Array.isArray(rf) ? rf : rf?.at) || features.gate?.at || [(ext.minX + ext.maxX) / 2, (ext.minY + ext.maxY) / 2];
  const dist = data.plots.map((p) => Math.hypot(p.c[0] - from[0], p.c[1] - from[1]));
  const dMax = Math.max(...dist, 1);
  const delays = dist.map((d) => d / dMax);

  // ---- site pad + roads + greens (flat, painted just above ground)
  const flat = (polys, color, z, opts = {}) => {
    const geos = polys.map((p) => new THREE.ShapeGeometry(shapeFrom(p.outer || p, p.holes || [])));
    const g = track(geos.length ? mergeGeometries(geos) : new THREE.BufferGeometry());
    geos.forEach((x) => x.dispose());
    const m = new THREE.Mesh(g, lambert(color, opts));
    m.position.z = z;
    return m;
  };
  const outline = data.boundary || [[ext.minX, ext.minY], [ext.maxX, ext.minY], [ext.maxX, ext.maxY], [ext.minX, ext.maxY]];
  const pad = flat([outline], '#e6ebe1', 0.02, { transparent: true, opacity: 0.0 });
  pad.name = 'pad';
  group.add(pad);
  if (data.road100?.length) group.add(flat(data.road100, '#4b525c', 0.05, { transparent: true, opacity: 0.92 }));
  if (data.roads?.length) group.add(flat(data.roads, '#3b424c', 0.08, { transparent: true, opacity: 0.96 }));
  if (data.greens?.length) group.add(flat(data.greens, '#3c8a4e', 0.06, { transparent: true, opacity: 0.9 }));
  const zoneTint = (id, z) =>
    ({ clubhouse: '#cfc6b0', utility: '#b9c0c9', social: '#9ccf8f', park_west: '#86c27d', park_east: '#8cc084' })[id] ||
    (/club/i.test(z.name) ? '#cfc6b0' : /utility|transformer|stp|oht|septic/i.test(z.name) ? '#b9c0c9' : /park|garden|green/i.test(z.name) ? '#86c27d' : /social/i.test(z.name) ? '#9ccf8f' : '#d6d1c4');
  Object.entries(data.zones || {}).forEach(([id, z]) => {
    if (z?.xy?.length > 2) group.add(flat([z.xy], zoneTint(id, z), 0.07, { transparent: true, opacity: 0.94 }));
  });

  const centerlines = data.centerlines || [];
  // ---- road centre dashes
  {
    const dashGeos = [];
    const dash = (a, b, width, len = 2.6, gap = 4.4) => {
      const L = Math.hypot(b[0] - a[0], b[1] - a[1]);
      const ux = (b[0] - a[0]) / L;
      const uy = (b[1] - a[1]) / L;
      const ang = Math.atan2(uy, ux);
      for (let s = 3; s < L - 3; s += len + gap) {
        const g = new THREE.PlaneGeometry(len, width);
        g.rotateZ(ang);
        g.translate(a[0] + ux * (s + len / 2), a[1] + uy * (s + len / 2), 0.11);
        dashGeos.push(g);
      }
    };
    centerlines.forEach((c) => {
      for (let i = 0; i < c.pts.length - 1; i++) dash(c.pts[i], c.pts[i + 1], c.w >= 80 ? 0.32 : 0.2);
    });
    if (dashGeos.length) {
      const g = track(mergeGeometries(dashGeos));
      dashGeos.forEach((x) => x.dispose());
      group.add(new THREE.Mesh(g, track(new THREE.MeshBasicMaterial({ color: '#f3d27a', transparent: true, opacity: 0.85 }))));
    }
  }

  // ---- road width labels, painted on the carriageway like the approved layout sheet
  centerlines.forEach((c) => {
    const a = c.pts[0];
    const b = c.pts[c.pts.length > 2 ? 3 : 1] || c.pts[1];
    const a2 = c.pts.length > 2 ? c.pts[2] : a;
    const L = Math.hypot(b[0] - a2[0], b[1] - a2[1]);
    if (L < 70 && c.id !== 'E1' && c.id !== 'E3') return;
    const label = c.label || (c.id === 'R100' ? "100' ROAD (PROPOSED)" : `${c.w}' WIDE ROAD`);
    const h = Math.min((c.w / FT) * 0.34, 3.2);
    const m = textPlane(label, { w: h * 9.5, h: h * 1.25, bg: null, fg: 'rgba(255,255,255,0.78)', font: '700 84px Archivo, Arial, sans-serif', stretch: 'expanded' });
    let ang = Math.atan2(b[1] - a2[1], b[0] - a2[0]);
    if (ang > Math.PI / 2 || ang <= -Math.PI / 2) ang += Math.PI;
    m.rotation.z = ang;
    m.position.set((a2[0] + b[0]) / 2, (a2[1] + b[1]) / 2, 0.13);
    m.material.depthWrite = false;
    m.renderOrder = 3;
    group.add(m);
  });

  // ---- plots: one merged extruded mesh
  const slabGeos = [];
  const lineGeos = [];
  const vertexRanges = [];
  let vCount = 0;
  data.plots.forEach((p, idx) => {
    const g = new THREE.ExtrudeGeometry(shapeFrom(p.xy), { depth: SLAB_H, bevelEnabled: false });
    const n = g.attributes.position.count;
    const aPlot = new Float32Array(n).fill(idx);
    const aDelay = new Float32Array(n).fill(delays[idx]);
    const aCenter = new Float32Array(n * 2);
    for (let i = 0; i < n; i++) {
      aCenter[i * 2] = p.c[0];
      aCenter[i * 2 + 1] = p.c[1];
    }
    g.setAttribute('aPlot', new THREE.BufferAttribute(aPlot, 1));
    g.setAttribute('aDelay', new THREE.BufferAttribute(aDelay, 1));
    g.setAttribute('aCenter', new THREE.BufferAttribute(aCenter, 2));
    g.setAttribute('color', new THREE.BufferAttribute(new Float32Array(n * 4), 4));
    g.deleteAttribute('uv');
    slabGeos.push(g);
    vertexRanges.push([vCount, n]);
    vCount += n;

    // crisp top outline
    const pts = [];
    const m = p.xy.length;
    for (let i = 0; i < m; i++) {
      const a = p.xy[i];
      const b = p.xy[(i + 1) % m];
      pts.push(a[0], a[1], SLAB_H, b[0], b[1], SLAB_H);
    }
    const lg = new THREE.BufferGeometry();
    lg.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3));
    const ln = pts.length / 3;
    lg.setAttribute('aPlot', new THREE.BufferAttribute(new Float32Array(ln).fill(idx), 1));
    lg.setAttribute('aDelay', new THREE.BufferAttribute(new Float32Array(ln).fill(delays[idx]), 1));
    const lc = new Float32Array(ln * 2);
    for (let i = 0; i < ln; i++) {
      lc[i * 2] = p.c[0];
      lc[i * 2 + 1] = p.c[1];
    }
    lg.setAttribute('aCenter', new THREE.BufferAttribute(lc, 2));
    lineGeos.push(lg);
  });
  const slabGeo = track(mergeGeometries(slabGeos));
  slabGeos.forEach((x) => x.dispose());
  const slabMat = patchPlotMaterial(
    track(new THREE.MeshLambertMaterial({ vertexColors: true, transparent: true, side: THREE.FrontSide })),
    uniforms
  );
  const slabs = new THREE.Mesh(slabGeo, slabMat);
  slabs.position.z = 0.1;
  slabs.renderOrder = 4;
  slabs.frustumCulled = false;
  group.add(slabs);

  const lineGeo = track(mergeGeometries(lineGeos));
  lineGeos.forEach((x) => x.dispose());
  const lineMat = patchPlotMaterial(track(new THREE.LineBasicMaterial({ color: '#ffffff', transparent: true, opacity: 0.85 })), uniforms, {
    highlight: false,
  });
  const lines = new THREE.LineSegments(lineGeo, lineMat);
  lines.position.z = 0.115;
  lines.renderOrder = 5;
  lines.frustumCulled = false;
  group.add(lines);

  const labels = buildLabels(data.plots, uniforms, delays);
  labels.position.z = 0.1;
  group.add(labels);

  const plotIndex = new Map(data.plots.map((p, i) => [p.n, i]));

  // ---- selection frame: a yellow survey ring that sits on the selected plot
  let selFrame = null;
  const selMat = track(new THREE.MeshBasicMaterial({ color: '#f2c14e', transparent: true, opacity: 0.98, depthTest: false }));
  function setSelectionFrame(idx) {
    if (selFrame) {
      group.remove(selFrame);
      selFrame.geometry.dispose();
      selFrame = null;
    }
    if (idx < 0) return;
    const p = data.plots[idx];
    const outer = insetRing(p.xy, -0.55);
    const inner = insetRing(p.xy, 0.35);
    const g = new THREE.ShapeGeometry(shapeFrom(outer, [inner]));
    selFrame = new THREE.Mesh(g, selMat);
    selFrame.renderOrder = 7;
    selFrame.userData.idx = idx;
    group.add(selFrame);
  }

  // ---- colours. `base` keeps each plot's painted colour so a pulse can glow from it and settle back.
  const colorAttr = slabGeo.attributes.color;
  const tmp = new THREE.Color();
  const base = new Float32Array(data.plots.length * 4);
  const writePlot = (idx, r, g, b, a) => {
    const [start, count] = vertexRanges[idx];
    for (let i = start; i < start + count; i++) colorAttr.setXYZW(i, r, g, b, a);
  };
  const pulses = new Map(); // plot index -> seconds since its status changed
  function paint(statusMap, isActive, alphaOn = 0.9, alphaOff = 0.34) {
    data.plots.forEach((p, idx) => {
      const st = statusMap?.[p.n];
      const on = isActive ? isActive(p, st) : true;
      tmp.set(STATUS_COLOR[st] || STATUS_COLOR.unknown);
      if (!on) tmp.lerp(DIM_COLOR, 0.86);
      const a = st ? (on ? alphaOn : alphaOff) : on ? 0.55 : 0.25;
      base.set([tmp.r, tmp.g, tmp.b, a], idx * 4);
      if (!pulses.has(idx)) writePlot(idx, tmp.r, tmp.g, tmp.b, a);
    });
    colorAttr.needsUpdate = true;
    setVillaPlots(statusMap);
  }
  const GLOW = new THREE.Color('#fff3c4');
  function updatePulses(dt) {
    if (!pulses.size) return;
    for (const [idx, t0] of pulses) {
      const t = t0 + dt;
      const k = t >= 2.4 ? 0 : 0.5 - 0.5 * Math.cos((t / 0.8) * Math.PI * 2); // three soft beats
      tmp.setRGB(base[idx * 4], base[idx * 4 + 1], base[idx * 4 + 2]).lerp(GLOW, k * 0.75);
      writePlot(idx, tmp.r, tmp.g, tmp.b, Math.max(base[idx * 4 + 3], k));
      if (t >= 2.4) pulses.delete(idx);
      else pulses.set(idx, t);
    }
    colorAttr.needsUpdate = true;
  }

  // ---- trees (two instanced meshes)
  const trees = data.trees || [];
  if (trees.length) {
    const n = trees.length;
    const trunkG = track(new THREE.CylinderGeometry(0.16, 0.22, 2.2, 5));
    trunkG.rotateX(Math.PI / 2);
    trunkG.translate(0, 0, 1.1);
    // a fuller crown: three overlapping lobes, smooth-shaded, instead of one faceted ball
    const lobes = [
      [0, 0, 3.3, 1.55],
      [0.85, 0.35, 2.9, 1.15],
      [-0.7, -0.55, 3.0, 1.2],
      [0.1, -0.2, 4.2, 1.05],
    ].map(([x, y, z, r]) => {
      const g = new THREE.IcosahedronGeometry(r, 1);
      g.translate(x, y, z);
      return g;
    });
    const crownG = track(mergeGeometries(lobes));
    lobes.forEach((g) => g.dispose());
    crownG.computeVertexNormals();
    const trunks = new THREE.InstancedMesh(trunkG, liftLambert('#6b4f3a'), n);
    const crowns = new THREE.InstancedMesh(crownG, liftLambert('#ffffff'), n);
    const m = new THREE.Matrix4();
    const q = new THREE.Quaternion();
    const zAxis = new THREE.Vector3(0, 0, 1);
    const palette = ['#2f7d46', '#3c8a4e', '#4b9a57', '#2a6f40', '#5aa563'];
    trees.forEach(([x, y, s, avenue], i) => {
      q.setFromAxisAngle(zAxis, (i * 2.399) % (Math.PI * 2));
      m.compose(new THREE.Vector3(x, y, 0.06), q, new THREE.Vector3(s, s, s * (avenue ? 1.25 : 1)));
      trunks.setMatrixAt(i, m);
      crowns.setMatrixAt(i, m);
      crowns.setColorAt(i, tmp.set(palette[(i * 7) % palette.length]));
      // avenue trees stand beside plots, so their shadows sit on the raised-plot layer
      shadows.addTree({ x, y, r: 1.9 * s, h: 3.4 * s * (avenue ? 1.25 : 1), onPlot: Boolean(avenue) });
    });
    crowns.instanceColor.needsUpdate = true;
    trunks.frustumCulled = crowns.frustumCulled = false;
    group.add(trunks, crowns);
  }

  // ---- clubhouse, pool, tank, courts, park, entrance arch: only those the layout places
  const amenities = makeAmenities(data, { lambert, liftLambert, track, uniforms, patchLift: patchLiftMaterial, textPlane, shadows, brand });
  group.add(amenities);

  // ---- compound wall along the boundary
  const wallRing = data.wall || data.boundary;
  if (wallRing?.length > 2) {
    const pts = [];
    const H = 1.7;
    for (let i = 0; i < wallRing.length; i++) {
      const a = wallRing[i];
      const b = wallRing[(i + 1) % wallRing.length];
      pts.push(a[0], a[1], 0, b[0], b[1], 0, b[0], b[1], H, a[0], a[1], 0, b[0], b[1], H, a[0], a[1], H);
    }
    const g = track(new THREE.BufferGeometry());
    g.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3));
    g.computeVertexNormals();
    const wall = new THREE.Mesh(g, patchLiftMaterial(lambert('#efece4', { side: THREE.DoubleSide }), uniforms, 0.12));
    wall.position.z = 0.05;
    group.add(wall);
  }

  // ---- traffic
  const liftMat = (color, opts = {}, flatK) => patchLiftMaterial(lambert(color, opts), uniforms, flatK);
  const traffic = makeTraffic(data, liftMat, track);
  group.add(traffic.group);

  // ---- sample villas on sold and registered plots (toggleable; an illustration, not site progress), with a parked
  // car in each drive and at the clubhouse. Rebuilt whenever the set of those plots changes (live statuses).
  const villas = new THREE.Group();
  villas.name = 'villas';
  group.add(villas);
  let villaKey = null;
  function setVillaPlots(statusMap) {
    const chosen = data.plots.filter((p) => VILLA_STATUSES.has(statusMap?.[p.n]));
    const key = chosen.map((p) => p.n).join(',');
    if (key === villaKey) return;
    villaKey = key;
    disposeTree(villas);
    villas.clear();
    if (!chosen.length) return;
    const vMat = (color, opts = {}, flatK) => patchLiftMaterial(new THREE.MeshLambertMaterial({ color, ...opts }), uniforms, flatK);
    const keep = (o) => o; // everything built here is freed by disposeTree(villas)
    const villaSet = makeVillas(chosen, SLAB_H + 0.1, vMat, keep, shadows);
    villas.add(villaSet.group);
    const spots = villaSet.parked.map((v, i) => ({ x: chosen[v.vi].c[0] + v.f.x * v.driveA + v.r.x * v.driveB, y: chosen[v.vi].c[1] + v.f.y * v.driveA + v.r.y * v.driveB, yaw: v.yaw + Math.PI, kind: i % 2, z: SLAB_H + 0.2 }));
    const pk = amenities.userData.parking;
    if (pk) pk.bays.forEach((b, i) => spots.push({ x: pk.at[0] + Math.cos(pk.yaw) * b - Math.sin(pk.yaw) * 2.0, y: pk.at[1] + Math.sin(pk.yaw) * b + Math.cos(pk.yaw) * 2.0, yaw: pk.yaw + Math.PI / 2, kind: i % 2, z: 0.13 }));
    const paints = ['#f4f5f6', '#c9ced6', '#23262b', '#8b9199', '#1f4e8c', '#9b1c1f'];
    traffic.carGeometry.forEach((k, ki) => {
      const mine = spots.filter((sp) => sp.kind === ki);
      if (!mine.length) return;
      // the car geometry belongs to the traffic (freed with the site), so the parked cars get their own copies
      const body = new THREE.InstancedMesh(k.body.clone(), vMat('#ffffff'), mine.length);
      const det = new THREE.InstancedMesh(k.details.clone(), vMat('#ffffff', { vertexColors: true, side: THREE.DoubleSide }), mine.length);
      const M = new THREE.Matrix4();
      const Q = new THREE.Quaternion();
      mine.forEach((sp, i) => {
        Q.setFromAxisAngle(new THREE.Vector3(0, 0, 1), sp.yaw);
        M.compose(new THREE.Vector3(sp.x, sp.y, sp.z), Q, new THREE.Vector3(1, 1, 1));
        body.setMatrixAt(i, M);
        det.setMatrixAt(i, M);
        body.setColorAt(i, tmp.set(paints[(i * 5 + ki) % paints.length]));
      });
      body.instanceColor.needsUpdate = true;
      body.frustumCulled = det.frustumCulled = false;
      villas.add(body, det);
    });
    villas.add(villaSet.shadows.build());
  }

  // ---- lights (Lambert only: the overlay camera has no real view matrix, so nothing view-dependent)
  const hemi = new THREE.HemisphereLight('#ffffff', '#8a9a7a', 1.0);
  hemi.position.set(0, 0, 1);
  const sun = new THREE.DirectionalLight('#fff1d6', 1.9);
  sun.position.copy(SUN.from).multiplyScalar(500); // same sun the projected shadows use
  group.add(hemi, sun, sun.target);

  // ---- shadows of everything registered above (villa shadows live with the villas)
  group.add(shadows.build());

  paint(null, null);

  let liftTarget = 0;
  let revealTarget = 0;
  let villasOn = true;

  const api = {
    group,
    uniforms,
    slabHeight: SLAB_H,
    paint,
    /** a short glow on plots whose status just changed */
    pulse(numbers) {
      for (const n of numbers) {
        const idx = plotIndex.get(String(n));
        if (idx != null) pulses.set(idx, 0);
      }
    },
    /** when true the ground pad is opaque (standalone renderer has no satellite underneath) */
    setPad(opaque) {
      pad.material.opacity = opaque ? 1 : 0;
      pad.material.transparent = !opaque;
      pad.material.needsUpdate = true;
    },
    setSelected(n) {
      const idx = n == null ? -1 : plotIndex.get(n) ?? -1;
      uniforms.uSel.value = idx;
      setSelectionFrame(idx);
    },
    setHover(n) {
      uniforms.uHover.value = n == null ? -1 : plotIndex.get(n) ?? -1;
    },
    setVillas(on) {
      villasOn = on;
    },
    /** 0 = plan, 1 = raised. Eased here, independent of any camera flight, so user input can never strand it half-way. */
    setLift(v, instant = false) {
      liftTarget = v;
      if (instant) uniforms.uLift.value = v;
    },
    reveal(instant = false) {
      revealTarget = 1.2;
      if (instant) uniforms.uReveal.value = 1.2;
    },
    update(dt, t) {
      uniforms.uTime.value = t;
      const u = uniforms;
      if (u.uReveal.value < revealTarget) u.uReveal.value = Math.min(revealTarget, u.uReveal.value + dt * (1.2 / 2.8));
      if (u.uLift.value !== liftTarget) {
        const step = dt / 1.4;
        u.uLift.value = liftTarget > u.uLift.value ? Math.min(liftTarget, u.uLift.value + step) : Math.max(liftTarget, u.uLift.value - step);
      }
      const raised = u.uLift.value > 0.04;
      villas.visible = villasOn && raised;
      traffic.group.visible = u.uReveal.value > 0.98;
      if (traffic.group.visible) traffic.update(dt);
      updatePulses(dt);
      if (selFrame) {
        const rise = 1 + 3.2 + 0.35 * Math.sin(t * 3);
        selFrame.position.z = 0.1 + SLAB_H * (0.08 + 0.92 * u.uLift.value) * rise + 0.08;
      }
    },
    dispose() {
      if (selFrame) selFrame.geometry.dispose();
      disposeTree(group);
      disposables.forEach((d) => d.dispose && d.dispose());
    },
  };
  return api;
}
