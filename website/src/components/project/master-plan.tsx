import { Download } from "lucide-react";

import { Container } from "@/components/site/container";
import { Section } from "@/components/site/section";
import { Button } from "@/components/ui/button";
import { formatNumber } from "@/lib/format";

import { BROCHURE_LP } from "./content";
import { PlanLightbox } from "./plan-lightbox";

/**
 * The master plan: the layout copy (opens full size) on the left; on the right the approved land use as one
 * proportional bar on a navy tonal scale, with a legend of rows and the net total.
 */
export function MasterPlan({
  landUse,
  plots,
  pdf,
}: {
  landUse?: { plotted: number; roads: number; park: number; social: number; utility: number; net: number };
  plots: number;
  pdf?: string;
}) {
  // Tints of navy-soft over white: #6f93bb, #a9c0da, #d5e0ec.
  const rows = landUse
    ? [
        { label: "Plotted", value: landUse.plotted, swatch: "bg-brand" },
        { label: "Roads", value: landUse.roads, swatch: "bg-navy-soft" },
        { label: "Parks", value: landUse.park, swatch: "bg-navy-soft/60" },
        { label: "Social infrastructure", value: landUse.social, swatch: "bg-navy-soft/35" },
        { label: "Utility", value: landUse.utility, swatch: "bg-navy-soft/18" },
      ]
    : [];
  const pct = (v: number) => (landUse ? `${(Math.round((v / landUse.net) * 1000) / 10).toFixed(1)}%` : "");

  return (
    <Section id="plan" aria-labelledby="plan-title">
      <Container>
        <h2 id="plan-title" className="text-h2">
          A layout planned plot by plot.
        </h2>
        <p className="mt-5 max-w-[64ch] text-body text-text">
          The approved layout copy shows all {plots} plots with their numbers and sizes, the 40 ft and 30 ft CC roads inside,
          the 100 ft road on the frontage, the parks, the clubhouse block, the utility area and the land kept for social
          infrastructure.
        </p>

        <div className="mt-10 grid gap-12 lg:mt-14 lg:grid-cols-12 lg:gap-x-10">
          <figure className="m-0 lg:col-span-6">
            <PlanLightbox pdf={pdf} />
            <figcaption className="mt-3 text-small text-muted">
              HMDA layout copy, LP {BROCHURE_LP.reference} dated {BROCHURE_LP.date}. Open it to zoom in.
            </figcaption>
          </figure>

          <div className="lg:sticky lg:top-40 lg:col-span-5 lg:col-start-8 lg:self-start">
            {landUse ? (
              <>
                <h3 className="text-h3">Land use</h3>
                <div
                  role="img"
                  aria-label={`Land use: ${rows.map((r) => `${r.label} ${pct(r.value)}`).join(", ")}`}
                  className="mt-6 flex h-10 gap-0.5 overflow-hidden rounded-md"
                >
                  {rows.map((r) => (
                    <span key={r.label} className={r.swatch} style={{ width: `${(r.value / landUse.net) * 100}%` }} />
                  ))}
                </div>
                <dl className="mt-6 border-t border-line">
                  {rows.map((r) => (
                    <div key={r.label} className="flex items-center gap-3 border-b border-line py-3.5">
                      <span aria-hidden className={`size-3 shrink-0 rounded-sm ${r.swatch}`} />
                      <dt className="min-w-0 flex-1 text-small text-text">{r.label}</dt>
                      <dd className="text-ui font-medium text-navy tabular-nums">{formatNumber(r.value)} sq yd</dd>
                      <dd className="w-14 text-right text-small text-muted tabular-nums">{pct(r.value)}</dd>
                    </div>
                  ))}
                  <div className="flex items-center gap-3 border-b border-line py-4">
                    <dt className="flex-1 text-ui font-semibold text-navy">Net layout area</dt>
                    <dd className="text-ui font-semibold text-navy tabular-nums">{formatNumber(landUse.net)} sq yd</dd>
                    <dd className="w-14 text-right text-small text-muted tabular-nums">100%</dd>
                  </div>
                </dl>
              </>
            ) : null}
            {pdf ? (
              <Button asChild variant="secondary" className={landUse ? "mt-8" : undefined}>
                <a href={pdf} target="_blank" rel="noreferrer" download>
                  <Download aria-hidden /> Download layout (PDF)
                </a>
              </Button>
            ) : null}
          </div>
        </div>
      </Container>
    </Section>
  );
}
