import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import { Amenities } from "@/components/project/amenities";
import { Approvals } from "@/components/project/approvals";
import { approvalFacts, firstPlace, nearbyGroups, photoDate, sitePhotos } from "@/components/project/content";
import { Enquire } from "@/components/project/enquire";
import { Faq } from "@/components/project/faq";
import { Gallery, type Slide } from "@/components/project/gallery";
import { Hero } from "@/components/project/hero";
import { Highlights } from "@/components/project/highlights";
import { FilmBand } from "@/components/project/interlude";
import { LiveLayoutBand } from "@/components/project/live-layout";
import { Location } from "@/components/project/location";
import { PageSectionBlock } from "@/components/project/page-section";
import { realHero } from "@/components/projects/cards";
import { PageEnquiryContext } from "@/components/site/enquiry-provider";
import { AREA_UNIT_LABEL, getProjectType, LIFECYCLE_LABEL, LIVE_LAYOUT_IDS, liveLayoutUrl } from "@/lib/constants";
import { formatDate, formatLandArea, formatNumber } from "@/lib/format";
import { getProject, getProjects, getUnits, hasDetailPage, summarize } from "@/lib/projects";
import { breadcrumbJsonLd, JsonLd, ORGANIZATION_ID, pageMeta, SITE_URL } from "@/lib/seo";

type Params = { params: Promise<{ slug: string }> };

const PERMITS = new Set(["HMDA", "DTCP", "RERA"]); // the bodies that approve or register a layout (not title or bank)

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
  const place = firstPlace(project.location.short);
  const seo = project.publishing.seo;
  return pageMeta({
    title:
      seo?.title ??
      `${project.name} — ${hmda ? `${hmda.authority} approved plots` : "plots"} at ${place}${project.location.district ? `, ${project.location.district}` : ""}`,
    description:
      seo?.description ??
      [
        units.length
          ? `${formatNumber(units.length)} plots${project.landArea ? ` on ${formatLandArea(project.landArea)}` : ""} at ${place}.`
          : project.description || null,
        parts.length ? `${parts.join(", ")}.` : null,
        "Site photos, approvals and the layout.",
      ]
        .filter(Boolean)
        .join(" "),
    path: `/projects/${slug}`,
  });
}

// `params` is awaited inside a Suspense boundary so the route keeps an instant-navigation shell (Next 16.4 logs an
// error otherwise); the known slugs are still fully prerendered.
export default function ProjectPage({ params }: Params) {
  return (
    <Suspense fallback={null}>
      <ProjectContent params={params} />
    </Suspense>
  );
}

/**
 * One page for every ongoing project, every word and picture from the admin. A section shows only when the admin has
 * content for it: hero, live layout (the mapped projects), highlights, page sections, amenities, the film band, location, gallery, approvals, FAQ, enquiry.
 */
