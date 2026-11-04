// A project's logo card for the map: the client's logo on a white card over a navy foot with the project's name (the
// three Global City logos differ only in small print) and its live availability (desktop), and a stem down to the site. layoutBadges (below) places it clear of the other cards and the map's
// controls, moving the body and redrawing the leader to the site dot.

/**
 * n: {name, sub, logo (url), here, index}. Text goes in as text: names come from the database. A project without a logo
 * shows its name on the card instead. `here` tags the open project's card "You are here".
 * Returns {el, body, line}: the root (anchored at the site by its bottom centre), the movable body and the leader.
 */
export function badgeElement({ name, sub, logo, here = false, index = 0 }) {
  const el = document.createElement('div');
  el.className = here ? 'gc-badge is-here' : 'gc-badge';
  el.style.setProperty('--i', String(index));
  el.innerHTML = `<div class="gc-badge__body"><div class="gc-badge__rise">
      <div class="gc-badge__card"><span class="gc-badge__mark"></span>
        <span class="gc-badge__meta"><b class="gc-badge__name"></b><span class="gc-badge__sub"></span></span></div>
    </div></div>
    <span class="gc-badge__stem"></span><span class="gc-badge__dot"></span>
    <svg class="gc-badge__leader" aria-hidden="true"><line x1="0" y1="-30" x2="0" y2="0"/></svg>`;
  el.querySelector('.gc-badge__name').textContent = name.split(/\s+[–-]\s+/)[0]; // 'Western County – Shankarpalli' -> 'Western County'
  el.querySelector('.gc-badge__sub').textContent = sub || ''; // empty until the counts arrive (hidden by CSS)
  const mark = el.querySelector('.gc-badge__mark');
  if (logo) {
    const img = document.createElement('img');
    img.src = logo;
    img.alt = name;
    img.draggable = false;
    mark.append(img);
  } else {
    mark.textContent = name;
    mark.classList.add('is-text');
  }
  return { el, body: el.querySelector('.gc-badge__body'), line: el.querySelector('.gc-badge__leader line') };
}

/**
 * Places cards so none overlaps another or the map's controls (elements marked data-map-ui inside `scope`), north
 * first: each tries standing above its site, beside it, higher, or below it, and takes the clearest spot that moves
 * it least. Moves only the bodies; the roots stay anchored at their sites and a leader line runs to the site dot.
 * A card whose site is off screen hides (it would only hang at the edge); the Next door control is the way there.
 * `avoid`: screen rects of other markers to keep in sight too (the past projects' dots).
 */
export function layoutBadges(badges, scope, avoid = []) {
  const live = badges.filter((g) => g.el.isConnected && g.el.getBoundingClientRect().width);
  if (!live.length) return false;
  const vw = document.documentElement.clientWidth;
  const vh = document.documentElement.clientHeight;
  const ui = [...(scope?.querySelectorAll('[data-map-ui]') ?? [])].map((e) => e.getBoundingClientRect()).filter((r) => r.width && r.height);
  const area = (a, b) => Math.max(0, Math.min(a.right, b.right) - Math.max(a.left, b.left)) * Math.max(0, Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top));
  const placed = [];
  const withAnchor = live.map((g) => {
    const r = g.el.getBoundingClientRect();
    // y: the site dot's centre; stem: from there up to the body's bottom (the stem is shorter on phones)
    return { g, x: (r.left + r.right) / 2, y: r.bottom - 4, w: g.body.offsetWidth, h: g.body.offsetHeight, stem: g.el.querySelector('.gc-badge__stem').offsetHeight + 4 };
  });
  withAnchor.sort((a, b) => a.y - b.y); // north (higher on screen) first
  const shown = withAnchor.filter((a) => {
    const on = a.x >= 0 && a.x <= vw && a.y >= 0 && a.y <= vh;
    a.g.el.style.visibility = on ? '' : 'hidden';
    return on;
  });
  // every site's dot stays visible: a card may not stand over another project's site, live or past
  const dots = [
    ...shown.map((a) => ({ a, left: a.x - 14, right: a.x + 14, top: a.y - 14, bottom: a.y + 14 })),
    ...avoid.map((r) => ({ left: r.left - 8, right: r.right + 8, top: r.top - 8, bottom: r.bottom + 8 })),
  ];
  // a leader line drawn across another card reads as clutter: count it like a small overlap (sampled along the line)
  const leaders = [];
  const crosses = (s, r) => {
    for (let t = 0.05; t < 1; t += 0.05) {
      const x = s.x1 + (s.x2 - s.x1) * t;
      const y = s.y1 + (s.y2 - s.y1) * t;
      if (x > r.left && x < r.right && y > r.top && y < r.bottom) return true;
    }
    return false;
  };
  for (const a of shown) {
    const dxs = [0, -a.w * 0.55, a.w * 0.55, -(a.w + 12), a.w + 12, -(a.w * 1.6 + 12), a.w * 1.6 + 12];
    const lifts = [0, a.h * 0.5, a.h * 1.05, a.h * 1.6, -(a.h + 2 * a.stem)]; // the last hangs the card below its site
    let best = null;
    for (const lift of lifts) {
      for (const dx of dxs) {
        const r = { left: a.x + dx - a.w / 2, right: a.x + dx + a.w / 2, top: a.y - a.stem - lift - a.h, bottom: a.y - a.stem - lift };
        const line = { x1: a.x, y1: a.y, x2: a.x + dx, y2: lift >= 0 ? r.bottom : r.top };
        const off = (Math.max(0, -r.left) + Math.max(0, r.right - vw)) * a.h + (Math.max(0, -r.top) + Math.max(0, r.bottom - vh)) * a.w;
        const clash =
          placed.reduce((t, p) => t + area(r, p), 0) * 4 +
          dots.reduce((t, d) => t + (d.a === a ? 0 : area(r, d)), 0) * 4 +
          ui.reduce((t, u) => t + area(r, u), 0) * 2 +
          off * 3 +
          (placed.filter((p) => crosses(line, p)).length + leaders.filter((l) => crosses(l, r)).length) * 6000;
        const cost = clash + (Math.abs(dx) + Math.abs(lift)) * 0.5; // clear first, then the least moved
        if (!best || cost < best.cost) best = { dx, lift, r, line, cost };
      }
    }
    placed.push(best.r);
    leaders.push(best.line);
    a.g.body.style.transform = `translate(${Math.round(best.dx)}px, ${Math.round(-best.lift)}px)`;
    a.g.line.setAttribute('x1', String(Math.round(best.dx)));
    // the leader meets the body's bottom, or its top when the card hangs below the site
    a.g.line.setAttribute('y1', String(Math.round(best.lift >= 0 ? -a.stem - best.lift : -a.stem - best.lift - a.h)));
  }
  return true;
}
