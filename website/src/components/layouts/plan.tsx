"use client";

import { memo, useId, type CSSProperties, type ReactNode } from "react";

import { pathOf, ringsPath, type LayoutPlan, type LiveUnit, type XY } from "@/lib/layouts";
import type { UnitStatus } from "@/lib/types";
import { cn } from "@/lib/utils";

import "./plan.css";

export type Basemap = "satellite" | "street" | "plan";

/** The status colours of the drawing (plan.css), for swatches and dots elsewhere on the page. */
export const STATUS_COLOR: Record<UnitStatus, string> = {
  available: "#13804a",
  sold_out: "#64748b", // lighter than Registered's navy, so the two dark statuses differ in lightness, not only hue
  mortgaged: "#b45309",
  registered: "#033967",
  hold: "#6b4fa0",
};

/**
 * A swatch for a status: solid for Available, hatched for every status that isn't for sale, as on the map, so the
 * difference doesn't rest on colour alone (Available and Mortgaged have the same lightness).
 */
export const statusSwatch = (s: UnitStatus): CSSProperties =>
  s === "available"
    ? { background: STATUS_COLOR[s] }
    : { backgroundColor: STATUS_COLOR[s], backgroundImage: "repeating-linear-gradient(135deg, rgb(255 255 255 / 0.6) 0 1.5px, transparent 1.5px 4px)" };

const deg = (rad: number) => (-rad * 180) / Math.PI; // ENU radians -> SVG degrees (y is flipped)

function inside([x, y]: XY, poly: XY[]) {
  let hit = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [xi, yi] = poly[i], [xj, yj] = poly[j];
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) hit = !hit;
  }
  return hit;
}

/**
 * Plot outlines filled by live status, with a hatch over every plot that isn't for sale (a second cue besides colour;
 * it lets clicks through to the plot). Memoised: zooming and hovering do not re-render the paths.
 */
const Plots = memo(function Plots({
  plan,
  units,
  match,
  hatch,
}: {
  plan: LayoutPlan;
  units: ReadonlyMap<string, LiveUnit>;
  match: ((u: LiveUnit) => boolean) | null;
  hatch: string;
}) {
  return (
    <g>
      {plan.plots.map((p) => {
        const u = units.get(p.n);
        const dim = u && match && !match(u) ? "" : undefined;
        return (
          <g key={p.n}>
            <path d={pathOf(p.xy)} data-n={p.n} data-s={u?.s ?? "none"} data-dim={dim} className="lp-plot" vectorEffect="non-scaling-stroke" />
            {u && u.s !== "available" ? <path d={pathOf(p.xy)} data-dim={dim} className="lp-hatch" fill={`url(#${hatch})`} /> : null}
          </g>
        );
      })}
    </g>
  );
});

const PlotNumbers = memo(function PlotNumbers({
  plan,
  units,
  match,
}: {
  plan: LayoutPlan;
  units: ReadonlyMap<string, LiveUnit>;
  match: ((u: LiveUnit) => boolean) | null;
}) {
  return (
    <>
      {plan.plots.map((p) => {
        const u = units.get(p.n);
        const x = p.c[0];
        const y = -p.c[1];
        return (
          <text key={p.n} x={x} y={y} transform={p.la ? `rotate(${deg(p.la)} ${x} ${y})` : undefined} data-dim={u && match && !match(u) ? "" : undefined}>
            {p.n}
          </text>
        );
      })}
    </>
  );
});

const Site = memo(function Site({ plan }: { plan: LayoutPlan }) {
  return (
    <>
      {plan.boundary ? <path d={pathOf(plan.boundary)} className="lp-ground" /> : null}
      {plan.greens.length ? <path d={ringsPath(plan.greens)} className="lp-green" /> : null}
      {plan.zones.map((z) => (
        <path key={z.id} d={pathOf(z.xy)} className="lp-zone" vectorEffect="non-scaling-stroke" />
      ))}
      {plan.access.map((a, i) => (
        <path key={`${a.name}-${i}`} d={pathOf(a.xy)} className="lp-access" vectorEffect="non-scaling-stroke" />
      ))}
      {plan.roads.length ? <path d={ringsPath(plan.roads)} className="lp-road" vectorEffect="non-scaling-stroke" /> : null}
      {plan.boundary ? <path d={pathOf(plan.boundary)} className="lp-halo" vectorEffect="non-scaling-stroke" /> : null}
    </>
  );
});

/**
 * The layout drawn in metres (x east, y north, flipped for SVG). `pxPerM` is the on-screen scale: labels keep a constant
 * screen size and appear only once they fit, strokes are screen-pixel hairlines at every zoom.
 */
