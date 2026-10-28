// "Take the tour" stops, read from the layout itself: the entrance (if the layout has a gate), its widest internal
// road, the clubhouse or another named place, then the whole layout from the air. Each renderer turns a stop's
// kind into its own camera.

import { pointInRing } from '../lib/geo.js';

/** compass bearing from a to b, degrees clockwise from north */
const bearing = (a, b) => (Math.atan2(b[0] - a[0], b[1] - a[1]) * 180) / Math.PI;
const dist = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1]);
const lengthOf = (pts) => pts.slice(1).reduce((t, p, i) => t + dist(p, pts[i]), 0);
function pointAlong(pts, frac) {
  let left = lengthOf(pts) * frac;
  for (let i = 1; i < pts.length; i++) {
    const seg = dist(pts[i], pts[i - 1]);
    if (left <= seg) {
      const k = seg ? left / seg : 0;
      return [pts[i - 1][0] + (pts[i][0] - pts[i - 1][0]) * k, pts[i - 1][1] + (pts[i][1] - pts[i - 1][1]) * k];
    }
    left -= seg;
  }
  return pts[pts.length - 1];
}
const ringArea = (r) => Math.abs(r.reduce((t, v, i) => t + v[0] * r[(i + 1) % r.length][1] - r[(i + 1) % r.length][0] * v[1], 0) / 2);

/** [{label, kind: 'close'|'road'|'zone'|'aerial', xy?, heading?}] */
export function tourStops(data) {
  const f = data.features || {};
  const ext = data.extent;
  const stops = [];
  const gate = f.gate?.at;
  if (gate) stops.push({ label: 'The entrance arch', kind: 'close', xy: gate, heading: f.gate.along ? bearing([0, 0], f.gate.along) : 0 });

  // the road from the entrance, else the widest road inside the site (a master-plan road along the boundary is outside)
  const inside = (pt) => (data.boundary ? pointInRing(pt, data.boundary) : pt[0] > ext.minX && pt[0] < ext.maxX && pt[1] > ext.minY && pt[1] < ext.maxY);
  const touchesGate = (c) => (gate ? Math.min(...c.pts.map((p) => dist(p, gate))) < 25 : false);
  const roads = (data.centerlines || [])
    .filter((c) => c.w && c.pts?.length > 1 && lengthOf(c.pts) > 30 && inside(pointAlong(c.pts, 0.5)))
    .sort((a, b) => touchesGate(b) - touchesGate(a) || b.w - a.w || lengthOf(b.pts) - lengthOf(a.pts));
  const main = roads[0];
  if (main) {
    let [a, b] = [main.pts[0], main.pts[main.pts.length - 1]];
    if (gate && dist(b, gate) < dist(a, gate)) [a, b] = [b, a]; // look away from the entrance, down the road
    stops.push({ label: `The ${main.w}' main road`, kind: 'road', xy: pointAlong(main.pts, 0.5), heading: bearing(a, b) });
  }

  const zones = Object.values(data.zones || {}).filter((z) => z?.name && z.c && !/utility|septic|transformer|garbage/i.test(z.name));
  if (f.clubhouse?.at) {
    const name = data.zones?.clubhouse?.name || 'Clubhouse';
    stops.push({ label: f.pool?.at ? `${name} and pool` : name, kind: 'close', xy: (f.pool || f.clubhouse).at, heading: -30 });
  } else if (zones.length) {
    // places people visit first (parks, clubhouse), then the largest
    const rank = (z) => (/club|park|garden|play|pool/i.test(z.name) ? 1 : 0);
    const size = (z) => z.area || (z.xy ? ringArea(z.xy) : 0);
    const z = zones.sort((x, y) => rank(y) - rank(x) || size(y) - size(x))[0];
    const label = /^\w+(\s+\d+)?$/.test(z.name) ? `The ${z.name.replace(/\s+\d+$/, '').toLowerCase()}` : z.name; // "Park 3" -> "The park"
    stops.push({ label, kind: 'zone', xy: z.c, heading: -30 });
  }

  stops.push({ label: `All ${data.plots.length} plots`, kind: 'aerial' });
  return stops;
}
