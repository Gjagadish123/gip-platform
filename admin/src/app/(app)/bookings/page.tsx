import type { Metadata } from "next"

import { Bookings } from "@/components/crm/bookings"

export const metadata: Metadata = { title: "Bookings" }

export default function BookingsPage() {
  return <Bookings />
}
