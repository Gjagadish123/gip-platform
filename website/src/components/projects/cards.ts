// Project → card data for the Projects page (and anything else that lists projects as cards). Server-side, pure.
import { firstPlace } from "@/components/project/content";
import { AREA_UNIT_LABEL, getProjectType, LIVE_LAYOUT_IDS, liveLayoutUrl } from "@/lib/constants";
import { formatLandArea, formatNumber } from "@/lib/format";
import { hasDetailPage, type InventorySummary } from "@/lib/projects";
import type { Project } from "@/lib/types";

export interface ProjectFact {
  label: string;
  value: string;
}

export interface ProjectCardData {
  key: string;
  name: string;
  place: string;
  status: "selling" | "upcoming" | "completed";
  /** A real photograph of the project; without one the card draws a plotted layout instead. */
  photo?: { src: string; alt: string };
  facts: ProjectFact[];
  /** The project page or its own website; cards without one only inform (no Enquire, the client's call). */
  href?: string;
  /** Button text when it isn't "View project" / "Visit website". */
  action?: string;
}

// ponytail: stock photos came over with the old site's data; they are not the project's land, so those cards draw a
// layout instead until a real photo is set in the admin.
const STOCK_HOSTS = /(^|\.)unsplash\.com$/;
const APPROVERS = new Set(["HMDA", "DTCP", "RERA"]); // the bodies that approve or register a layout (not title or bank)

/** The project's cover when it is a real photograph (the client's call, 2026-10-26: no renders, no stock). */
export function realCover(p: Project): ProjectCardData["photo"] {
  const a = p.media.cover;
  if (!a || a.kind !== "image" || a.impression || a.source === "generated") return undefined;
  if (!/^https?:\/\//.test(a.url) || STOCK_HOSTS.test(new URL(a.url).hostname)) return undefined;
  return { src: a.url, alt: a.alt ?? `${p.name}, site photograph` };
}

export function toCard(p: Project, s: InventorySummary): ProjectCardData {
  const type = getProjectType(p.typeId);
  const facts: ProjectFact[] = [];
  if (s.total) {
    facts.push({ label: type.unitNounPlural, value: formatNumber(s.total) });
    const [min, max] = [Math.round(s.minArea), Math.round(s.maxArea)];
    const unit = AREA_UNIT_LABEL[type.areaUnit];
    facts.push({
      label: `${type.unitNoun} sizes`,
      value: min === max ? `${formatNumber(min)} ${unit}` : `${formatNumber(min)}–${formatNumber(max)} ${unit}`,
    });
  } else if (p.landArea) {
    facts.push({ label: "Land", value: formatLandArea(p.landArea) });
  }
  const approvals = [...new Set(p.legal.approvals.map((a) => a.authority))].filter((a) => APPROVERS.has(a));
  if (approvals.length) facts.push({ label: "Approvals", value: approvals.join(" & ") });

  return {
    key: p.id,
    name: p.name,
    place: firstPlace(p.location.short),
    status: p.lifecycle === "completed" ? "completed" : p.lifecycle === "upcoming" ? "upcoming" : "selling",
    photo: realCover(p),
    facts,
    // A mapped project without its own page opens in the live layouts app.
    ...(p.publishing.externalUrl || hasDetailPage(p)
      ? { href: p.publishing.externalUrl ?? `/projects/${p.publishing.slug}` }
      : LIVE_LAYOUT_IDS.includes(p.id) && p.lifecycle !== "completed"
        ? { href: liveLayoutUrl(p.id), action: "View live layout" }
        : {}),
  };
}

export const isExternal = (href: string) => /^https?:\/\//.test(href);
export const STATUS_LABEL: Record<ProjectCardData["status"], string> = {
  selling: "Ongoing",
  upcoming: "Upcoming",
  completed: "Completed",
};
