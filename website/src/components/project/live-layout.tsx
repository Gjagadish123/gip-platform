import { Container } from "@/components/site/container";
import { Section } from "@/components/site/section";
import { Arrow, Button } from "@/components/ui/button";
import { formatNumber } from "@/lib/format";
import type { InventorySummary } from "@/lib/projects";

/** The way into the live layout: every plot on the real map, with its status as it changes. */
export function LiveLayoutBand({ name, href, summary }: { name: string; href: string; summary: InventorySummary }) {
  return (
    <Section id="live-layout" tone="navy" rhythm="secondary" aria-labelledby="live-title">
      <Container className="grid gap-8 lg:grid-cols-12 lg:items-end lg:gap-x-10">
        <div className="lg:col-span-7">
          <h2 id="live-title" className="text-h2 text-white">
            Walk every plot on the live layout.
          </h2>
          <p className="mt-5 max-w-[56ch] text-body">
            The approved layout of {name} on the real map, in 2D and 3D, with each plot&rsquo;s status as it changes.
            {summary.total ? ` ${formatNumber(summary.counts.available)} of ${formatNumber(summary.total)} plots are available today.` : ""}
          </p>
        </div>
        <div className="lg:col-span-4 lg:col-start-9 lg:justify-self-end">
          <Button asChild variant="teal" size="lg">
            <a href={href}>
              Open the live layout <Arrow />
            </a>
          </Button>
        </div>
      </Container>
    </Section>
  );
}
