// The one place display strings are made. Indian formats: en-IN grouping, ₹ with no space, ₹45.5 L / ₹1.69 Cr,
// dates as '14 Oct 2026' in IST. Dates are formatted by hand (no Intl month names: ICU prints 'Sept' in some
// locales and server/client time zones differ, which would break hydration).
import { AREA_UNIT_LABEL, DEMO_NOW } from './constants';
import type { AreaUnit, Facing, LandArea, Price } from './types';

const num2 = new Intl.NumberFormat('en-IN', { maximumFractionDigits: 2 });
const num1 = new Intl.NumberFormat('en-IN', { maximumFractionDigits: 1 });
const num0 = new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 });

export const formatNumber = (n: number) => num2.format(n);

/** ₹28,000 · ₹1,69,00,000 */
export const formatINR = (n: number) => `₹${num0.format(n)}`;

/** ₹1.69 Cr · ₹45.5 L · ₹96 L · below a lakh the full figure. */
export function formatINRCompact(n: number): string {
  const abs = Math.abs(n);
  if (abs >= 1e7) return `₹${num2.format(n / 1e7)} Cr`;
  if (abs >= 1e5) return `₹${num1.format(n / 1e5)} L`;
  return formatINR(n);
}

/** '₹28,000 / sq yd' · 'From ₹1.69 Cr' · 'Contact for price'. A non-empty label overrides. */
export function formatPrice(price: Price, label?: string): string {
  if (label?.trim()) return label.trim();
  switch (price.mode) {
    case 'per_area': return `${formatINR(price.amount)} / ${AREA_UNIT_LABEL[price.per]}`;
    case 'total': return `${price.from ? 'From ' : ''}${formatINRCompact(price.amount)}`;
    default: return 'Contact for price';
  }
}

/** '200 sq yd' · '1,650 sq ft' */
export const formatArea = (n: number, unit: AreaUnit) => `${formatNumber(n)} ${AREA_UNIT_LABEL[unit]}`;

/** '21 acres 10 guntas' · '16+ acres' · '25.17 acres' */
export function formatLandArea(a: LandArea): string {
  const acres = `${formatNumber(a.acres)}${a.approx ? '+' : ''} ${a.acres === 1 && !a.approx ? 'acre' : 'acres'}`;
  return a.guntas ? `${acres} ${a.guntas} ${a.guntas === 1 ? 'gunta' : 'guntas'}` : acres;
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const IST_MS = 330 * 60_000;

/** Calendar parts in IST for a 'YYYY-MM-DD' date or any ISO datetime. */
function istParts(iso: string) {
  const d = /^\d{4}-\d{2}-\d{2}$/.test(iso) ? new Date(`${iso}T00:00:00Z`) : new Date(Date.parse(iso) + IST_MS);
  return { y: d.getUTCFullYear(), m: d.getUTCMonth(), d: d.getUTCDate(), h: d.getUTCHours(), min: d.getUTCMinutes() };
}

/** '14 Oct 2026' */
export function formatDate(iso: string | undefined | null): string {
  if (!iso || Number.isNaN(Date.parse(iso))) return '';
  const p = istParts(iso);
  return `${p.d} ${MONTHS[p.m]} ${p.y}`;
}

/** '14 Oct 2026, 11:30' (IST, 24 h) */
export function formatDateTime(iso: string): string {
  if (Number.isNaN(Date.parse(iso))) return '';
  const p = istParts(iso);
  return `${formatDate(iso)}, ${String(p.h).padStart(2, '0')}:${String(p.min).padStart(2, '0')}`;
}

/**
 * 'just now' · '5 min ago' · '3 h ago' · 'yesterday' · '12 days ago' · '14 Oct 2026'. Future times read 'just now'.
 * A bare date ('2026-10-14') has no time, so it reads by day: 'today' · 'yesterday' · '12 days ago' · '14 Oct 2026'.
 */
export function formatRelative(iso: string, now: string = DEMO_NOW): string {
  if (/^\d{4}-\d{2}-\d{2}$/.test(iso)) {
    const days = Math.round((Date.parse(toIsoDate(now)) - Date.parse(iso)) / 86_400_000);
    if (Number.isNaN(days)) return '';
    return days <= 0 ? 'today' : days === 1 ? 'yesterday' : days < 30 ? `${days} days ago` : formatDate(iso);
  }
  const diff = Date.parse(now) - Date.parse(iso);
  if (Number.isNaN(diff)) return '';
  const min = Math.floor(diff / 60_000);
  if (min < 1) return 'just now';
  if (min < 60) return `${min} min ago`;
  const h = Math.floor(min / 60);
  if (h < 24) return `${h} h ago`;
  const days = Math.round((Date.parse(toIsoDate(now)) - Date.parse(toIsoDate(iso))) / 86_400_000);
  if (days <= 1) return 'yesterday';
  if (days < 30) return `${days} days ago`;
  return formatDate(iso);
}

/** ISO datetime → its IST calendar date 'YYYY-MM-DD'. */
export function toIsoDate(iso: string): string {
  if (/^\d{4}-\d{2}-\d{2}$/.test(iso)) return iso;
  const p = istParts(iso);
  return `${p.y}-${String(p.m + 1).padStart(2, '0')}-${String(p.d).padStart(2, '0')}`;
}

/** Epoch ms → '2026-10-14T11:30:00+05:30'. One format for every stored timestamp, so strings sort correctly. */
export function toIstIso(ms: number): string {
  return `${new Date(ms + IST_MS).toISOString().slice(0, 19)}+05:30`;
}

const FACING_SHORT: Record<Facing, string> = {
  East: 'E', West: 'W', North: 'N', South: 'S',
  'North-East': 'NE', 'North-West': 'NW', 'South-East': 'SE', 'South-West': 'SW',
};
/** 'East' or 'E' */
export const formatFacing = (f: Facing | undefined, short = false) => (f ? (short ? FACING_SHORT[f] : f) : '');

/** Rounded whole percent; 0 when total is 0. Use inventory.percents() when a set must sum to 100. */
export const pct = (part: number, total: number) => (total ? Math.round((part * 100) / total) : 0);

/** 'Global City – V & Co' → 'global-city-v-and-co' (publishing.slug rule ^[a-z0-9-]+$). */
export const slugify = (s: string) =>
  s.normalize('NFKD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/&/g, ' and ').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

/** 'plot' / 'plots' by count (nouns come from ProjectType). */
export const plural = (n: number, one: string, many: string) => `${formatNumber(n)} ${n === 1 ? one : many}`;
