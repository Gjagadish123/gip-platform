import type { Metadata } from "next";

import { toCard, type ProjectCardData } from "@/components/projects/cards";
import { ProjectGrid } from "@/components/projects/project-grid";
import { ProjectsHero } from "@/components/projects/projects-hero";
import { FAQ, ProjectsFaq } from "@/components/projects/projects-faq";
import { Closing } from "@/components/site/closing";
import { formatNumber } from "@/lib/format";
import { getProjects, getUnits, hasDetailPage, summarize } from "@/lib/projects";
import { JsonLd, ORGANIZATION_ID, pageMeta, SITE_URL } from "@/lib/seo";
import { COMPLETED_PROJECTS } from "@/lib/site";

const TITLE = "Projects — plotted layouts across Hyderabad";
const DESCRIPTION = "GIP's current layouts and the projects it has delivered across Hyderabad's growth corridors.";
const PATH = "/projects";

export const metadata: Metadata = pageMeta({ title: TITLE, description: DESCRIPTION, path: PATH });

// The listing: the full-screen film hero (H1, live counts, the record), the ongoing projects as a card grid, the delivered layouts as a second
// grid (`#delivered`, linked from the header, footer and home), the FAQ as a sticky split, the navy close.
export default async function ProjectsPage() {
  const projects = await getProjects();
  const cards = await Promise.all(projects.map(async (p) => toCard(p, summarize(await getUnits(p.id)))));
  const current = cards.filter((c) => c.status !== "completed");
  const selling = current.filter((c) => c.status === "selling").length;
  const delivered = cards.filter((c) => c.status === "completed");
  // Without the backend (the GitHub Pages preview) only Global City VI is bundled: the delivered names stand in.
  const deliveredCards: ProjectCardData[] = delivered.length
    ? delivered
    : COMPLETED_PROJECTS.map((d) => ({
        key: `delivered-${d.name}`, name: d.name, place: d.location, status: "completed", facts: [],
      }));

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "CollectionPage",
        "@id": `${SITE_URL}${PATH}`,
        url: `${SITE_URL}${PATH}`,
        name: TITLE,
        description: DESCRIPTION,
        publisher: { "@id": ORGANIZATION_ID },
        mainEntity: {
          "@type": "ItemList",
          itemListElement: projects.filter(hasDetailPage).map((p, i) => ({
            "@type": "ListItem",
            position: i + 1,
            item: { "@type": "RealEstateListing", name: p.name, url: `${SITE_URL}/projects/${p.publishing.slug}` },
          })),
        },
      },
      {
        "@type": "FAQPage",
        mainEntity: FAQ.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })),
      },
    ],
  };

  return (
    <>
      <JsonLd data={jsonLd} />

      <ProjectsHero selling={selling} delivered={deliveredCards.length} />

      <ProjectGrid
        id="current"
        title="Ongoing projects"
        lede="Layouts open for booking today, with their approvals and plot sizes where we have them on record."
        cards={current}
        priority
      />
      <ProjectGrid
        id="delivered"
        title="Delivered layouts"
        lede={
          <>
            {formatNumber(deliveredCards.length)} plotted layouts completed across Hyderabad&rsquo;s growth corridors, from
            Yadadri to Shadnagar. Ask us about any of them.
          </>
        }
        cards={deliveredCards}
      />
      <ProjectsFaq />
      <Closing />
    </>
  );
}
