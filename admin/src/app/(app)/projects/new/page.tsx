import type { Metadata } from "next"

import { PageContainer, PageHeader } from "@/components/app/page-header"
import { CreateProjectForm } from "@/components/projects/create/create-project-form"

export const metadata: Metadata = { title: "New project" }

export default function NewProjectPage() {
  return (
    <PageContainer>
      <PageHeader
        title="New project"
        description="Pick the project type first — it decides which fields and inventory the project gets."
      />
      <CreateProjectForm />
    </PageContainer>
  )
}
