// Display strings, Indian formats: en-IN grouping, ₹ with no space, ₹45.5 L / ₹1.69 Cr, dates as '14 Oct 2026'.
// Dates are formatted by hand (no Intl month names) so server and client agree and hydration never breaks.
import { AREA_UNIT_LABEL } from './constants';
import type { AreaUnit, Distance, Facing, LandArea, Price } from './types';

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

/** '500 m' · '2 km' · '15 min' · 'Nearby' */
export function formatDistance(d: Distance): string {
  if ('text' in d) return d.text;
  return `${formatNumber(d.value)} ${d.unit}`;
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const IST_MS = 330 * 60_000;

function istParts(iso: string) {
  const d = /^\d{4}-\d{2}-\d{2}$/.test(iso) ? new Date(`${iso}T00:00:00Z`) : new Date(Date.parse(iso) + IST_MS);
  return { y: d.getUTCFullYear(), m: d.getUTCMonth(), d: d.getUTCDate() };
}

/** '14 Oct 2026' */
export function formatDate(iso: string | undefined | null): string {
  if (!iso || Number.isNaN(Date.parse(iso))) return '';
  const p = istParts(iso);
  return `${p.d} ${MONTHS[p.m]} ${p.y}`;
}

const FACING_SHORT: Record<Facing, string> = {
  East: 'E', West: 'W', North: 'N', South: 'S',
  'North-East': 'NE', 'North-West': 'NW', 'South-East': 'SE', 'South-West': 'SW',
};
export const formatFacing = (f: Facing | undefined, short = false) => (f ? (short ? FACING_SHORT[f] : f) : '');

/** Rounded whole percent; 0 when total is 0. */
export const pct = (part: number, total: number) => (total ? Math.round((part * 100) / total) : 0);

/** Whole-number percentages that always add up to 100 (largest remainder). [211, 30, 38, 9] → [73, 11, 13, 3]. */
export function percents(counts: number[]): number[] {
  const total = counts.reduce((a, b) => a + b, 0);
  if (!total) return counts.map(() => 0);
  const raw = counts.map((c) => (c * 100) / total);
  const out = raw.map(Math.floor);
  let left = 100 - out.reduce((a, b) => a + b, 0);
  raw.map((r, i) => [r - Math.floor(r), i] as const).sort((a, b) => b[0] - a[0]).forEach(([, i]) => { if (left-- > 0) out[i]++; });
  return out;
}
