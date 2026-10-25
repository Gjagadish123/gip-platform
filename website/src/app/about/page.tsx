import type { Metadata } from "next";

import { AboutHero, Philosophy } from "@/components/about/about-hero";
import { Leadership, MissionVision } from "@/components/about/company";
import { Moments } from "@/components/about/moments";
import { Strengths } from "@/components/about/strengths";
import { Values } from "@/components/about/values";
import { Closing } from "@/components/site/closing";
import { COMPANY } from "@/lib/constants";
import { formatNumber } from "@/lib/format";
import { JsonLd, ORGANIZATION_ID, pageMeta, SITE_URL } from "@/lib/seo";
import { LEADERSHIP, STATS } from "@/lib/site";

const TITLE = `About — ${STATS[0].value}${STATS[0].suffix} years of approved plotted development`;
const DESCRIPTION = `${COMPANY.name}, ${COMPANY.city}: ${STATS.map((s) => `${formatNumber(s.value)}${s.suffix} ${s.label.toLowerCase()}`).join(", ")}. Integrity, quality and customer focus. Leadership: ${LEADERSHIP.people.map((p) => p.name).join(" and ")}.`;

export const metadata: Metadata = pageMeta({ title: TITLE, description: DESCRIPTION, path: "/about" });

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "AboutPage",
      "@id": `${SITE_URL}/about#webpage`,
      url: `${SITE_URL}/about`,
      name: TITLE,
      description: DESCRIPTION,
      about: { "@id": ORGANIZATION_ID },
    },
    ...LEADERSHIP.people.map((p) => ({
      "@type": "Person",
      name: p.name,
      jobTitle: p.role,
      worksFor: { "@id": ORGANIZATION_ID },
    })),
  ],
};

// The company page: H1 and the layered hero pictures, the philosophy as a sticky split, mission / vision behind a
// segmented control, the two leaders, values as rows, how we work as rows, event photographs, the navy close.
export default function AboutPage() {
  return (
    <>
      <JsonLd data={jsonLd} />
      <AboutHero />
      <Philosophy />
      <MissionVision />
      <Leadership />
      <Values />
      <Strengths />
      <Moments />
      <Closing />
    </>
  );
}
