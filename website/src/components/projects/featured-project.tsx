import { Download } from "lucide-react";
import type { StaticImageData } from "next/image";
import Link from "next/link";

import { entranceArch } from "@/assets/images";
import { Plate } from "@/components/site/plate";
import { StatusChip } from "@/components/site/typography";
import { Arrow, Button } from "@/components/ui/button";
import { LIFECYCLE_LABEL, projectTypeLabel } from "@/lib/constants";
import type { InventorySummary } from "@/lib/projects";
import type { Project } from "@/lib/types";

// ponytail: Global City VI's brochure copy and render. A project from the admin falls back to its own data and cover
// photo until it gets its own entry (or these fields move into the admin).
const COPY: Record<string, { image: StaticImageData; alt: string; subtitle: string; specs: string[] }> = {
  "global-city-vi": {
    image: entranceArch,
    alt: "Artist's impression: the entrance arch and main avenue of a gated plotted layout",
    subtitle: "Premium villa & open plots on 21 acres 10 guntas, Rudraram",
    specs: ["100 ft road facing", "40′ & 30′ CC roads", "Clubhouse & swimming pool", "HMDA mega gated township"],
  },
};

/**
 * A current project as one horizontal feature: the picture on the left (a slow zoom on hover), on the right the status,
 * the name, a spec sheet on hairlines, the registration, the brochure's spec tags and the two actions.
 */
export function FeaturedProject({ project, summary, preload }: { project: Project; summary: InventorySummary; preload?: boolean }) {
  const copy = COPY[project.id];
  const slug = project.publishing.slug;
  const href = project.publishing.externalUrl ?? `/projects/${slug}`;
  const rera = project.legal.approvals.find((a) => a.authority === "RERA")?.reference;
  const approvals = [...new Set(project.legal.approvals.map((a) => a.authority))].join(" & ");
  const place = project.location.short.split(/[,/]/)[0].trim();
  const sizes = summary.total ? `${Math.round(summary.minArea)}–${Math.round(summary.maxArea)} sq yd` : null;
  const image = copy?.image ?? project.media.cover?.url;
  const tags = copy?.specs ?? project.highlights.slice(0, 3);

  const facts = [
    { label: "Location", value: place },
    ...(summary.total ? [{ label: "Plots", value: String(summary.total) }] : []),
    ...(sizes ? [{ label: "Plot sizes", value: sizes }] : []),
    ...(approvals ? [{ label: "Approvals", value: approvals }] : []),
    { label: "Status", value: LIFECYCLE_LABEL[project.lifecycle] },
  ];

  return (
    <article aria-labelledby={`project-${slug}`} className="group/feature grid gap-10 lg:grid-cols-12 lg:items-center lg:gap-8">
      {image ? (
        <div className="lg:col-span-7">
          <Plate
            src={image}
            alt={copy?.alt ?? `${project.name}, site photograph`}
            impression={!!copy}
            preload={preload}
            sizes="(min-width: 1344px) 740px, (min-width: 1024px) 55vw, 100vw"
            position="50% 45%"
            className="aspect-[4/3]"
            imgClassName="transition-transform duration-700 ease-(--ease-out) group-hover/feature:scale-[1.03]"
          />
        </div>
      ) : null}

      <div className="lg:col-span-5 lg:col-start-8">
        {project.lifecycle === "ongoing" ? (
          <StatusChip>Selling now</StatusChip>
        ) : (
          <StatusChip tone="plain">{LIFECYCLE_LABEL[project.lifecycle]}</StatusChip>
        )}
        <h2 id={`project-${slug}`} className="mt-5 text-h2">
          {project.name}
        </h2>
        <p className="mt-3 text-lede text-text">{copy?.subtitle ?? `${projectTypeLabel(project)} · ${project.location.short}`}</p>

        <dl className="mt-8 border-t border-line">
          {facts.map((f) => (
            <div key={f.label} className="flex items-baseline justify-between gap-6 border-b border-line py-3.5">
              <dt className="text-small text-muted">{f.label}</dt>
              <dd className="text-right text-ui font-medium text-navy tabular-nums">{f.value}</dd>
            </div>
          ))}
        </dl>
        {rera ? <p className="mt-4 text-small text-muted">TS RERA Reg. No. {rera}</p> : null}

        {tags.length ? (
          <ul aria-label="Highlights" className="mt-6 flex flex-wrap gap-2">
            {tags.map((t) => (
              <li key={t} className="rounded-md bg-mist px-2.5 py-1.5 text-label text-navy">
                {t}
              </li>
            ))}
          </ul>
        ) : null}

        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Button asChild>
            <Link href={href}>
              View project <Arrow />
            </Link>
          </Button>
          {project.media.brochure ? (
            <Button asChild variant="secondary">
              <a href={project.media.brochure.url} target="_blank" rel="noreferrer">
                <Download aria-hidden /> Download brochure
              </a>
            </Button>
          ) : null}
        </div>
      </div>
    </article>
  );
}
