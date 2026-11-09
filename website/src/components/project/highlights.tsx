import { Check } from "lucide-react";

import { Container } from "@/components/site/container";
import { Reveal } from "@/components/site/reveal";
import { Section } from "@/components/site/section";
import { ICONS } from "@/lib/constants";
import type { LayoutStat } from "@/lib/types";

/** Key highlights: the heading holds on the left while the specification (the admin's layout stats) runs as a
 * two-column ledger on hairlines, with the short highlights under it. */
export function Highlights({ stats, points }: { stats: LayoutStat[]; points: string[] }) {
  if (!stats.length && !points.length) return null;
  return (
    <Section id="highlights" aria-labelledby="highlights-title">
      <Container className="lg:grid lg:grid-cols-12 lg:gap-x-10">
        <div className="lg:col-span-4">
          <h2 id="highlights-title" className="max-w-[14ch] text-h2 lg:sticky lg:top-40">
            Land that&rsquo;s ready to build on.
          </h2>
        </div>
        <Reveal className="mt-10 lg:col-span-8 lg:mt-0">
          {stats.length ? (
            <ul className="grid border-t border-line sm:grid-cols-2">
              {stats.map(({ id, icon, value, label }) => {
                const Icon = (icon && ICONS[icon]) || Check;
                return (
                  <li key={id} className="flex gap-4 border-b border-line py-6 sm:odd:pr-8 sm:even:pl-8 lg:py-7">
                    <Icon aria-hidden className="mt-1 size-5 shrink-0 text-navy-soft" />
                    <div className="min-w-0">
                      <p className="text-h3 break-words text-navy">{value}</p>
                      {label ? <p className="mt-1 text-small break-words text-muted">{label}</p> : null}
                    </div>
                  </li>
                );
              })}
            </ul>
          ) : null}
          {points.length ? (
            <ul className={stats.length ? "mt-10 flex flex-wrap gap-2" : "grid border-t border-line sm:grid-cols-2"}>
              {points.map((h) =>
                stats.length ? (
                  <li key={h} className="inline-flex items-center gap-2 rounded-md bg-mist px-3 py-2 text-small font-medium text-navy">
                    <Check aria-hidden className="size-4 shrink-0 text-teal-deep" />
                    {h}
                  </li>
                ) : (
                  <li key={h} className="flex gap-4 border-b border-line py-5 sm:odd:pr-8 sm:even:pl-8">
                    <Check aria-hidden className="mt-1 size-5 shrink-0 text-teal-deep" />
                    <p className="text-ui font-medium text-navy">{h}</p>
                  </li>
                ),
              )}
            </ul>
          ) : null}
        </Reveal>
      </Container>
    </Section>
  );
}
