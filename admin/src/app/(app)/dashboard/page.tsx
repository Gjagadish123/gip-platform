import type { Metadata } from "next"

import { Dashboard } from "@/components/dashboard/dashboard"

export const metadata: Metadata = { title: "Dashboard" }

// Every figure comes from the client demo store, so the page body is one client component.
export default function DashboardPage() {
  return <Dashboard />
}
