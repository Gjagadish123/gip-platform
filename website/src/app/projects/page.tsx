import type { Metadata } from "next";

import { DeliveredLayouts } from "@/components/projects/delivered-layouts";
import { FeaturedProject } from "@/components/projects/featured-project";
import { FAQ, ProjectsFaq } from "@/components/projects/projects-faq";
import { Closing } from "@/components/site/closing";
import { Container } from "@/components/site/container";
import { Lede } from "@/components/site/typography";
import { getProjects, getUnits, hasDetailPage, summarize } from "@/lib/projects";
import { JsonLd, ORGANIZATION_ID, pageMeta, SITE_URL } from "@/lib/seo";
import { COMPLETED_PROJECTS } from "@/lib/site";

const TITLE = "Projects — plotted layouts across Hyderabad";
const DESCRIPTION = "One ongoing layout and sixteen delivered projects across Hyderabad's growth corridors.";
const PATH = "/projects";

export const metadata: Metadata = pageMeta({ title: TITLE, description: DESCRIPTION, path: PATH });

// The listing: the H1 and one line, each current project as a horizontal feature, the delivered register with its
// location filter, the FAQ as a sticky split, the navy close.
export default async function ProjectsPage() {
  const projects = await getProjects();
  const current = projects.filter((p) => p.lifecycle !== "completed");
  const features = await Promise.all(current.map(async (project) => ({ project, summary: summarize(await getUnits(project.id)) })));

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
          itemListElement: current.filter(hasDetailPage).map((p, i) => ({
            "@type": "ListItem",
            position: i + 1,
            item: {
              "@type": "RealEstateListing",
              name: p.name,
              url: `${SITE_URL}/projects/${p.publishing.slug}`,
            },
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

      <section aria-labelledby="projects-title" className="pt-32 pb-14 lg:pt-44 lg:pb-20">
        <Container className="grid gap-6 lg:grid-cols-12 lg:items-end lg:gap-8">
          <h1 id="projects-title" className="max-w-[18ch] text-display lg:col-span-8">
            Plotted layouts across Hyderabad&rsquo;s growth corridors.
          </h1>
          <Lede className="max-w-[40ch] lg:col-span-4">
            One layout selling now and {COMPLETED_PROJECTS.length} delivered, each with clear titles and an approved plan.
          </Lede>
        </Container>
      </section>

      <Container className="space-y-20 lg:space-y-28">
        {features.map(({ project, summary }, i) => (
          <FeaturedProject key={project.id} project={project} summary={summary} preload={i === 0} />
        ))}
      </Container>

      <DeliveredLayouts />
      <ProjectsFaq />
      <Closing />
    </>
  );
}
