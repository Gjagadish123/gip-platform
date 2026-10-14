// Details tab. The [id] layout reads params (inside <Suspense>) and provides the project + draft context,
// so this page reads no URL data itself.
import type { Metadata } from "next"

import { Editor } from "@/components/projects/editor/editor"

export const metadata: Metadata = { title: "Project" }

export default function ProjectDetailsPage() {
  return <Editor />
}
