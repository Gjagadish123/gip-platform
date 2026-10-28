import type { Metadata } from "next";
import { Suspense } from "react";
import { preconnect } from "react-dom";

import { LayoutsExperience, LayoutsSkeleton } from "@/components/layouts/experience";
import { LIVE_LAYOUT_IDS, loadLayout } from "@/lib/layouts";
import { getLiveLayouts } from "@/lib/projects";
import { pageMeta } from "@/lib/seo";

export const metadata: Metadata = pageMeta({
  title: "Live layouts — every plot, today's status, on the map",
  description:
    "Global City VI, Global City V, Global City RRR and Western County on the map: approved layouts plot by plot with live availability, roads and nearby schools, hospitals, shopping and transport.",
  path: "/layouts",
});

// The page reads the published projects and their plots (cached a minute); the client then keeps them live.
export default async function LayoutsPage() {
  // The map is the page's largest paint: open the connections to Google while the page loads.
  preconnect("https://maps.googleapis.com");
  preconnect("https://maps.gstatic.com", { crossOrigin: "anonymous" });
  const [{ projects, units }, outlines] = await Promise.all([
    getLiveLayouts(),
    Promise.all(
      LIVE_LAYOUT_IDS.map(async (id) => {
        const p = await loadLayout(id).catch(() => null); // a missing drawing must not take the page down
        // The pin frames the map before the drawing's own chunk has loaded on the client.
        return { id, outline: p?.outline ?? null, pending: !p?.plots.length, plotCount: p?.plotCount ?? 0, pin: p ? { lat: p.pin.lat, lng: p.pin.lng } : null };
      }),
    ),
  ]);
  return (
    <Suspense fallback={<LayoutsSkeleton />}>
      <LayoutsExperience projects={projects} units={units} outlines={outlines} />
    </Suspense>
  );
}
