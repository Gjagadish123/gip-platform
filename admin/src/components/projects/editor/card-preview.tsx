"use client"

// Faithful copy of the public site's listing card (gipproperties/src/components/ui/PropertyCard.jsx), so edits to
// name, type label, location, cover, lifecycle and approvals show as buyers will see them. Hex values are the
// public site's own tokens (--primary-background #033967, --text-secondary #676f7e, --border-secondary #f1f0ed,
// .approved #e6f4ea/#1e7e34, completed #10b981); the card stays white in dark mode because the site has no dark
// theme. Admin rules still apply: no shadow, radius capped at rounded-xl, one font, no hover motion.
// One deliberate difference: "Approved" is derived from the approvals (isApproved) instead of hard-coded.
import { AssetImage } from "@/components/form"
import { getProjectType } from "@/lib/constants"
import type { Project } from "@/lib/types"
import { cn } from "@/lib/utils"
import { isApproved } from "@/lib/validate"

export function CardPreview({ project, className }: { project: Project; className?: string }) {
  const type = getProjectType(project.typeId)
  const completed = project.lifecycle === "completed"
  const year = completed ? project.completionYear : project.lifecycle === "upcoming" ? project.launchYear : undefined
  const external = project.publishing.externalUrl
  const opens = completed
    ? "Completed: the card is not clickable"
    : external
      ? `Opens ${external.replace(/^https?:\/\/(www\.)?/, "").replace(/\/$/, "")} in a new tab`
      : `Opens /property/${project.publishing.slug || "…"}`

  return (
    <figure className={cn("w-full max-w-[360px]", className)}>
      <div className="flex flex-col overflow-hidden rounded-xl border border-[#f1f0ed] bg-white text-black">
        <div className="relative h-[220px] shrink-0">
          <AssetImage asset={project.media.cover} alt={project.media.cover?.alt ?? `${project.name} cover`} className="size-full" />
          <span className="absolute top-4 left-4 max-w-[60%] truncate rounded-md bg-[#033967] px-3 py-1 text-xs font-semibold tracking-wide text-white">
            {project.typeLabel?.trim() || type.name}
          </span>
          {isApproved(project) && (
            <span className="absolute top-4 right-4 rounded-md bg-[#e6f4ea] px-3 py-1 text-xs font-semibold tracking-wide text-[#1e7e34]">
              Approved
            </span>
          )}
        </div>
        <div className="flex flex-col p-5">
          <p className="text-xl leading-tight font-semibold text-balance uppercase">
            {project.name.trim() || "Untitled project"}
            {year ? <span className="ml-1.5 text-base font-normal text-[#676f7e] normal-case tabular-nums">({year})</span> : null}
          </p>
          <p className="mt-1 text-sm font-medium text-[#676f7e]/80">{project.location.short.trim() || "Location not set"}</p>
          <div aria-hidden className="my-4 h-px bg-[#f1f0ed]" />
          <div
            aria-hidden
            className={cn(
              "rounded-xl py-3 text-center text-sm font-semibold text-white",
              completed ? "bg-[#10b981] opacity-80" : "bg-[#033967]",
            )}
          >
            {completed ? "Project Completed" : "Explore Project"}
          </div>
        </div>
      </div>
      <figcaption className="mt-2 text-xs text-muted-foreground">
        Listing card preview · {opens}
      </figcaption>
    </figure>
  )
}
