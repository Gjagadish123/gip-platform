// Shared frame for Details (/projects/[id]) and Inventory (/projects/[id]/inventory): project header, route tabs and
// the editor draft (kept here so switching tabs never loses unsaved edits). Ids live in the client store, so params
// are unknown at build: they are awaited inside <Suspense>, whose fallback is the prerendered shell.
import { Suspense, type ReactNode } from "react"

import { PageContainer } from "@/components/app/page-header"
import { ProjectFrame, ProjectHeaderSkeleton } from "@/components/projects/project-header"
import { NEW_PROJECT_IDS } from "@/lib/constants"
import { SEED } from "@/lib/mock"

type Props = { children: ReactNode; params: Promise<{ id: string }> }

// A page per seed project + per new-project slot, so the static GitHub Pages export has them all.
export function generateStaticParams() {
  return [...SEED.projects.map((p) => p.id), ...NEW_PROJECT_IDS].map((id) => ({ id }))
}

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