export function PlanSvg({
  plan,
  units,
  match,
  selected,
  flashing,
  mode,
  pxPerM,
  viewBox,
  className,
  style,
  children,
}: {
  plan: LayoutPlan;
  units: ReadonlyMap<string, LiveUnit>;
  match: ((u: LiveUnit) => boolean) | null;
  selected: string | null;
  flashing: ReadonlyMap<string, number>;
  mode: Basemap;
  pxPerM: number;
  viewBox: string;
  className?: string;
  style?: React.CSSProperties;
  children?: ReactNode;
}) {
  const hatch = `${useId().replace(/:/g, "")}-hatch`; // one per drawing: the map and the plan view can both be mounted
  const sel = selected ? plan.plots.find((p) => p.n === selected) : undefined;
  const px = (n: number) => n / pxPerM; // screen px -> metres
  const plotLabelPx = Math.min(13, Math.max(9.5, 3.1 * pxPerM));
  const showPlotLabels = pxPerM >= 2.3;
  const showRoadLabels = pxPerM >= 1.5;
  const showZoneLabels = pxPerM >= 1.1;
  // An access road the drawing labels on the road keeps its full name ("Existing 30 ft road") in that label's place.
  const own = showRoadLabels ? plan.roadLabels.map((l) => plan.access.find((a) => l.t.startsWith(`${a.w} ft`) && inside(l.at, a.xy))) : [];

  return (
    <svg
      viewBox={viewBox}
      preserveAspectRatio="none"
      className={cn("lp-svg", `lp-${mode}`, className)}
      style={style}
      aria-hidden
    >
      <defs>
        {/* White stripes 7 screen px apart at every zoom. */}
        <pattern id={hatch} patternUnits="userSpaceOnUse" width={px(7)} height={px(7)} patternTransform="rotate(45)">
          <rect width={px(2)} height={px(7)} fill="rgb(255 255 255 / 0.55)" />
        </pattern>
      </defs>
      <Site plan={plan} />
      <Plots plan={plan} units={units} match={match} hatch={hatch} />
      {[...flashing].map(([n, key]) => {
        const p = plan.plots.find((q) => q.n === n);
        return p ? <path key={`${n}-${key}`} d={pathOf(p.xy)} className="lp-flash" vectorEffect="non-scaling-stroke" /> : null;
      })}
      {/* Two tones, so one of them stands out against any fill or ground (navy casing, teal line). */}
      {sel ? <path d={pathOf(sel.xy)} className="lp-selected-casing" vectorEffect="non-scaling-stroke" /> : null}
      {sel ? <path d={pathOf(sel.xy)} className="lp-selected" vectorEffect="non-scaling-stroke" /> : null}
      {plan.boundary ? <path d={pathOf(plan.boundary)} className="lp-boundary" vectorEffect="non-scaling-stroke" /> : null}

      {showZoneLabels ? (
        <g className="lp-zone-labels" style={{ fontSize: px(11), strokeWidth: px(3) }}>
          {/* A name shows once it fits inside its area around its label point (~6.6 px a character with the halo, 14 px
              tall), so small utility plots and thin strips stay unlabelled until zoomed in. */}
          {plan.zones.map((z) =>
            z.name.length * 3.3 <= z.room[0] * pxPerM && 7 <= z.room[1] * pxPerM ? (
              <text key={z.id} x={z.c[0]} y={-z.c[1]}>
                {z.name}
              </text>
            ) : null,
          )}
        </g>
      ) : null}
      {showRoadLabels ? (
        <g className="lp-road-labels" style={{ fontSize: px(10), strokeWidth: px(3) }}>
          {plan.roadLabels.map((l, i) => (
            <text key={i} x={l.at[0]} y={-l.at[1]} transform={`rotate(${-l.r} ${l.at[0]} ${-l.at[1]})`}>
              {own[i]?.name ?? l.t}
            </text>
          ))}
          {plan.access.map((a, i) => {
            if (own.includes(a)) return null; // named on the road above
            const c = a.xy.reduce((s, q) => [s[0] + q[0] / a.xy.length, s[1] + q[1] / a.xy.length], [0, 0]);
            return (
              <text key={`${a.name}-${i}`} x={c[0]} y={-c[1]}>
                {a.name}
              </text>
            );
          })}
        </g>
      ) : null}
      {showPlotLabels ? (
        <g className="lp-labels" style={{ fontSize: px(plotLabelPx), strokeWidth: px(2.6) }}>
          <PlotNumbers plan={plan} units={units} match={match} />
        </g>
      ) : null}
      {children}
    </svg>
  );
}

/** viewBox of the plan's extent (metres, y flipped), padded. */
export function planBox(plan: LayoutPlan, pad = 0) {
  const e = plan.extent!;
  return { x: e.minX - pad, y: -e.maxY - pad, w: e.maxX - e.minX + 2 * pad, h: e.maxY - e.minY + 2 * pad };
}
