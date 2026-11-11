import { Map as MapIcon } from "lucide-react";

import { Container } from "@/components/site/container";
import { Section } from "@/components/site/section";
import { Arrow, Button } from "@/components/ui/button";
import sketches from "@/lib/data/layout-sketches.json";
import { formatNumber } from "@/lib/format";
import type { InventorySummary } from "@/lib/projects";

type Sketch = { viewBox: string; boundary: string; roads: string; greens: string; plots: string; count: number };
const SKETCHES: Record<string, Sketch> = sketches;

/**
 * The way into the live layout: the copy and the Live Layout button on the left, the layout's own boundary sketch on
 * the right (roads, parks and every plot, drawn from the live layout's geometry by scripts/make-layout-sketches.mjs).
 * The sketch opens the live layout too.
 */
export function LiveLayoutBand({
  projectId,
  name,
  href,
  summary,
}: {
  projectId: string;
  name: string;
  href: string;
  summary: InventorySummary;
}) {
  const sketch = SKETCHES[projectId];
  return (
    <Section id="live-layout" tone="navy" rhythm="secondary" aria-labelledby="live-title">
      <Container className="grid gap-12 lg:grid-cols-12 lg:items-center lg:gap-x-10">
        <div className="lg:col-span-6">
          <h2 id="live-title" className="text-h2 text-white">
            Walk every plot on the live layout.
          </h2>
          <p className="mt-5 max-w-[56ch] text-body">
            The approved layout of {name} on the real map, in 2D and 3D, with each plot&rsquo;s status as it changes.
            {summary.total ? ` ${formatNumber(summary.counts.available)} of ${formatNumber(summary.total)} plots are available today.` : ""}
          </p>
          <Button asChild variant="teal" size="lg" className="mt-8 h-14 gap-3 rounded-full pr-6 pl-2 text-ui">
            <a href={href}>
              <span aria-hidden className="inline-flex size-10 items-center justify-center rounded-full bg-white/15 text-white">
                <MapIcon className="size-5" />
              </span>
              Live Layout
              <Arrow />
            </a>
          </Button>
        </div>
        {sketch ? (
          <a
            href={href}
            aria-label={`Open the live layout of ${name}`}
            className="group block rounded-lg outline-offset-4 lg:col-span-5 lg:col-start-8"
          >
            <svg
              viewBox={sketch.viewBox}
              role="img"
              aria-label={`Boundary sketch of the ${name} layout with its ${formatNumber(sketch.count)} plots`}
              className="mx-auto block max-h-[460px] w-full transition-opacity duration-500 ease-(--ease-out) group-hover:opacity-90"
            >
              <path d={sketch.greens} className="fill-teal/25" />
              <path d={sketch.roads} className="fill-white/10" />
              <path d={sketch.plots} className="fill-white/[0.06] stroke-white/55" strokeWidth={0.7} vectorEffect="non-scaling-stroke" />
              <path d={sketch.boundary} fill="none" className="stroke-teal" strokeWidth={2} strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
            </svg>
          </a>
        ) : null}
      </Container>
    </Section>
  );
}
