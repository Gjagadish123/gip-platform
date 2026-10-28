import { cn } from "@/lib/utils";

/**
 * Stand-in for a layout with no real photograph: a plotted layout drawn in hairlines (plots in blocks, an avenue in
 * teal), varied per project from its id so neighbouring cards differ. `tone="dark"` draws it for a navy ground.
 * Decorative (aria-hidden).
 */
export function LayoutDrawing({ seed, tone = "light", className }: { seed: string; tone?: "light" | "dark"; className?: string }) {
  const rnd = seeded(seed);
  const cols = 6 + Math.floor(rnd() * 3);
  const rows = 4 + Math.floor(rnd() * 2);
  const avenueCol = 2 + Math.floor(rnd() * (cols - 4));
  const crossRow = 1 + Math.floor(rnd() * (rows - 2));
  const angle = -14 + rnd() * 28;
  const w = 34, d = 24, gap = 3, road = 14;
  const xs: number[] = [];
  const ys: number[] = [];
  for (let c = 0, x = 0; c < cols; c++) {
    xs.push(x);
    x += w + (c === avenueCol - 1 ? road : gap);
  }
  for (let r = 0, y = 0; r < rows; r++) {
    ys.push(y);
    y += d + (r === crossRow - 1 ? road : gap);
  }
  const width = xs[cols - 1] + w;
  const height = ys[rows - 1] + d;
  const avenueX = xs[avenueCol] - road / 2;
  const crossY = ys[crossRow] - road / 2;
  const dark = tone === "dark";

  return (
    <svg aria-hidden viewBox="0 0 400 300" className={cn("absolute inset-0 size-full", className)} preserveAspectRatio="xMidYMid slice">
      <g transform={`translate(200 150) rotate(${angle.toFixed(1)}) translate(${-width / 2} ${-height / 2})`}>
        <rect
          x={-10} y={-10} width={width + 20} height={height + 20} rx={6} strokeDasharray="4 4"
          className={dark ? "fill-white/[0.03] stroke-white/20" : "fill-white/70 stroke-navy/15"}
        />
        {ys.map((y, r) =>
          xs.map((x, c) => (
            <rect
              key={`${r}-${c}`} x={x} y={y} width={w} height={d} rx={1.5} strokeWidth={1}
              className={dark ? "fill-white/[0.04] stroke-white/30" : "fill-white stroke-navy/25"}
            />
          )),
        )}
        <line x1={avenueX} y1={-24} x2={avenueX} y2={height + 24} className="stroke-teal" strokeWidth={4} strokeLinecap="round" />
        <line x1={-24} y1={crossY} x2={width + 24} y2={crossY} className="stroke-teal/60" strokeWidth={2.5} strokeLinecap="round" />
      </g>
    </svg>
  );
}

/** A small deterministic random source (FNV-1a seed, xorshift-multiply steps): the same id draws the same layout. */
function seeded(seed: string) {
  let h = 2166136261;
  for (const ch of seed) h = Math.imul(h ^ ch.charCodeAt(0), 16777619);
  return () => {
    h = Math.imul(h ^ (h >>> 15), 2246822507) >>> 0;
    return h / 4294967296;
  };
}
