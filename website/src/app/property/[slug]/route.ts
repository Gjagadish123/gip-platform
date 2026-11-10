import { getProjects, hasDetailPage } from "@/lib/projects";

/**
 * The old website's project pages (/property/GLOBAL%20CITY%20VI), still in search results and bookmarks: a permanent
 * redirect to the project's page, found by the old address the admin keeps (publishing.legacySlug), or to the
 * projects list when the project has no page.
 */
export async function GET(_request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const name = decodeURIComponent(slug).trim().toLowerCase();
  const project = (await getProjects()).find((p) => p.publishing.legacySlug?.trim().toLowerCase() === name);
  const target = project && hasDetailPage(project) ? `/projects/${project.publishing.slug}` : "/projects";
  return new Response(null, { status: 308, headers: { Location: target } });
}
