// Google Maps JS API bootstrap (dynamic library import), loaded once.
// Resolves to null instead of throwing when there is no key, the key is rejected,
// or the network is unavailable, so the page can fall back to the self-contained 3D plan.

const KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
export const MAP_ID = import.meta.env.VITE_GOOGLE_MAP_ID || 'DEMO_MAP_ID';

let pending;

function bootstrap() {
  // Official inline loader, unminified for readability.
  const g = { key: KEY, v: 'weekly', region: 'IN', language: 'en' };
  const w = window;
  w.google = w.google || {};
  const maps = (w.google.maps = w.google.maps || {});
  if (maps.importLibrary) return;
  const libs = new Set();
  let loading;
  const load = () =>
    loading ||
    (loading = new Promise((resolve, reject) => {
      const params = new URLSearchParams();
      params.set('libraries', [...libs].join(','));
      for (const k in g) params.set(k.replace(/[A-Z]/g, (t) => '_' + t[0].toLowerCase()), g[k]);
      params.set('callback', 'google.maps.__ib__');
      const s = document.createElement('script');
      s.src = `https://maps.googleapis.com/maps/api/js?${params}`;
      s.async = true;
      maps.__ib__ = resolve;
      s.onerror = () => reject(new Error('Google Maps script failed to load'));
      document.head.append(s);
    }));
  maps.importLibrary = (name, ...rest) => {
    libs.add(name);
    return load().then(() => maps.importLibrary(name, ...rest));
  };
}

export function loadGoogleMaps({ timeoutMs = 9000 } = {}) {
  if (pending) return pending;
  pending = new Promise((resolve) => {
    if (!KEY) return resolve(null);
    let settled = false;
    const done = (v) => {
      if (!settled) {
        settled = true;
        resolve(v);
      }
    };
    // Google calls this global when the key is invalid, unauthorised for the referrer, or billing is off.
    window.gm_authFailure = () => {
      window.__gmAuthFailed = true;
      done(null);
      window.dispatchEvent(new Event('gm-auth-failure'));
    };
    const timer = setTimeout(() => done(null), timeoutMs);
    try {
      bootstrap();
      Promise.all([window.google.maps.importLibrary('maps'), window.google.maps.importLibrary('marker')])
        .then(([mapsLib, markerLib]) => {
          clearTimeout(timer);
          done({ ...mapsLib, ...markerLib, google: window.google });
        })
        .catch(() => {
          clearTimeout(timer);
          done(null);
        });
    } catch {
      clearTimeout(timer);
      done(null);
    }
  });
  return pending;
}

/** Vector maps need hardware WebGL2. Google silently falls back to raster on software renderers. */
export function hasHardwareWebGL() {
  try {
    const c = document.createElement('canvas');
    const gl = c.getContext('webgl2', { failIfMajorPerformanceCaveat: true });
    if (!gl) return false;
    const ext = gl.getExtension('WEBGL_debug_renderer_info');
    const name = ext ? String(gl.getParameter(ext.UNMASKED_RENDERER_WEBGL)) : '';
    return !/swiftshader|llvmpipe|software/i.test(name);
  } catch {
    return false;
  }
}
