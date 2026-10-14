// Deterministic randomness for seed data (Math.random is banned in render/module scope under cacheComponents,
// and the client checks every number, so the demo must not change between reloads).

/** mulberry32: tiny seeded PRNG returning floats in [0, 1). */
export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** String → 32-bit seed (FNV-1a), so a project id can seed its own generator. */
export function hashSeed(s: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 0x01000193);
  return h >>> 0;
}

/** Stable id for seed rows: seededId('act', 7) → 'act-0007'. */
export const seededId = (prefix: string, n: number) => `${prefix}-${String(n).padStart(4, '0')}`;