async function ProjectContent({ params }: Params) {
  const { slug } = await params;
  const project = await getProject(slug);
  if (!project || !hasDetailPage(project)) notFound();

  const units = await getUnits(project.id);
  const summary = summarize(units);
  const type = getProjectType(project.typeId);
  const { hmda, rera } = approvalFacts(project);
  const photos = sitePhotos(project);
  const interest = project.id;
  const path = `/projects/${slug}`;
  const url = `${SITE_URL}${path}`;
  const { location: loc, media: m, legal } = project;
  const pin = loc.pin;
  const place = firstPlace(loc.short);
  const area = project.landArea ? formatLandArea(project.landArea) : undefined;
  const brochure = m.brochure?.url;
  const layoutPdf = m.masterPlan?.kind === "pdf" ? m.masterPlan.url : undefined;
  const liveLayout = LIVE_LAYOUT_IDS.includes(project.id) ? liveLayoutUrl(project.id) : undefined;

  // The film when there is one (its poster: the hero image, else a real photo); otherwise a real photograph.
  const photo = realHero(project);
  const video = m.heroVideo?.kind === "video" ? m.heroVideo : undefined;
  const media = video
    ? { label: video.alt || `Film of ${project.name}`, video: video.url, poster: m.hero?.url ?? photo?.src, impression: !!video.impression }
    : { label: photo?.alt ?? project.name, poster: photo?.src };

  const [min, max] = [Math.round(summary.minArea), Math.round(summary.maxArea)];
  const permits = [...new Set(legal.approvals.filter((a) => PERMITS.has(a.authority)).map((a) => a.authority))];
  const facts = [
    ["Type", project.typeLabel || type.name],
    units.length
      ? [type.unitNounPlural, `${formatNumber(units.length)} · ${min === max ? min : `${min}–${max}`} ${AREA_UNIT_LABEL[type.areaUnit]}`]
      : area
        ? ["Land", area]
        : null,
    ["Status", [LIFECYCLE_LABEL[project.lifecycle], permits.length ? `${permits.join(" & ")} approved` : null].filter(Boolean).join(" · ")],
    place ? ["Location", place] : null,
  ].filter((f): f is [string, string] => !!f);
  const intro = (project.heroIntro ?? []).map((p) => p.trim()).filter(Boolean);
  const sections = (project.sections ?? []).filter((s) => s.title || s.text || s.images.length || s.points.length);
  const amenities = project.amenities.visible ? project.amenities.items.filter((a) => a.name.trim()) : [];
  const faq = (project.faq ?? []).filter((f) => f.q.trim() && f.a.trim());
  const approvals = legal.approvals.filter((a) => PERMITS.has(a.authority));
  const documents = legal.documents;
  const villageLine = loc.village || loc.mandal
    ? [loc.village && `${loc.village} village`, loc.mandal && `${loc.mandal} mandal`, loc.district && `${loc.district} District`, loc.state]
        .filter(Boolean)
        .join(", ")
    : "";
  const address = [loc.full || loc.short, villageLine].filter(Boolean);

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
    name: `${project.name}, ${loc.short}`,
    geo: pin ? { "@type": "GeoCoordinates", latitude: pin.lat, longitude: pin.lng } : undefined,
    address: {
      "@type": "PostalAddress",
      addressLocality: loc.village ?? place,
      addressRegion: loc.state,
      addressCountry: "IN",
    },
    additionalProperty: [
      area ? { "@type": "PropertyValue", name: "Extent", value: area } : null,
      units.length ? { "@type": "PropertyValue", name: "Plots", value: units.length } : null,
      hmda?.reference ? { "@type": "PropertyValue", name: "Approval", value: `${hmda.authority} ${hmda.title} ${hmda.reference}` } : null,
      rera?.reference ? { "@type": "PropertyValue", name: "RERA", value: rera.reference } : null,
    ].filter(Boolean),
  };
  const crumbs = breadcrumbJsonLd([
    { name: "Home", path: "/" },
    { name: "Projects", path: "/projects" },
    { name: project.name, path },
  ]);
  const reg = [rera?.reference ? `TS RERA No: ${rera.reference}` : null, hmda?.reference ? `${hmda.authority} ${hmda.reference}` : null].filter(Boolean).join(" · ");
  const stats = project.masterPlan.stats.filter((s) => s.value.trim());

  return (
    <>
      <JsonLd data={crumbs} />
      <JsonLd data={listing} />
      <JsonLd data={placeLd} />
      <PageEnquiryContext
        projectName={project.name}
        projectLocation={loc.short}
        interest={interest}
        nav={{
          name: project.name,
          reg,
          links: [
            { href: "#top", label: "Overview" },
            ...(liveLayout ? [{ href: "#live-layout", label: "Live layout" }] : []),
            ...(stats.length || project.highlights.length ? [{ href: "#highlights", label: "Highlights" }] : []),
            ...(amenities.length ? [{ href: "#amenities", label: "Amenities" }] : []),
            { href: "#location", label: "Location" },
            ...(slides.length ? [{ href: "#gallery", label: "Gallery" }] : []),
            ...(approvals.length || documents.length ? [{ href: "#approvals", label: "Approvals" }] : []),
            ...(faq.length ? [{ href: "#faq", label: "FAQ" }] : []),
          ],
          brochure,
        }}
      />

      <Hero
        name={project.displayName || project.name}
        rera={rera?.reference}
        tagline={project.tagline || loc.short}
        brochure={brochure}
        interest={interest}
        liveLayout={liveLayout}
        paragraphs={intro.length ? intro : [project.description].filter(Boolean)}
        facts={facts}
        media={media}
      />
      {liveLayout ? <LiveLayoutBand projectId={project.id} name={project.name} href={liveLayout} summary={summary} /> : null}
      <Highlights stats={stats} points={project.highlights} />
      {sections.map((s) => (
        <PageSectionBlock key={s.id} section={s} interest={interest} />
      ))}
      {amenities.length ? <Amenities title={project.amenities.title} description={project.amenities.description} items={amenities} /> : null}
      {project.cta.title.trim() ? (
        <FilmBand title={project.cta.title} description={project.cta.description} interest={interest} media={media} />
      ) : null}
      <Location name={project.name} pin={pin} address={address} nearby={nearbyGroups(project)} image={m.locationImage} />
      {slides.length ? <Gallery slides={slides} /> : null}
      <Approvals
        title={legal.title}
        description={legal.description}
        approvals={approvals}
        documents={documents}
        brochure={brochure}
        layout={layoutPdf}
      />
      {faq.length ? <Faq items={faq} /> : null}
      <Enquire name={project.name} interest={interest} />
    </>
  );
}
