import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import { About } from "@/components/project/about";
import { Amenities } from "@/components/project/amenities";
import { Approvals } from "@/components/project/approvals";
import { Clubhouse } from "@/components/project/clubhouse";
import {
  approvalFacts,
  BROCHURE_ADDRESS,
  faqItems,
  firstPlace,
  highlights,
  photoDate,
  plotsByFacing,
  sitePhotos,
} from "@/components/project/content";
import { Enquire } from "@/components/project/enquire";
import { Faq } from "@/components/project/faq";
import { Gallery, type Slide } from "@/components/project/gallery";
import { Hero } from "@/components/project/hero";
import { Highlights } from "@/components/project/highlights";
import { FilmBand } from "@/components/project/interlude";
import { Location } from "@/components/project/location";
import { MasterPlan } from "@/components/project/master-plan";
import { PlotSizes } from "@/components/project/plot-sizes";
import { VillaDesigns } from "@/components/project/villas";
import { PageEnquiryContext } from "@/components/site/enquiry-provider";
import { COMPANY, LIFECYCLE_LABEL } from "@/lib/constants";
import { INTERESTS, WHATSAPP_TEXT, type InterestId } from "@/lib/enquiry";
import { formatDate, formatLandArea, formatNumber } from "@/lib/format";
import { getPlan, getProject, getProjects, getUnits, hasDetailPage, summarize } from "@/lib/projects";
import { breadcrumbJsonLd, JsonLd, ORGANIZATION_ID, pageMeta, SITE_URL } from "@/lib/seo";
import { OFFICE } from "@/lib/site";

type Params = { params: Promise<{ slug: string }> };

// `dynamicParams = false` is rejected under cacheComponents; unknown slugs fall through to notFound() instead.
export async function generateStaticParams() {
  const projects = await getProjects();
  return projects.filter(hasDetailPage).map((p) => ({ slug: p.publishing.slug }));
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const project = await getProject(slug);
  if (!project || !hasDetailPage(project)) return {};
  const units = await getUnits(project.id);
  const { hmda, parts } = approvalFacts(project);
  const seo = project.publishing.seo;
  return pageMeta({
    title: seo?.title ?? `${project.name} — ${hmda?.authority ?? "HMDA"} approved plots at ${firstPlace(project.location.short)}, ${project.location.district}`,
    description:
      seo?.description ??
      [
        `${formatNumber(units.length)} open and villa plots${project.landArea ? ` on ${formatLandArea(project.landArea)}` : ""} at ${project.location.short.split(",")[0].trim()}.`,
        parts.length ? `${parts.join(", ")}.` : null,
        "Plot sizes and facing, layout copy, site photos and approvals.",
      ]
        .filter(Boolean)
        .join(" "),
    path: `/projects/${slug}`,
  });
}

// `params` is awaited inside a Suspense boundary so the route keeps an instant-navigation shell (Next 16.4 logs an
// error otherwise); the one known slug is still fully prerendered.
export default function ProjectPage({ params }: Params) {
  return (
    <Suspense fallback={null}>
      <ProjectContent params={params} />
    </Suspense>
  );
}

