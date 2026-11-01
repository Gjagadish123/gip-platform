import type { Metadata } from "next"

import { Reports } from "@/components/crm/reports"

export const metadata: Metadata = { title: "Reports" }

export default function ReportsPage() {
  return <Reports />
}
