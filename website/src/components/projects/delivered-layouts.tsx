"use client";

import { useState } from "react";

import { Container } from "@/components/site/container";
import { Section } from "@/components/site/section";
import { StatusChip } from "@/components/site/typography";
import { COMPLETED_PROJECTS } from "@/lib/site";
import { cn } from "@/lib/utils";

const TOTAL = COMPLETED_PROJECTS.length;
const PLACES = [...new Set(COMPLETED_PROJECTS.map((p) => p.location))];

/**
 * `#delivered` (linked from the header, footer and home): the delivered register as rows on hairlines, two columns on
 * desktop, with a location filter above it. There are no photographs of these layouts, so there are no pictures.
 */
export function DeliveredLayouts() {
  const [place, setPlace] = useState<string | null>(null);
  const shown = place ? COMPLETED_PROJECTS.filter((p) => p.location === place) : COMPLETED_PROJECTS;

  return (
    <Section id="delivered" aria-labelledby="delivered-title">
      <Container>
        <div className="grid gap-6 lg:grid-cols-12 lg:items-end lg:gap-8">
          <h2 id="delivered-title" className="text-h2 lg:col-span-6">
            Delivered layouts
          </h2>
          <p className="max-w-[48ch] text-body text-text lg:col-span-5 lg:col-start-8">
            {TOTAL} plotted layouts completed across Hyderabad&rsquo;s growth corridors, from Yadadri to Shadnagar. Ask us
            about any of them.
          </p>
        </div>

        <div role="group" aria-label="Filter by location" className="mt-12 flex flex-wrap gap-2 lg:mt-16">
          {[null, ...PLACES].map((loc) => {
            const on = loc === place;
            return (
              <button
                key={loc ?? "all"}
                type="button"
                aria-pressed={on}
                onClick={() => setPlace(loc)}
                className={cn(
                  "h-10 rounded-md border px-3.5 text-label transition-colors duration-300 ease-(--ease-out)",
                  on ? "border-brand bg-brand text-white" : "border-line-strong bg-white text-navy hover:border-navy/35 hover:bg-mist",
                )}
              >
                {loc ?? `All (${TOTAL})`}
              </button>
            );
          })}
        </div>

        <p aria-live="polite" className="mt-8 text-small text-muted tabular-nums">
          Showing {shown.length} of {TOTAL}
        </p>
        {/* key: a new filter remounts the list so its rows fade in. */}
        <ul key={place ?? "all"} className="mt-4 grid animate-in duration-300 ease-(--ease-out) fade-in lg:grid-cols-2 lg:gap-x-12">
          {shown.map((p) => (
            <li
              key={p.name}
              className="flex items-center justify-between gap-4 border-b border-line py-5 first:border-t lg:[&:nth-child(2)]:border-t"
            >
              <div className="min-w-0">
                <h3 className="text-lede font-medium text-navy">{p.name}</h3>
                <p className="text-small text-muted">{p.location}</p>
              </div>
              <StatusChip tone="plain" className="shrink-0">
                Completed
              </StatusChip>
            </li>
          ))}
        </ul>
      </Container>
    </Section>
  );
}
