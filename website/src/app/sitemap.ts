import type { MetadataRoute } from "next";

import { getProjects, hasDetailPage } from "@/lib/projects";
import { SITE_URL } from "@/lib/seo";

/** The sitemap: the site's pages and every project page the admin publishes. */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const projects = (await getProjects()).filter(hasDetailPage);
  return [
    { url: `${SITE_URL}/`, changeFrequency: "weekly", priority: 1 },
    { url: `${SITE_URL}/projects`, changeFrequency: "weekly", priority: 0.9 },
    ...projects.map((p) => ({
      url: `${SITE_URL}/projects/${p.publishing.slug}`,
      lastModified: p.publishing.updatedAt,
      changeFrequency: "weekly" as const,
      priority: 0.8,
    })),
    { url: `${SITE_URL}/about`, changeFrequency: "monthly", priority: 0.5 },
    { url: `${SITE_URL}/contact`, changeFrequency: "monthly", priority: 0.5 },
  ];
}
