// Google Maps JS API, loaded once on demand with the official dynamic-import bootstrap. Resolves to null instead of
// throwing when the key is missing or rejected, the script is blocked or the network is slow, so the page falls back
// to its own plan view. Browser key: restrict it by HTTP referrer and to Maps JavaScript, Places (New) and Routes.

const KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

export type Maps = typeof google.maps;

let pending: Promise<Maps | null> | null = null;
let authFailed = false; // a rejected key stays rejected until the page reloads (a retry would bring back a broken map)

function bootstrap() {
  const w = window as unknown as { google?: { maps?: Record<string, unknown> } };
  w.google ??= {};
  const maps = (w.google.maps ??= {});
  if (maps.importLibrary) return;
  const libs = new Set<string>();
  let loading: Promise<void> | null = null;
  const load = () =>
    (loading ??= new Promise<void>((resolve, reject) => {
      const params = new URLSearchParams({ key: KEY!, v: "weekly", region: "IN", language: "en", callback: "google.maps.__ib__" });
      params.set("libraries", [...libs].join(","));
      const s = document.createElement("script");
      s.src = `https://maps.googleapis.com/maps/api/js?${params}`;
      s.async = true;
      maps.__ib__ = resolve;
      s.onerror = () => {
        loading = null; // let a retry try again
        reject(new Error("Google Maps failed to load"));
      };
      document.head.append(s);
    }));
  maps.importLibrary = (name: string, ...rest: unknown[]) => {
    libs.add(name);
    return load().then(() => (maps.importLibrary as (n: string, ...r: unknown[]) => Promise<unknown>)(name, ...rest));
  };
}

/** Why the last load gave null: a slow link ("timeout": the map still arrives, see gip:maps-late) or not ("error"). */
export let mapsFailure: "timeout" | "error" | null = null;

/**
 * The maps namespace once its core library is in, or null (no key, rejected key, offline, timeout). Places and Routes
 * load later, when Nearby asks (./nearby). A load that lands after the timeout fires "gip:maps-late" so the page can
 * switch to the map then.
 */
export function loadMaps(timeoutMs = 12_000): Promise<Maps | null> {
  if (pending) return pending;
  pending = new Promise<Maps | null>((resolve) => {
    if (!KEY || authFailed || typeof window === "undefined") return resolve(null);
    let late = false;
    const done = (v: Maps | null, why: typeof mapsFailure = null) => {
      clearTimeout(timer);
      mapsFailure = why;
      resolve(v);
      if (!v) pending = null; // the retry button gets a fresh attempt
    };
    const timer = setTimeout(() => {
      late = true;
      done(null, "timeout");
    }, timeoutMs);
    // Google calls this when the key is invalid, not allowed for this site, or billing is off.
    (window as unknown as { gm_authFailure: () => void }).gm_authFailure = () => {
      authFailed = true;
      done(null, "error");
      window.dispatchEvent(new Event("gip:maps-auth-failure"));
    };
    try {
      bootstrap();
      const g = (window as unknown as { google: { maps: Maps } }).google.maps;
      g.importLibrary("maps")
        .then(() => (late ? !authFailed && window.dispatchEvent(new Event("gip:maps-late")) : done(g)))
        .catch(() => done(null, "error"));
    } catch {
      done(null, "error");
    }
  });
  return pending;
}

/** False in a build without a key (the Pages preview): the page is then the plan alone, with no Google features. */
export const hasMapsKey = Boolean(KEY);

// Start the script while the page hydrates rather than after it (the map is the page's largest paint).
if (typeof window !== "undefined") void loadMaps();

/* ---------- base map styles (raster styling: works without a Map ID, so roads can be emphasised) ---------- */

// Street map: a quiet ground so the layout and the roads read first. National highways and arterials are drawn
// stronger than village roads (the connecting roads a buyer asks about); Google's own POIs are off because the page
// draws its own landmarks.
export const STREET_STYLE: google.maps.MapTypeStyle[] = [
  { elementType: "geometry", stylers: [{ color: "#edf1f0" }] },
  { elementType: "labels.text.fill", stylers: [{ color: "#4d5d6e" }] },
  { elementType: "labels.text.stroke", stylers: [{ color: "#ffffff" }, { weight: 3 }] },
  { featureType: "administrative.land_parcel", stylers: [{ visibility: "off" }] },
  { featureType: "poi", stylers: [{ visibility: "off" }] },
  { featureType: "poi.park", elementType: "geometry", stylers: [{ visibility: "on" }, { color: "#d6eadc" }] },
  { featureType: "landscape.natural", elementType: "geometry", stylers: [{ color: "#e7eee9" }] },
  { featureType: "water", elementType: "geometry", stylers: [{ color: "#c2dce6" }] },
  { featureType: "transit", elementType: "labels.icon", stylers: [{ visibility: "off" }] },
  { featureType: "transit.line", elementType: "geometry", stylers: [{ color: "#9fb2bd" }] },
  // Three clear tiers: village roads white, district roads pale gold, national highways gold.
  { featureType: "road", elementType: "geometry.fill", stylers: [{ color: "#ffffff" }] },
  { featureType: "road", elementType: "geometry.stroke", stylers: [{ color: "#c3ced3" }] },
  { featureType: "road.local", elementType: "labels.icon", stylers: [{ visibility: "off" }] },
  { featureType: "road.arterial", elementType: "geometry.fill", stylers: [{ color: "#fff0c2" }] },
  { featureType: "road.arterial", elementType: "geometry.stroke", stylers: [{ color: "#d4a23c" }] },
  { featureType: "road.arterial", elementType: "labels.text.fill", stylers: [{ color: "#33475b" }] },
  { featureType: "road.highway", elementType: "geometry.fill", stylers: [{ color: "#f4c45a" }] },
  { featureType: "road.highway", elementType: "geometry.stroke", stylers: [{ color: "#b07a12" }] },
  { featureType: "road.highway", elementType: "labels.text.fill", stylers: [{ color: "#5c3d05" }] },
];

// Satellite: Google's photo ground with its road and place labels; highways tinted so the connecting roads stand out.
export const SATELLITE_STYLE: google.maps.MapTypeStyle[] = [
  { featureType: "poi", stylers: [{ visibility: "off" }] },
  { featureType: "transit", elementType: "labels.icon", stylers: [{ visibility: "off" }] },
  { featureType: "road.local", elementType: "labels.icon", stylers: [{ visibility: "off" }] },
  { featureType: "road.highway", elementType: "geometry", stylers: [{ color: "#f4c45a" }] },
  { featureType: "road.arterial", elementType: "geometry", stylers: [{ color: "#ffffff" }, { visibility: "simplified" }] },
];
