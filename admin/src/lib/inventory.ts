// Inventory helpers. parseSelection / percents / toStatus / splitRows / compressRanges are the tested reference code
// from research/inventory-ux.md §10 (scratchpad tools/range.mjs + tools/helpers.mjs), ported with types.
// Self-check: scratchpad checks/data-check.mjs.
import { UNIT_STATUSES, UNIT_STATUS_META } from './constants';
import type { AreaUnit, Project, ProjectType, SizeRange, Unit, UnitStatus } from './types';

/** Natural order: '2' < '10', '12' < '12A'. */
export const naturalCompare = new Intl.Collator('en', { numeric: true, sensitivity: 'base' }).compare;

const MAX_RANGE = 5000; // ponytail: guards "1-99999999" from freezing the tab; raise if a project ever has more units

/**
 * "1-40, 55, 60-62" → { ids, missing, errors }. Accepts "1 to 40", en/em dashes, prefixes ("A1-A20", "A1-3")
 * and ids with hyphens ("A-12"). `ids` are the matching unit numbers as spelled in `allNos`.
 * Without `allNos` every token counts as found (used to expand a typed range for generators).
 */
export function parseSelection(input: string, allNos?: string[]): { ids: string[]; missing: string[]; errors: string[] } {
  const byKey = allNos ? new Map(allNos.map((no) => [no.toLowerCase(), no])) : null;
  const find = (key: string) => (byKey ? byKey.get(key.toLowerCase()) : key);
  const out = new Set<string>(), missing: string[] = [], errors: string[] = [];
  const tokens = input
    .replace(/\s*(?:[-–—]|\bto\b)\s*/gi, '-') // "1 to 40", "1 – 40" -> "1-40"
    .split(/[\s,;]+/)
    .filter(Boolean);
  for (const t of tokens) {
    const r = /^(\D*?)(\d+)-(\D*?)(\d+)$/.exec(t);
    if (r && (r[3] === '' || r[3].toLowerCase() === r[1].toLowerCase())) {
      let [lo, hi] = [Number(r[2]), Number(r[4])];
      if (lo > hi) [lo, hi] = [hi, lo];
      if (hi - lo + 1 > MAX_RANGE) { errors.push(`${t}: more than ${MAX_RANGE} units`); continue; }
      for (let n = lo; n <= hi; n++) {
        const hit = find(`${r[1]}${n}`);
        if (hit) out.add(hit); else missing.push(`${r[1]}${n}`);
      }
    } else {
      const hit = find(t);
      if (hit) out.add(hit); else missing.push(t);
    }
  }
  return { ids: [...out], missing, errors };
}
/** Spec contract name for the range box parser. */
export const parseRange = parseSelection;

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

// Status words people actually type in spreadsheets -> the statuses. Unknown -> null (row flagged, never guessed).
const ALIASES: Record<UnitStatus, string[]> = {
  available: ['available', 'avl', 'avail', 'open', 'vacant', 'unsold', 'for sale', 'a'],
  sold_out: ['sold out', 'sold', 'soldout', 'booked', 's'],
  mortgaged: ['mortgaged', 'mortgage', 'mortgaged to hmda', 'hmda mortgage', 'dtcp mortgage', 'm'],
  registered: ['registered', 'regd', 'reg', 'registration done', 'sale deed done', 'r'],
  hold: ['hold', 'on hold', 'onhold', 'held', 'blocked', 'reserved', 'h'],
};
const LOOKUP = new Map(Object.entries(ALIASES).flatMap(([s, words]) => words.map((w) => [w, s as UnitStatus])));
export const toStatus = (v: unknown): UnitStatus | null =>
  LOOKUP.get(String(v ?? '').trim().toLowerCase().replace(/[\s_-]+/g, ' ')) ?? null;

/** Excel / Sheets paste is tab-separated; a typed list is comma-separated. */
export function splitRows(text: string): string[][] {
  const lines = text.replace(/\r/g, '').split('\n').filter((l) => l.trim());
  const sep = lines[0]?.includes('\t') ? '\t' : ',';
  return lines.map((l) => l.split(sep).map((c) => c.trim().replace(/^"(.*)"$/, '$1')));
}

