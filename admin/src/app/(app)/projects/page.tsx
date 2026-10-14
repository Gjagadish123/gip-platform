import type { Metadata } from "next"
import { Suspense } from "react"

import { PageContainer } from "@/components/app/page-header"
import { ProjectsBrowser, ProjectsBrowserSkeleton, ProjectsHeader } from "@/components/projects/list/projects-list"

export const metadata: Metadata = { title: "Projects" }

// The browser reads ?view= (useSearchParams), so it gets its own Suspense boundary under cacheComponents.
export default function ProjectsPage() {
  return (
    <PageContainer>
      <ProjectsHeader />
      <Suspense fallback={<ProjectsBrowserSkeleton />}>
        <ProjectsBrowser />
      </Suspense>
    </PageContainer>
  )
}