async function ProjectContent({ params }: Params) {
  const { slug } = await params;
  const project = await getProject(slug);
  if (!project || !hasDetailPage(project)) notFound();

  const units = await getUnits(project.id);
  const summary = summarize(units);
  const plan = getPlan(project.id);
  const { hmda, rera } = approvalFacts(project);
  const photos = sitePhotos(project);
  const interest = (INTERESTS.some((i) => i.id === slug) ? slug : "other") as InterestId;
  const path = `/projects/${slug}`;
  const url = `${SITE_URL}${path}`;
  const pin = project.location.pin;
  const place = firstPlace(project.location.short);
  const min = Math.round(summary.minArea);
  const max = Math.round(summary.maxArea);
  const brochure = project.media.brochure?.url;
  const layoutPdf = project.media.masterPlan?.kind === "pdf" ? project.media.masterPlan.url : undefined;
  const area = project.landArea ? formatLandArea(project.landArea) : undefined;
  const landUse = plan?.landUse;
  const facingRows = plotsByFacing(units);

  // Real site photographs only: the client keeps artist's impressions out of the gallery (2026-10-26).
  const slides: Slide[] = photos.map((p, i) => {
    const date = photoDate(p);
    return {
      src: p.url,
      alt: p.alt ?? `${project.name} site photograph${date ? `, ${formatDate(date)}` : ""} (${i + 1} of ${photos.length})`,
      caption: date ? `Site photograph, ${formatDate(date)}` : "Site photograph",
    };
  });

  const listing = {
    "@context": "https://schema.org",
    "@type": "RealEstateListing",
    "@id": `${url}#listing`,
    name: project.name,
    url,
    description: project.description,
    datePosted: project.publishing.publishedAt,
    image: [project.media.cover?.url, ...photos.slice(0, 3).map((p) => p.url)].filter(Boolean),
    provider: { "@id": ORGANIZATION_ID },
    // showPrice is false: availability only, no price.
    offers: { "@type": "Offer", availability: "https://schema.org/InStock", seller: { "@id": ORGANIZATION_ID } },
    spatialCoverage: { "@id": `${url}#place` },
  };
  const placeLd = {
    "@context": "https://schema.org",
    "@type": "Place",
    "@id": `${url}#place`,
    name: `${project.name}, ${project.location.short}`,
    geo: pin ? { "@type": "GeoCoordinates", latitude: pin.lat, longitude: pin.lng } : undefined,
    address: {
      "@type": "PostalAddress",
      addressLocality: project.location.village ?? place,
      addressRegion: project.location.state,
      addressCountry: "IN",
    },
    additionalProperty: [
      area ? { "@type": "PropertyValue", name: "Extent", value: area } : null,
      units.length ? { "@type": "PropertyValue", name: "Plots", value: units.length } : null,
      hmda?.reference ? { "@type": "PropertyValue", name: "Approval", value: `${hmda.authority} final layout permit ${hmda.reference}` } : null,
      rera?.reference ? { "@type": "PropertyValue", name: "RERA", value: rera.reference } : null,
    ].filter(Boolean),
  };

  return (
    <>
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Home", path: "/" },
          { name: "Projects", path: "/projects" },
          { name: project.name, path },
        ])}
      />
      <JsonLd data={listing} />
      <JsonLd data={placeLd} />
      <PageEnquiryContext
        projectName={project.name}
        projectLocation={project.location.short}
        interest={interest}
        nav={{
          name: project.name,
          reg: [rera?.reference ? `TS RERA No: ${rera.reference}` : null, hmda?.reference ? `HMDA ${hmda.reference}` : null].filter(Boolean).join(" · "),
          links: [
            { href: "#top", label: "Overview" },
            { href: "#highlights", label: "Highlights" },
            { href: "#about", label: "About" },
            { href: "#amenities", label: "Amenities" },
            { href: "#villas", label: "Villas" },
            { href: "#plan", label: "Plan" },
            ...(facingRows.length ? [{ href: "#plots", label: "Plots" }] : []),
            { href: "#location", label: "Location" },
            ...(slides.length ? [{ href: "#gallery", label: "Gallery" }] : []),
            { href: "#approvals", label: "Approvals" },
            { href: "#faq", label: "FAQ" },
          ],
          brochure,
        }}
      />

      <Hero
        name={project.name}
        rera={rera?.reference}
        tagline={`Villa and open plots at ${place}, on the Mumbai Highway (NH-65)`}
        brochure={brochure}
        interest={interest}
        paragraphs={[
          `${hmda ? "HMDA-approved villa" : "Villa"} and open plots${area ? ` on ${area}` : ""} at ${place}, on the Mumbai Highway (NH-65) near GITAM University.`,
          `${project.name} is a gated layout of ${units.length} plots from ${min} to ${max} sq yd, with 40 ft and 30 ft CC roads, a clubhouse with a swimming pool, and a 100 ft road on its frontage.`,
        ]}
        info={{
          type: "Villa & open plots",
          plots: `${units.length} · ${min}–${max} sq yd`,
          status: [LIFECYCLE_LABEL[project.lifecycle], hmda && rera ? "HMDA & RERA approved" : null].filter(Boolean).join(" · "),
          location: `${place}, NH-65`,
        }}
      />
      <Highlights items={highlights(project, units, min, max, hmda, rera)} />
      <About
        intro={[
          project.description,
          "It is an HMDA mega gated township in a residential (R1) zone, abutting a 100 ft road on the master plan, with a grand entrance arch, an all-round compound wall and 40 ft and 30 ft CC roads throughout.",
          project.vision.description,
        ]}
        more={[
          landUse
            ? `The approved land use keeps ${formatNumber(landUse.park)} sq yd for parks and ${formatNumber(landUse.social)} sq yd for social infrastructure, with a clubhouse, a swimming pool, a community hall, a children's park and a cycle track inside the gates.`
            : "Parks, a clubhouse with a swimming pool, a community hall, a children's park and a cycle track sit inside the gates.",
          "Underground electricity with LED street lights, underground drainage, an overhead water tank with a water connection to each plot, avenue plantation with tree guards and rainwater harvesting pits are part of the plan. Titles are clear, bank loans are available, and we undertake villa construction on request.",
        ]}
      />
      <Amenities />
      <Clubhouse parkArea={landUse ? `${formatNumber(landUse.park)} sq yd` : undefined} />
      <VillaDesigns interest={interest} />
      <MasterPlan landUse={landUse} plots={units.length} pdf={layoutPdf} />
      {facingRows.length ? (
        <PlotSizes
          rows={facingRows}
          asOf={formatDate(project.inventoryUpdatedAt) || undefined}
          provisional={project.statusSample}
          interest={interest}
        />
      ) : null}
      <FilmBand name={project.name} interest={interest} acres={project.landArea?.acres} />
      <Location
        name={project.name}
        pin={pin}
        address={[
          ...BROCHURE_ADDRESS,
          [project.location.village && `${project.location.village} village`, project.location.mandal && `${project.location.mandal} mandal`, `${project.location.district} District`, project.location.state]
            .filter(Boolean)
            .join(", "),
        ]}
      />
      {slides.length ? <Gallery slides={slides} /> : null}
      <Approvals hmda={hmda} rera={rera} documents={project.legal.documents} brochure={brochure} layout={layoutPdf} />
      <Faq
        items={faqItems({ hmda, rera, plots: units.length, min, max, phone: COMPANY.phone, hours: OFFICE.hours })}
        whatsapp={WHATSAPP_TEXT.project(project.name, project.location.short)}
      />
      <Enquire name={project.name} interest={interest} />
    </>
  );
}