/** Inverse of parseSelection: ['1','2','3','5','A1','A2'] → '1–3, 5, A1–A2'. Used in confirm dialogs and toasts. */
export function compressRanges(nos: string[]): string {
  const parts: string[] = [];
  let run: { prefix: string; from: number; to: number } | null = null;
  const flush = () => {
    if (run) parts.push(run.from === run.to ? `${run.prefix}${run.from}` : `${run.prefix}${run.from}–${run.prefix}${run.to}`);
  };
  for (const no of [...nos].sort(naturalCompare)) {
    const m = /^(\D*?)(\d+)$/.exec(no);
    if (m && run && run.prefix === m[1] && Number(m[2]) === run.to + 1) { run.to++; continue; }
    flush();
    run = m ? { prefix: m[1], from: Number(m[2]), to: Number(m[2]) } : null;
    if (!m) parts.push(no);
  }
  flush();
  return parts.join(', ');
}

/* ---------- spec helpers ---------- */

export type StatusCounts = Record<UnitStatus, number>;

/** Every status at 0, in client order. */
export const emptyCounts = () => Object.fromEntries(UNIT_STATUSES.map((s) => [s, 0])) as StatusCounts;

export function statusCounts(units: Unit[]): StatusCounts {
  const c = emptyCounts();
  for (const u of units) c[u.status]++;
  return c;
}

/** Counts in client order, for bars and percents(). */
export const countsInOrder = (c: StatusCounts) => UNIT_STATUSES.map((s) => c[s]);

/** ₹ total: explicit unit price, else area × the project's per-area rate. undefined when neither applies. */
export function unitPrice(u: Unit, p: Project): number | undefined {
  if (u.price != null) return u.price;
  return p.price.mode === 'per_area' && p.price.amount > 0 ? Math.round(u.area * p.price.amount) : undefined;
}

/** {min, max} of unit areas; null for an empty inventory. */
export function sizeRange(units: Unit[], unit: AreaUnit = 'sq_yd'): SizeRange | null {
  if (!units.length) return null;
  let min = Infinity, max = -Infinity;
  for (const u of units) { if (u.area < min) min = u.area; if (u.area > max) max = u.area; }
  return { min, max, unit };
}

export interface TransitionCheck {
  ok: boolean;          // false only for "already in that status" (skipped, counted as unchanged)
  needsNote?: boolean;  // guarded: confirm dialog with a required note
  warn?: string;        // text shown in the dialog
  confirm?: string;     // checkbox label that must be ticked
}

/**
 * Guards from inventory-ux §2. Every change is allowed (the admin is the source of truth and must fix mistakes);
 * guarded ones go through the confirm dialog.
 */
export function canTransition(from: UnitStatus, to: UnitStatus, type?: ProjectType): TransitionCheck {
  if (from === to) return { ok: false, warn: `Already ${UNIT_STATUS_META[to].label}, unchanged.` };
  if (from === 'registered') return { ok: true, needsNote: true, warn: 'Registration is final. Change this only to correct a mistake.' };
  if (from === 'sold_out' && to === 'available') return { ok: true, needsNote: true, warn: 'This puts a sold unit back on sale (for example, a cancelled booking).' };
  if (from === 'mortgaged' && (to === 'sold_out' || to === 'registered' || to === 'hold')) {
    return { ok: true, warn: "Mortgaged units can't be sold until the authority releases them.", confirm: 'Mortgage has been released' };
  }
  if (to === 'mortgaged' && (type?.id === 'villas' || type?.id === 'apartments')) {
    return { ok: true, warn: `${type.unitNounPlural} are rarely mortgaged to the authority. Check before saving.` };
  }
  return { ok: true };
}

/** A change needs the confirm dialog when it is guarded or touches more than 10 units (inventory-ux §4.5). */
export const isGuarded = (c: TransitionCheck) => Boolean(c.needsNote || c.confirm);

/** Activity line: 'Marked plot 142 Sold Out' · 'Marked 9 plots Registered: 3–4, 6–8, 10–13'. */
export function describeStatusChange(type: ProjectType, numbers: string[], to: UnitStatus): string {
  const label = UNIT_STATUS_META[to].label;
  if (numbers.length === 1) return `Marked ${type.unitNoun.toLowerCase()} ${numbers[0]} ${label}`;
  return `Marked ${numbers.length} ${type.unitNounPlural.toLowerCase()} ${label}: ${compressRanges(numbers)}`;
}
