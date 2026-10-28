import type { Metadata } from "next"

import { LiveLayouts } from "@/components/live-layouts/live-layouts"

export const metadata: Metadata = { title: "Live layouts" }

// The four projects in the live layouts app; figures come from the client store, like the dashboard.
export default function LiveLayoutsPage() {
  return <LiveLayouts />
}
