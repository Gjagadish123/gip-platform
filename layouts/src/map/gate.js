// A project's entrance gate for the map: an oblique-projection 3D arch in the in-scene arch's materials (grey stone
// plinths, ivory pillars, a navy beam) with gold trim and lamp-lit finials, carrying the project's logo on a medallion,
// a plaque with its name and live availability, and a stem down to the site. layoutGates (below) places it clear of the
// other gates and the map's controls, moving the body and redrawing the leader to the site dot.

// Faces: front lit, right side in shade, top catching the light. Depth recedes up and to the right (+7, -5).
const GATE_SVG = `<svg class="gc-gate__svg" viewBox="0 0 132 100" aria-hidden="true">
  <ellipse cx="68" cy="94" rx="56" ry="5" fill="#000" opacity=".28"/>
  <polygon points="44,96 88,96 79,62 55,62" fill="#3a414b"/>
  <line x1="66" y1="94" x2="67" y2="64" stroke="#f2c14e" stroke-width="1.4" stroke-dasharray="4 4"/>
  <circle cx="8" cy="89" r="5" fill="#2f7d4a"/><circle cx="126" cy="89" r="5" fill="#2f7d4a"/>
  <g>
    <rect x="12" y="80" width="26" height="12" fill="#7b7f86"/>
    <polygon points="38,80 45,75 45,87 38,92" fill="#5d6168"/>
    <polygon points="12,80 19,75 45,75 38,80" fill="#9ba1a9"/>
    <rect x="16" y="34" width="18" height="46" fill="#f6f3ec"/>
    <polygon points="34,34 41,29 41,75 34,80" fill="#d6cebd"/>
    <line x1="21" y1="40" x2="21" y2="76" stroke="#e4ddcf"/><line x1="29" y1="40" x2="29" y2="76" stroke="#e4ddcf"/>
  </g>
  <g>
    <rect x="92" y="80" width="26" height="12" fill="#7b7f86"/>
    <polygon points="118,80 125,75 125,87 118,92" fill="#5d6168"/>
    <polygon points="92,80 99,75 125,75 118,80" fill="#9ba1a9"/>
    <rect x="96" y="34" width="18" height="46" fill="#f6f3ec"/>
    <polygon points="114,34 121,29 121,75 114,80" fill="#d6cebd"/>
    <line x1="101" y1="40" x2="101" y2="76" stroke="#e4ddcf"/><line x1="109" y1="40" x2="109" y2="76" stroke="#e4ddcf"/>
  </g>
  <polygon points="8,30 15,25 131,25 124,30" fill="#0e5a9c"/>
  <rect x="8" y="30" width="116" height="16" fill="#033967"/>
  <polygon points="124,30 131,25 131,41 124,46" fill="#021f3a"/>
  <path d="M34 46 Q66 60 96 46 Z" fill="#033967"/>
  <path d="M34 46 Q66 60 96 46" fill="none" stroke="#f2c14e" stroke-width="1.4"/>
  <rect x="8" y="30" width="116" height="1.6" fill="#f2c14e"/><rect x="8" y="44.4" width="116" height="1.6" fill="#f2c14e"/>
  <g>
    <polygon points="16,25 25,12 34,25" fill="#e9e1d0"/><polygon points="25,12 34,25 38,22 29,10" fill="#cfc6b3"/>
    <circle class="gc-gate__halo" cx="25" cy="8" r="6" fill="#ffd76a"/><circle class="gc-gate__lamp" cx="25" cy="8" r="2.6" fill="#ffe7a3"/>
  </g>
  <g>
    <polygon points="96,25 105,12 114,25" fill="#e9e1d0"/><polygon points="105,12 114,25 118,22 109,10" fill="#cfc6b3"/>
    <circle class="gc-gate__halo" cx="105" cy="8" r="6" fill="#ffd76a"/><circle class="gc-gate__lamp" cx="105" cy="8" r="2.6" fill="#ffe7a3"/>
  </g>
</svg>`;

/**
 * n: {name, sub, logo (url) | mono ({top, main}), index}. Text goes in as text: names come from the database.
 * Returns {el, body, line}: the root (anchored at the site by its bottom centre), the movable body and the leader.
 */
