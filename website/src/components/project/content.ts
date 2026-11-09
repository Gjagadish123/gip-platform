// The small derivations the project page's sections share. Every word and picture comes from the admin.
import type { Approval, Asset, Distance, Project } from "@/lib/types";

/** "Rudraram" from "Rudraram / Shankarapally, Sangareddy District, Hyderabad". */
export const firstPlace = (short: string) => short.split(",")[0].split("/")[0].trim();

export function approvalFacts(project: Project) {
  const find = (a: Approval["authority"]) => project.legal.approvals.find((x) => x.authority === a);
  const hmda = find("HMDA") ?? find("DTCP"); // the layout permit: HMDA, or DTCP outside HMDA's area (Global City RRR)
  const rera = find("RERA");
  const parts = [hmda ? `${hmda.authority} approved` : null, rera ? "TS RERA registered" : null].filter((p): p is string => !!p);
  return { hmda, rera, parts };
}

/** The gallery's real photographs: images that are not renders (flagged in the admin, or generated). */
export const sitePhotos = (project: Project): Asset[] =>
  project.media.gallery.filter((a) => a.kind === "image" && !a.impression && a.source !== "generated");

/** "2026-03-06" from "WhatsApp Image 2026-03-06 at 4.13.29 PM.jpeg": the only date the site photos carry. */
export const photoDate = (a: Asset) => /\d{4}-\d{2}-\d{2}/.exec(a.name ?? "")?.[0];

export const mapsEmbed = (pin: { lat: number; lng: number }) =>
  `https://maps.google.com/maps?q=${pin.lat},${pin.lng}&z=14&output=embed`;
export const mapsDirections = (pin: { lat: number; lng: number }) =>
  `https://www.google.com/maps/dir/?api=1&destination=${pin.lat},${pin.lng}`;

/* ---------- nearby, from the admin's location advantages ---------- */

export interface NearbyGroup {
  id: string;
  label: string;
  places: { name: string; time: string }[];
}

/** "10 min", "2 km", "500 m", or the client's own words ("Near") where no figure is given yet. */
export const distanceLabel = (d: Distance) => ("text" in d ? d.text.trim() : `${d.value} ${d.unit}`);

/** What's nearby, from the project's location advantages in the admin: the groups that have places, in order. */
export const nearbyGroups = (project: Project): NearbyGroup[] =>
  (project.locationAdvantages?.categories ?? [])
    .filter((c) => c.places.length > 0)
    .map((c) => ({ id: c.id, label: c.title, places: c.places.map((p) => ({ name: p.name, time: distanceLabel(p.distance) })) }));
