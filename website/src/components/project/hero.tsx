import { Download } from "lucide-react";

import { Container } from "@/components/site/container";
import { EnquireButton } from "@/components/site/enquire-button";
import { Button } from "@/components/ui/button";
import type { InterestId } from "@/lib/enquiry";

import { Film } from "./film";

/**
 * The project hero: the aerial film full-bleed under the header and section bar, the name and one line over a navy-deep
 * fade, the two actions bottom-right. A white fact panel rides over the film's lower edge (stacked below it on phones),
 * then the two opening paragraphs.
 */
export function Hero({
  name,
  rera,
  tagline,
  paragraphs,
  info,
  brochure,
  interest,
}: {
  name: string;
  rera?: string;
  tagline: string;
  paragraphs: string[];
  info: { type: string; plots: string; status: string; location: string };
  brochure?: string;
  interest: InterestId;
}) {
  const facts = [
    ["Type", info.type],
    ["Plots", info.plots],
    ["Status", info.status],
    ["Location", info.location],
  ];
  const [lead, ...rest] = paragraphs;

  return (
    <section id="top" aria-labelledby="hero-title" className="relative pt-28 lg:pt-32">
      <Film
        label={`Aerial film of a gated plotted layout, an artist's impression of ${name}`}
        className="aspect-[4/5] w-full sm:aspect-auto sm:h-[min(78vh,820px)] sm:min-h-[30rem]"
        chromeClassName="lg:bottom-12"
      >
        <div aria-hidden className="absolute inset-x-0 bottom-0 h-full bg-linear-to-t from-navy-deep/95 via-navy-deep/55 to-transparent sm:h-3/4 sm:from-navy-deep/90 sm:via-navy-deep/45" />
        <div className="on-navy absolute inset-x-0 bottom-0 pb-14 lg:pb-30">
          <Container className="lg:flex lg:items-end lg:justify-between lg:gap-10">
            <div className="max-w-[40rem]">
              {rera ? (
                <p className="inline-flex rounded-md bg-white/12 px-2.5 py-1 text-label text-white backdrop-blur-sm">TS RERA Reg. No. {rera}</p>
              ) : null}
              <h1 id="hero-title" className="mt-4 text-display text-white">
                {name}
              </h1>
              <p className="mt-3 text-lede text-white/80">{tagline}</p>
            </div>
            <div className="mt-6 flex flex-wrap gap-3 lg:mt-0 lg:shrink-0">
              <EnquireButton variant="light" arrow interest={interest}>
                Book a site visit
              </EnquireButton>
              {brochure ? (
                <Button asChild variant="outline-light">
                  <a href={brochure} target="_blank" rel="noreferrer" download>
                    <Download aria-hidden /> Download brochure
                  </a>
                </Button>
              ) : null}
            </div>
          </Container>
        </div>
      </Film>

      <Container className="relative z-10 mt-6 lg:-mt-12">
        <dl className="grid grid-cols-2 gap-px overflow-hidden rounded-lg border border-line bg-line shadow-raise lg:grid-cols-4">
          {facts.map(([label, value]) => (
            <div key={label} className="bg-white px-5 py-4 lg:px-7 lg:py-6">
              <dt className="text-small text-muted">{label}</dt>
              <dd className="mt-1 text-ui font-medium text-navy">{value}</dd>
            </div>
          ))}
        </dl>
      </Container>

      <Container className="mt-14 grid gap-6 lg:mt-20 lg:grid-cols-12 lg:gap-x-10">
        <p className="max-w-[60ch] text-lede text-text lg:col-span-6">{lead}</p>
        {rest.map((p) => (
          <p key={p} className="max-w-[60ch] text-body text-text lg:col-span-5 lg:col-start-8">
            {p}
          </p>
        ))}
      </Container>
    </section>
  );
}
