import type { Metadata } from "next"

import { CommonSheet } from "@/components/crm/common-sheet"

export const metadata: Metadata = { title: "Common sheet" }

export default function CommonSheetPage() {
  return <CommonSheet />
}
