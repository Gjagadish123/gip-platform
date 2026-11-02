import { BadgeCheck, Check, Download, FileCheck2, Map as MapIcon } from "lucide-react";
import Image from "next/image";

import { realCover } from "@/components/projects/cards";
import { Container } from "@/components/site/container";
import { EnquireButton } from "@/components/site/enquire-button";
import { Reveal } from "@/components/site/reveal";
import { Section } from "@/components/site/section";
import { TextLink } from "@/components/site/text-link";
import { Arrow, Button } from "@/components/ui/button";
import { LIFECYCLE_LABEL, liveLayoutUrl } from "@/lib/constants";
import type { InterestId } from "@/lib/enquiry";
import { formatDate, formatLandArea, formatNumber } from "@/lib/format";
import type { InventorySummary } from "@/lib/projects";
import { RERA_PORTAL } from "@/lib/site";
import type { Project } from "@/lib/types";

import { firstPlace, mapsDirections, mapsEmbed, photoDate, sitePhotos } from "./content";
import { Enquire } from "./enquire";
import { Gallery, type Slide } from "./gallery";
import { CopyButton } from "./parts";

const PERMITS = new Set(["HMDA", "DTCP", "RERA"]); // the bodies that approve or register a layout
// The sites' Google listing pins, until the admin sets location.pin for them (a search by name finds other
// "Western County" layouts too).
const LISTING_PINS: Record<string, { lat: number; lng: number }> = {
  "global-city-v": { lat: 17.5280933, lng: 78.136843 },
  "global-city-rrr": { lat: 17.5889915, lng: 78.0067475 },
  "western-county": { lat: 17.4742058, lng: 78.1389772 },
};

/**
 * The project page for a live layout without its own brochure page (Global City V, Global City RRR, Western County):
 * what the admin publishes (description, highlights, photos, approvals, address) around the way into its live layout.
 * Global City VI keeps its full page (app/projects/[slug]).
 */
