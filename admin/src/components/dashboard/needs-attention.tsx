"use client"

import { useMemo } from "react"
import Link from "next/link"
import { Circle, CircleAlert, CircleCheck } from "lucide-react"

import { attentionList } from "@/components/dashboard/dashboard-data"
import { SECTION_META } from "@/lib/constants"
import { formatNumber, plural } from "@/lib/format"
import type { ID, Project, Unit } from "@/lib/types"

const PROJECTS_SHOWN = 6
const ISSUES_SHOWN = 3

/** Publish-readiness gaps per project (validateProject with every project, so cross-project checks run). */
export function NeedsAttention({ projects, units }: { projects: Project[]; units: Record<ID, Unit[]> }) {
  const list = useMemo(() => attentionList(projects, units), [projects, units])

  if (!list.length) {
    return (
      <div className="flex flex-col items-center gap-3 px-4 py-12 text-center">
        <CircleCheck aria-hidden className="size-5 text-muted-foreground" />
        <p className="max-w-sm text-sm text-muted-foreground">Nothing needs attention. Every project passes its checks.</p>
      </div>
    )
  }

  const rest = list.length - PROJECTS_SHOWN
  return (
    <>
      <ul className="divide-y">
        {list.slice(0, PROJECTS_SHOWN).map(({ project: p, issues, required, recommended }) => (
          <li key={p.id} className="px-4 py-3">
            <div className="flex items-baseline justify-between gap-3">
              <Link
                href={`/projects/${p.id}`}
                className="min-w-0 truncate rounded-sm text-[13px]/5 font-medium outline-none hover:underline focus-visible:ring-2 focus-visible:ring-ring"
              >
                {p.name}
              </Link>
              <p className="shrink-0 text-xs text-muted-foreground tabular-nums">
                {required > 0 && <span className="text-destructive">{formatNumber(required)} required</span>}
                {required > 0 && recommended > 0 && " · "}
                {recommended > 0 && `${formatNumber(recommended)} recommended`}
              </p>
            </div>
            <ul className="mt-1.5 grid gap-0.5">
              {issues.slice(0, ISSUES_SHOWN).map((issue, i) => {
                const req = issue.level === "required"
                const Icon = req ? CircleAlert : Circle
                return (
                  <li key={`${issue.field}-${i}`}>
                    <Link
                      href={`/projects/${p.id}#${p.id}--${issue.section}`}
                      className="-mx-1.5 flex items-start gap-2 rounded-md px-1.5 py-1 text-xs outline-none hover:bg-muted/50 focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      <Icon
                        aria-hidden
                        className={req ? "mt-px size-3.5 shrink-0 text-destructive" : "mt-px size-3.5 shrink-0 text-muted-foreground"}
                      />
                      <span className="sr-only">{req ? "Required: " : "Recommended: "}</span>
                      <span className="min-w-0">
                        <span className="text-muted-foreground">{SECTION_META[issue.section].label}</span>
                        <span className="text-muted-foreground"> · </span>
                        <span className="text-foreground">{issue.message}</span>
                      </span>
                    </Link>
                  </li>
                )
              })}
            </ul>
          </li>
        ))}
      </ul>
      {rest > 0 && (
        <p className="border-t px-4 py-3 text-xs text-muted-foreground">
          {plural(rest, "more project needs", "more projects need")} attention.{" "}
          <Link href="/projects" className="rounded-sm text-foreground underline-offset-4 outline-none hover:underline focus-visible:ring-2 focus-visible:ring-ring">
            All projects
          </Link>
        </p>
      )}
    </>
  )
}
