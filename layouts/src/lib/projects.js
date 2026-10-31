// The four projects this app can show, their per-project files, and small readers for public_content.

import OUTLINES from '../data/outlines.json';
import { haversineKm } from './geo.js';

/** Listed in the order Supabase gives (sort_order); this order is only used when Supabase can't be read. */
export const PROJECT_IDS = ['global-city-vi', 'global-city-rrr', 'global-city-v', 'western-county'];
export const isProjectId = (id) => PROJECT_IDS.includes(id);

// Shown only while Supabase can't be read, so the layouts still work (without statuses or copy).
const FALLBACK_NAMES = {
  'global-city-vi': 'Global City VI',
  'global-city-rrr': 'Global City RRR',
  'global-city-v': 'Global City V',
  'western-county': 'Western County',
};
export const FALLBACK_LIST = PROJECT_IDS.map((id) => ({ id, name: FALLBACK_NAMES[id], content: {}, offline: true }));

/** Every public file goes through the deploy base (the app is served under /gip-platform/layouts/). */
export const asset = (path) => `${import.meta.env.BASE_URL}${path.replace(/^\/+/, '')}`;

/** Projects with their own artwork in public/brand. The others get a monogram. */
export const LOGOS = {
  'global-city-vi': { mark: 'brand/global-city-vi-mark.svg', white: 'brand/global-city-vi-white.svg' },
};

/** 'Global City RRR' -> {top: 'GC', main: 'RRR'}; 'Western County – Shankarpalli' -> {top: '', main: 'WC'} */
export function monogram(name = '') {
  const words = name.split(/\s+[–-]\s+/)[0].split(/[\s-]+/).filter(Boolean);
  const last = words[words.length - 1] || '';
  if (words.length > 1 && /^[A-Z0-9]{1,4}$/.test(last)) return { top: words.slice(0, -1).map((w) => w[0]).join('').toUpperCase(), main: last };
  return { top: '', main: words.map((w) => w[0]).join('').slice(0, 3).toUpperCase() };
}

// Lazy chunks: one per project, fetched only when that project is opened. import.meta.glob also lets a layout that
// has not been exported yet fail as "not ready" instead of breaking the build.
const masterplans = import.meta.glob('../data/masterplans/*.json', { import: 'default' });
const landmarkFiles = import.meta.glob('../data/landmarks/*.json', { import: 'default' });

/**
 * The other mapped layouts within `km` of this one, nearest first, with their outlines as {lat, lng} rings
 * (outlines.json, written by tools/layouts/export_masterplans.py). Global City V and VI are 1.3 km apart.
 */
export function neighboursOf(id, km = 3) {
  const me = OUTLINES[id];
  if (!me) return [];
  return Object.entries(OUTLINES)
    .filter(([other]) => other !== id)
    .map(([other, o]) => ({ id: other, km: haversineKm(me.origin, o.origin), ring: o.ring.map(([lat, lng]) => ({ lat, lng })) }))
    .filter((n) => n.km <= km)
    .sort((a, b) => a.km - b.km);
}

export class MissingLayout extends Error {}
export function loadMasterplan(id) {
  const load = masterplans[`../data/masterplans/${id}.json`];
  return load ? load() : Promise.reject(new MissingLayout(id));
}
export function loadLandmarks(id) {
  const load = landmarkFiles[`../data/landmarks/${id}.json`];
  return load ? load().catch(() => null) : Promise.resolve(null);
}

// ---------------------------------------------------------------- public_content readers
export const approvals = (content) => (Array.isArray(content?.legal?.approvals) ? content.legal.approvals : []);
/** The layout permit (HMDA or DTCP) and the RERA number, for the project card. */
export function keyApprovals(content) {
  const list = approvals(content);
  return {
    permit: list.find((a) => a.authority === 'HMDA' || a.authority === 'DTCP'),
    rera: list.find((a) => a.authority === 'RERA'),
  };
}

/** {acres: 21, guntas: 10} -> '21 acres 10 guntas'; {acres: 16, approx: true} -> '16+ acres' */
export function landAreaText(la) {
  if (!la || !la.acres) return null;
  const acres = `${la.acres.toLocaleString('en-IN')}${la.approx ? '+' : ''} acre${la.acres === 1 && !la.approx ? '' : 's'}`;
  return la.guntas ? `${acres} ${la.guntas} guntas` : acres;
}

export function distanceText(d) {
  if (!d) return '';
  if ('text' in d) return d.text;
  return `${d.value.toLocaleString('en-IN')} ${d.unit}`;
}

export const pinOf = (content, data) => content?.location?.pin || data?.pin || data?.origin || null;
export const directionsUrl = (pin) => `https://www.google.com/maps/dir/?api=1&destination=${pin.lat},${pin.lng}`;

/** '2026-10-06' -> '6 Oct 2026' */
export const fmtDate = (iso) => (iso ? new Date(`${String(iso).slice(0, 10)}T00:00:00`).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '');

/** Cover first, then the gallery, de-duplicated. Only https images (the storage bucket). */
export function photos(content) {
  const m = content?.media || {};
  const seen = new Set();
  return [m.hero, m.cover, ...(m.gallery || [])].filter((a) => a?.kind === 'image' && /^https:\/\//.test(a.url) && !seen.has(a.url) && seen.add(a.url));
}

// ---------------------------------------------------------------- URL (?project=&plot=), shareable
export function readUrl() {
  const q = new URLSearchParams(window.location.search);
  return { project: q.get('project'), plot: q.get('plot')?.trim().replace(/^0+(?=\d)/, '') || null };
}
export function writeUrl(patch) {
  const url = new URL(window.location.href);
  for (const [k, v] of Object.entries(patch)) (v == null || v === '' ? url.searchParams.delete(k) : url.searchParams.set(k, v));
  if (url.href !== window.location.href) window.history.replaceState(window.history.state, '', url);
}
export function shareUrl(project, plot) {
  const url = new URL(window.location.href);
  url.search = '';
  url.hash = '';
  url.searchParams.set('project', project);
  if (plot != null) url.searchParams.set('plot', plot);
  return url.toString();
}