export function gateElement({ name, sub, logo, mono, index = 0 }) {
  const el = document.createElement('div');
  el.className = 'gc-gate';
  el.style.setProperty('--i', String(index));
  el.innerHTML = `<div class="gc-gate__body"><div class="gc-gate__rise">
      <div class="gc-gate__arch">${GATE_SVG}<span class="gc-gate__shine"></span><span class="gc-gate__crest"></span></div>
      <div class="gc-gate__plate"><b></b><span class="gc-gate__sub"></span><span class="gc-gate__go">Explore &rarr;</span></div>
    </div></div>
    <span class="gc-gate__stem"></span><span class="gc-gate__dot"></span>
    <svg class="gc-gate__leader" aria-hidden="true"><line x1="0" y1="-30" x2="0" y2="0"/></svg>`;
  el.querySelector('b').textContent = name;
  el.querySelector('.gc-gate__sub').textContent = sub || ''; // empty until the counts arrive (hidden by CSS)
  const crest = el.querySelector('.gc-gate__crest');
  if (logo) {
    const img = document.createElement('img');
    img.src = logo;
    img.alt = '';
    crest.append(img);
    crest.classList.add('is-logo');
  } else {
    const m = document.createElement('span');
    m.className = 'gc-gate__mono';
    if (mono?.top) m.append(Object.assign(document.createElement('i'), { textContent: mono.top }));
    m.append(Object.assign(document.createElement('em'), { textContent: mono?.main ?? '' }));
    crest.append(m);
  }
  return { el, body: el.querySelector('.gc-gate__body'), line: el.querySelector('.gc-gate__leader line') };
}

/**
 * Places gates so none overlaps another or the map's controls (elements marked data-map-ui inside `scope`), north
 * first: each tries standing above its site, beside it, higher, or below it, and takes the clearest spot that moves
 * it least. Moves only the bodies; the roots stay anchored at their sites and a leader line runs to the site dot.
 */
export function layoutGates(gates, scope) {
  const live = gates.filter((g) => g.el.isConnected && g.el.getBoundingClientRect().width);
  if (!live.length) return false;
  const vw = document.documentElement.clientWidth;
  const vh = document.documentElement.clientHeight;
  const ui = [...(scope?.querySelectorAll('[data-map-ui]') ?? [])].map((e) => e.getBoundingClientRect()).filter((r) => r.width && r.height);
  const area = (a, b) => Math.max(0, Math.min(a.right, b.right) - Math.max(a.left, b.left)) * Math.max(0, Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top));
  const placed = [];
  const withAnchor = live.map((g) => {
    const r = g.el.getBoundingClientRect();
    // y: the site dot's centre; stem: from there up to the body's bottom (the stem is shorter on phones)
    return { g, x: (r.left + r.right) / 2, y: r.bottom - 4, w: g.body.offsetWidth, h: g.body.offsetHeight, stem: g.el.querySelector('.gc-gate__stem').offsetHeight + 4 };
  });
  withAnchor.sort((a, b) => a.y - b.y); // north (higher on screen) first
  // every site's dot stays visible: a gate may not stand over another project's site
  const dots = withAnchor.map((a) => ({ a, left: a.x - 14, right: a.x + 14, top: a.y - 14, bottom: a.y + 14 }));
  for (const a of withAnchor) {
    const dxs = [0, -a.w * 0.55, a.w * 0.55, -(a.w + 12), a.w + 12, -(a.w * 1.6 + 12), a.w * 1.6 + 12];
    const lifts = [0, a.h * 0.5, a.h * 1.05, a.h * 1.6, -(a.h + 2 * a.stem)]; // the last hangs the gate below its site
    let best = null;
    for (const lift of lifts) {
      for (const dx of dxs) {
        const r = { left: a.x + dx - a.w / 2, right: a.x + dx + a.w / 2, top: a.y - a.stem - lift - a.h, bottom: a.y - a.stem - lift };
        const off = (Math.max(0, -r.left) + Math.max(0, r.right - vw)) * a.h + (Math.max(0, -r.top) + Math.max(0, r.bottom - vh)) * a.w;
        const clash =
          placed.reduce((t, p) => t + area(r, p), 0) * 4 +
          dots.reduce((t, d) => t + (d.a === a ? 0 : area(r, d)), 0) * 4 +
          ui.reduce((t, u) => t + area(r, u), 0) * 2 +
          off * 3;
        const cost = clash + (Math.abs(dx) + Math.abs(lift)) * 0.5; // clear first, then the least moved
        if (!best || cost < best.cost) best = { dx, lift, r, cost };
      }
    }
    placed.push(best.r);
    a.g.body.style.transform = `translate(${Math.round(best.dx)}px, ${Math.round(-best.lift)}px)`;
    a.g.line.setAttribute('x1', String(Math.round(best.dx)));
    // the leader meets the body's bottom, or its top when the gate hangs below the site
    a.g.line.setAttribute('y1', String(Math.round(best.lift >= 0 ? -a.stem - best.lift : -a.stem - best.lift - a.h)));
  }
  return true;
}