export function BasicProjectPage({ project, summary, interest }: { project: Project; summary: InventorySummary; interest: InterestId }) {
  const place = firstPlace(project.location.short);
  const live = liveLayoutUrl(project.id);
  const cover = realCover(project);
  const brochure = project.media.brochure?.url;
  const approvals = project.legal.approvals.filter((a) => PERMITS.has(a.authority));
  const rera = approvals.find((a) => a.authority === "RERA");
  const [min, max] = [Math.round(summary.minArea), Math.round(summary.maxArea)];
  const pin = project.location.pin ?? LISTING_PINS[project.id];
  const photos = sitePhotos(project);
  const slides: Slide[] = photos.map((p, i) => {
    const date = photoDate(p);
    return {
      src: p.url,
      alt: p.alt ?? `${project.name} site photograph${date ? `, ${formatDate(date)}` : ""} (${i + 1} of ${photos.length})`,
      caption: date ? `Site photograph, ${formatDate(date)}` : "Site photograph",
    };
  });
  const facts = [
    summary.total ? ["Plots", `${formatNumber(summary.total)} · ${min === max ? min : `${min}–${max}`} sq yd`] : null,
    project.landArea ? ["Land", formatLandArea(project.landArea)] : null,
    approvals.length ? ["Approvals", [...new Set(approvals.map((a) => a.authority))].join(" & ")] : null,
    ["Status", LIFECYCLE_LABEL[project.lifecycle]],
  ].filter((f): f is string[] => !!f);

  return (
    <>
      <section id="top" aria-labelledby="hero-title" className="pt-32 pb-16 lg:pt-40 lg:pb-24">
        <Container className="grid gap-10 lg:grid-cols-12 lg:items-center lg:gap-x-10">
          <div className="lg:col-span-6">
            {rera?.reference ? <p className="inline-flex rounded-md bg-mist px-2.5 py-1 text-label text-navy">TS RERA Reg. No. {rera.reference}</p> : null}
            <h1 id="hero-title" className="mt-4 text-display text-navy">
              {project.name}
            </h1>
            <p className="mt-3 text-lede text-muted">{project.location.short}</p>
            {project.description ? <p className="mt-6 max-w-[56ch] text-body text-text">{project.description}</p> : null}
            <div className="mt-8 flex flex-wrap gap-3">
              <Button asChild>
                <a href={live}>
                  <MapIcon aria-hidden /> View live layout <Arrow />
                </a>
              </Button>
              <EnquireButton variant="secondary" interest={interest}>
                Book a site visit
              </EnquireButton>
              {brochure ? (
                <Button asChild variant="ghost">
                  <a href={brochure} target="_blank" rel="noreferrer" download>
                    <Download aria-hidden /> Brochure
                  </a>
                </Button>
              ) : null}
            </div>
          </div>
          {cover ? (
            <div className="relative aspect-[4/3] overflow-hidden rounded-2xl bg-mist lg:col-span-6">
              <Image src={cover.src} alt={cover.alt} fill priority sizes="(min-width: 1024px) 50vw, 100vw" className="object-cover" />
            </div>
          ) : null}
        </Container>

        <Container className="mt-12 lg:mt-16">
          <dl className="grid grid-cols-2 gap-px overflow-hidden rounded-lg border border-line bg-line lg:grid-cols-4">
            {facts.map(([label, value]) => (
              <div key={label} className="bg-white px-5 py-4 lg:px-7 lg:py-6">
                <dt className="text-small text-muted">{label}</dt>
                <dd className="mt-1 text-ui font-medium text-navy tabular-nums">{value}</dd>
              </div>
            ))}
          </dl>
        </Container>
      </section>

      {/* the way into the live layout: every plot on the real map, with its status as it changes */}
      <Section id="live-layout" tone="navy" rhythm="secondary" aria-labelledby="live-title">
        <Container className="grid gap-8 lg:grid-cols-12 lg:items-end lg:gap-x-10">
          <div className="lg:col-span-7">
            <h2 id="live-title" className="text-h2 text-white">
              Walk every plot on the live layout.
            </h2>
            <p className="mt-5 max-w-[56ch] text-body">
              The approved layout of {project.name} on the real map, in 2D and 3D, with each plot&rsquo;s status as it
              changes.
              {summary.total ? ` ${formatNumber(summary.counts.available)} of ${formatNumber(summary.total)} plots are available today.` : ""}
            </p>
          </div>
          <div className="lg:col-span-4 lg:col-start-9 lg:justify-self-end">
            <Button asChild variant="teal" size="lg">
              <a href={live}>
                Open the live layout <Arrow />
              </a>
            </Button>
          </div>
        </Container>
      </Section>

      {project.highlights.length ? (
        <Section id="highlights" aria-labelledby="highlights-title">
          <Container className="lg:grid lg:grid-cols-12 lg:gap-x-10">
            <h2 id="highlights-title" className="max-w-[14ch] text-h2 lg:col-span-4">
              Why {place}.
            </h2>
            <Reveal className="mt-10 lg:col-span-8 lg:mt-0">
              <ul className="grid border-t border-line sm:grid-cols-2">
                {project.highlights.map((h) => (
                  <li key={h} className="flex gap-4 border-b border-line py-5 sm:odd:pr-8 sm:even:pl-8">
                    <Check aria-hidden className="mt-1 size-5 shrink-0 text-teal-deep" />
                    <p className="text-ui font-medium text-navy">{h}</p>
                  </li>
                ))}
              </ul>
            </Reveal>
          </Container>
        </Section>
      ) : null}

      {slides.length ? <Gallery slides={slides} /> : null}

      {approvals.length ? (
        <Section id="approvals" tone="mist" aria-labelledby="approvals-title">
          <Container>
            <h2 id="approvals-title" className="max-w-[16ch] text-h2">
              Approvals you can check yourself.
            </h2>
            <ul className="mt-10 grid gap-4 md:grid-cols-3 lg:mt-14">
              {approvals.map((a) => {
                const Icon = a.authority === "RERA" ? BadgeCheck : FileCheck2;
                return (
                  <li key={a.id} className="flex flex-col rounded-lg border border-line bg-white p-7">
                    <div className="flex items-center justify-between gap-4">
                      <span className="rounded-md bg-mist px-2.5 py-1 text-label text-navy">{a.authority === "RERA" ? "TS RERA" : a.authority}</span>
                      <Icon aria-hidden className="size-6 text-navy-soft" />
                    </div>
                    <h3 className="mt-8 text-h3">{a.title}</h3>
                    {a.reference ? (
                      <div className="mt-2 flex items-start gap-2">
                        <p className="min-w-0 flex-1 text-body font-medium [overflow-wrap:anywhere] text-navy tabular-nums lg:text-lede">{a.reference}</p>
                        <CopyButton value={a.reference} label={`${a.title} number`} />
                      </div>
                    ) : null}
                    {a.date || a.description ? (
                      <p className="mt-3 text-small text-muted">{[a.date ? `Issued ${formatDate(a.date)}` : null, a.description].filter(Boolean).join(" · ")}</p>
                    ) : null}
                    {a.authority === "RERA" ? (
                      <div className="mt-auto pt-6">
                        <TextLink href={RERA_PORTAL} external>
                          Verify on rera.telangana.gov.in
                        </TextLink>
                      </div>
                    ) : null}
                  </li>
                );
              })}
            </ul>
          </Container>
        </Section>
      ) : null}

      <Section id="location" aria-labelledby="location-title">
        <Container className="grid gap-10 lg:grid-cols-12 lg:gap-x-10">
          <div className="lg:col-span-5">
            <h2 id="location-title" className="text-h2">
              The location
            </h2>
            <address className="mt-6 text-body text-text not-italic">{project.location.full}</address>
            <TextLink
              href={pin ? mapsDirections(pin) : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${project.name}, ${project.location.full}`)}`}
              external
              className="mt-5"
            >
              {pin ? "Directions" : "Find it on Google Maps"}
            </TextLink>
            <p className="mt-8 text-small text-muted">The live layout shows the site on the satellite map, with the roads around it.</p>
            <TextLink href={live} className="mt-3">
              See it on the live layout
            </TextLink>
          </div>
          {pin ? (
            <iframe
              title={`Map showing ${project.name}`}
              src={mapsEmbed(pin)}
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              className="block aspect-[4/3] w-full rounded-lg border border-line bg-mist lg:col-span-6 lg:col-start-7"
            />
          ) : null}
        </Container>
      </Section>

      <Enquire name={project.name} interest={interest} />
    </>
  );
}
