// A project's entrance gate for the map: a photoreal scale model of a gated-community entrance (a render cut out of
// its studio backdrop) with its lanterns glowing, the project's logo or monogram on the crest, a plaque with its name and live availability, and a stem down to the site.
// layoutGates (below) places it clear of the other gates and the map's controls, moving the body and redrawing the
// leader to the site dot.
import GATE_IMG from './gate.webp';

/**
 * n: {name, sub, logo (url) | mono ({top, main}), index}. Text goes in as text: names come from the database.
 * Returns {el, body, line}: the root (anchored at the site by its bottom centre), the movable body and the leader.
 */
export function gateElement({ name, sub, logo, mono, index = 0 }) {
  const el = document.createElement('div');
  el.className = 'gc-gate';
  el.style.setProperty('--i', String(index));
  el.innerHTML = `<div class="gc-gate__body"><div class="gc-gate__rise">
      <div class="gc-gate__arch"><img class="gc-gate__img" src="${GATE_IMG}" alt="" draggable="false">
        <span class="gc-gate__glow"></span><span class="gc-gate__glow is-r"></span><span class="gc-gate__crest"></span></div>
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
 * A gate whose site is off screen hides (it would only hang at the edge); the Next door control is the way there.
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
  const shown = withAnchor.filter((a) => {
    const on = a.x >= 0 && a.x <= vw && a.y >= 0 && a.y <= vh;
    a.g.el.style.visibility = on ? '' : 'hidden';
    return on;
  });
  // every site's dot stays visible: a gate may not stand over another project's site
  const dots = shown.map((a) => ({ a, left: a.x - 14, right: a.x + 14, top: a.y - 14, bottom: a.y + 14 }));
  for (const a of shown) {
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
