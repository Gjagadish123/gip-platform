// Shared frame for Details (/projects/[id]) and Inventory (/projects/[id]/inventory): project header, route tabs and
// the editor draft (kept here so switching tabs never loses unsaved edits). Ids live in the client store, so params
// are unknown at build: they are awaited inside <Suspense>, whose fallback is the prerendered shell.
import { Suspense, type ReactNode } from "react"

import { PageContainer } from "@/components/app/page-header"
import { ProjectFrame, ProjectHeaderSkeleton } from "@/components/projects/project-header"

type Props = { children: ReactNode; params: Promise<{ id: string }> }

async function Frame({ params, children }: Props) {
  const { id } = await params
  return <ProjectFrame id={id}>{children}</ProjectFrame>
}

export default function ProjectLayout({ params, children }: Props) {
  return (
    <PageContainer>
      <Suspense fallback={<ProjectHeaderSkeleton />}>
        <Frame params={params}>{children}</Frame>
      </Suspense>
    </PageContainer>
  )
}
