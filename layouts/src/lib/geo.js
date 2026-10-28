// Small-area geodesy. The site is ~650 m across, so a local tangent plane (ENU metres)
// around the site origin is accurate to a few millimetres.

const R = 6378137;
const rad = (d) => (d * Math.PI) / 180;

export function makeProjector(origin) {
  const cosLat = Math.cos(rad(origin.lat));
  return {
    origin,
    /** metres east/north of origin -> {lat,lng} */
    toLatLng([x, y]) {
      return {
        lat: origin.lat + (y / R) * (180 / Math.PI),
        lng: origin.lng + (x / (R * cosLat)) * (180 / Math.PI),
      };
    },
    /** {lat,lng} -> [x,y] metres east/north of origin */
    toXY({ lat, lng }) {
      return [rad(lng - origin.lng) * R * cosLat, rad(lat - origin.lat) * R];
    },
  };
}

export function pointInRing([px, py], ring) {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, yi] = ring[i];
    const [xj, yj] = ring[j];
    if (yi > py !== yj > py && px < ((xj - xi) * (py - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}

export function ringBounds(ring) {
  let minX = Infinity,
    minY = Infinity,
    maxX = -Infinity,
    maxY = -Infinity;
  for (const [x, y] of ring) {
    if (x < minX) minX = x;
    if (y < minY) minY = y;
    if (x > maxX) maxX = x;
    if (y > maxY) maxY = y;
  }
  return { minX, minY, maxX, maxY };
}

/** Spatial index over plots: a uniform grid is plenty for 288 polygons and makes hover hit-tests O(1). */
export function buildPlotIndex(plots, cell = 20) {
  const grid = new Map();
  const key = (i, j) => i * 100000 + j;
  plots.forEach((p, idx) => {
    const b = ringBounds(p.xy);
    p._b = b;
    for (let i = Math.floor(b.minX / cell); i <= Math.floor(b.maxX / cell); i++)
      for (let j = Math.floor(b.minY / cell); j <= Math.floor(b.maxY / cell); j++) {
        const k = key(i, j);
        if (!grid.has(k)) grid.set(k, []);
        grid.get(k).push(idx);
      }
  });
  return function hit([x, y]) {
    const bucket = grid.get(key(Math.floor(x / cell), Math.floor(y / cell)));
    if (!bucket) return null;
    for (const idx of bucket) {
      const p = plots[idx];
      const b = p._b;
      if (x < b.minX || x > b.maxX || y < b.minY || y > b.maxY) continue;
      if (pointInRing([x, y], p.xy)) return p;
    }
    return null;
  };
}

export const SQYD_PER_SQM = 1.19599;
export const FT_PER_M = 3.28084;

export function haversineKm(a, b) {
  const dLat = rad(b.lat - a.lat);
  const dLng = rad(b.lng - a.lng);
  const s = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return (2 * R * Math.asin(Math.sqrt(s))) / 1000;
}

export const easeInOutCubic = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
export const easeOutCubic = (t) => 1 - Math.pow(1 - t, 3);
export const lerp = (a, b, t) => a + (b - a) * t;
/** shortest-path angle interpolation in degrees */
export function lerpAngle(a, b, t) {
  const d = ((((b - a) % 360) + 540) % 360) - 180;
  return a + d * t;
}
