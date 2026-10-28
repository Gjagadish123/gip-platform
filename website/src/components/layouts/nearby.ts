"use client";
// Nearby landmarks and drive routes, straight from Google (Places API (New) and Routes API through the Maps JS
// libraries) for each visit, so nothing is stored or invented: names, positions and drive times are Google's.
// Results are kept for the page view only (a module-level cache), as Google's terms allow.
import { BusFront, GraduationCap, Hospital, ShoppingBag, type LucideIcon } from "lucide-react";

import { haversineKm } from "@/lib/layouts";

import type { Maps } from "./google";

export type CategoryId = "education" | "health" | "shopping" | "transport";
type LatLng = { lat: number; lng: number };

export const CATEGORIES: { id: CategoryId; label: string; types: string[]; radius: number; icon: LucideIcon; tone: string }[] = [
  { id: "education", label: "Schools & colleges", types: ["school", "primary_school", "secondary_school", "university"], radius: 8_000, icon: GraduationCap, tone: "#1d5a92" },
  { id: "health", label: "Hospitals", types: ["hospital"], radius: 12_000, icon: Hospital, tone: "#c62828" },
  { id: "shopping", label: "Shopping", types: ["shopping_mall", "supermarket", "department_store"], radius: 12_000, icon: ShoppingBag, tone: "#b45309" },
  { id: "transport", label: "Transport", types: ["train_station", "bus_station", "transit_station", "subway_station"], radius: 15_000, icon: BusFront, tone: "#0d7068" },
];
export const CATEGORY = Object.fromEntries(CATEGORIES.map((c) => [c.id, c])) as Record<CategoryId, (typeof CATEGORIES)[number]>;

export interface Landmark {
  id: string;
  name: string;
  category: CategoryId;
  type?: string;
  address?: string;
  url?: string;
  at: LatLng;
  km: number; // straight line from the site
}

export interface Drive { km: number; min: number; path: LatLng[] }

const landmarkCache = new Map<string, Promise<Landmark[]>>();
const driveCache = new Map<string, Promise<Drive | null>>();

/**
 * The most-visited places of each kind around the site (Google's popularity ranking), nearest first. A kind that
 * fails is left out (and asked again next time); only when every kind fails does this reject.
 */
export function nearbyLandmarks(maps: Maps, key: string, site: LatLng): Promise<Landmark[]> {
  let p = landmarkCache.get(key);
  if (p) return p;
  p = (async () => {
    const { Place, SearchNearbyRankPreference } = (await maps.importLibrary("places")) as google.maps.PlacesLibrary;
    const settled = await Promise.allSettled(
      CATEGORIES.map(async (c) => {
        const { places } = await Place.searchNearby({
          fields: ["id", "displayName", "location", "primaryTypeDisplayName", "formattedAddress", "googleMapsURI"],
          locationRestriction: { center: site, radius: c.radius },
          includedPrimaryTypes: c.types,
          maxResultCount: 6,
          rankPreference: SearchNearbyRankPreference.POPULARITY,
        });
        return places
          .filter((pl) => pl.location && pl.displayName)
          .map((pl): Landmark => {
            const at = pl.location!.toJSON();
            return {
              id: pl.id, name: pl.displayName!, category: c.id, type: pl.primaryTypeDisplayName ?? undefined,
              address: pl.formattedAddress ?? undefined, url: pl.googleMapsURI ?? undefined, at, km: haversineKm(site, at),
            };
          });
      }),
    );
    const lists = settled.flatMap((s) => (s.status === "fulfilled" ? [s.value] : []));
    if (!lists.length) throw (settled[0] as PromiseRejectedResult).reason;
    if (lists.length < settled.length) queueMicrotask(() => landmarkCache.delete(key)); // the missing kinds next visit
    const seen = new Set<string>();
    return lists.flat().filter((l) => !seen.has(l.id) && seen.add(l.id)).sort((a, b) => a.km - b.km);
  })();
  p.catch(() => landmarkCache.delete(key)); // let "Try again" ask Google again
  landmarkCache.set(key, p);
  return p;
}

/**
 * Driving route from the site to a landmark (no live traffic). Resolves null when Google has no route; rejects when
 * the request fails or takes over 15 s, which the page words differently ("couldn't get the drive time").
 */
export function driveTo(maps: Maps, from: LatLng, to: Landmark): Promise<Drive | null> {
  const key = `${from.lat},${from.lng}>${to.id}`;
  let p = driveCache.get(key);
  if (p) return p;
  const ask = (maps.importLibrary("routes") as Promise<google.maps.RoutesLibrary>).then(({ Route }) =>
    Route.computeRoutes({
      origin: from,
      destination: to.at,
      travelMode: "DRIVING",
      fields: ["distanceMeters", "durationMillis", "path"],
    }),
  );
  let timer: ReturnType<typeof setTimeout> | undefined;
  const slow = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new Error("Route request timed out")), 15_000);
  });
  p = Promise.race([ask, slow]).finally(() => clearTimeout(timer)).then(({ routes }) => {
    const r = routes?.[0];
    if (!r?.path?.length || r.distanceMeters == null || r.durationMillis == null) return null;
    return {
      km: r.distanceMeters / 1000,
      min: Math.max(1, Math.round(r.durationMillis / 60_000)),
      path: r.path.map((q) => ({ lat: q.lat, lng: q.lng })),
    };
  });
  p.catch(() => driveCache.delete(key));
  driveCache.set(key, p);
  return p;
}

export const formatKm = (km: number) => (km < 1 ? `${Math.round(km * 1000 / 10) * 10} m` : `${km < 10 ? km.toFixed(1) : Math.round(km)} km`);
