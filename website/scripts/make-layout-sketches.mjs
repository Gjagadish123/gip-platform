// Writes src/lib/data/layout-sketches.json: a light line drawing of each digitised layout (boundary, roads, parks and
// plot outlines) for the "Walk every plot on the live layout" band on the project pages. The source is the live
// layouts app's own geometry (layouts/src/data/masterplans, metres east/north of each site's origin), so the sketch and
// the live layout always agree. Run again whenever a masterplan changes:  node scripts/make-layout-sketches.mjs
import { readdirSync, readFileSync, writeFileSync } from "node:fs";

const SRC = new URL("../../layouts/src/data/masterplans/", import.meta.url);
const OUT = new URL("../src/lib/data/layout-sketches.json", import.meta.url);
const PAD = 6; // metres around the drawing

const sketches = {};
for (const file of readdirSync(SRC).filter((f) => f.endsWith(".json")).sort()) {
  const m = JSON.parse(readFileSync(new URL(file, SRC), "utf8"));
  const { minX, maxX, minY, maxY } = m.extent;
  // SVG y runs down: flip north up. Half-metre precision is plenty for a sketch.
  const pt = ([x, y]) => `${Math.round((x - minX + PAD) * 2) / 2} ${Math.round((maxY - y + PAD) * 2) / 2}`;
  const ring = (xy) => (xy?.length ? `M${xy.map(pt).join("L")}Z` : "");
  const polys = (list) => (list ?? []).map((p) => ring(p.outer) + (p.holes ?? []).map(ring).join("")).join("");
  sketches[file.replace(/\.json$/, "")] = { // keyed by project id (the file name)
    viewBox: `0 0 ${Math.round(maxX - minX + 2 * PAD)} ${Math.round(maxY - minY + 2 * PAD)}`,
    boundary: ring(m.boundary),
    roads: polys(m.roads) + polys(m.road100),
    greens: polys(m.greens),
    plots: m.plots.map((p) => ring(p.xy)).join(""),
    count: m.plots.length,
  };
}
writeFileSync(OUT, JSON.stringify(sketches) + "\n");
console.log(Object.entries(sketches).map(([id, s]) => `${id}: ${s.count} plots, ${Math.round(JSON.stringify(s).length / 1024)} KB`).join("\n"));
