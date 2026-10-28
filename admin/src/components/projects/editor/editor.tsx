"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

import { FieldTouchContext } from "@/components/form"
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { PAGE_CONTENT_SECTIONS, SECTION_IDS, SECTION_META, getProjectType, type SectionId } from "@/lib/constants"
import { plural } from "@/lib/format"
import { setLeaveGuard } from "@/lib/leave-guard"
import { useDemo, useProjects, useUnits } from "@/lib/store"
import type { Project, ProjectType, Unit } from "@/lib/types"
import { hasDetailPage, sectionCompletion, validateProject, type Issue } from "@/lib/validate"

import { SaveBar } from "./save-bar"
import { detailsTabId, sectionDomId, type SectionProps, type ShownIssue } from "./section-types"
import { AmenitiesSection } from "./sections/amenities-section"
import { CtaSection } from "./sections/cta-section"
import { LegalSection } from "./sections/legal-section"
import { LocationSection } from "./sections/location-section"
import { MasterPlanSection } from "./sections/masterplan-section"
import { MediaSection } from "./sections/media-section"
import { OverviewSection } from "./sections/overview-section"
import { PricingSection } from "./sections/pricing-section"
import { PublishingSection } from "./sections/publishing-section"
import { VisionSection } from "./sections/vision-section"
import {
  EditorToc,
  EditorTocChips,
  IssueList,
  scrollToTarget,
  useActiveSection,
  type TocEntry,
  type TocGroup,
  type TocState,
} from "./toc"

/* ---------------- draft helpers ---------------- */

const unset = (v: unknown) => v === undefined || v === ""

/** Deep equality; undefined and "" both mean "not set", so clearing a never-set field is not a change. */
export function sameValue(a: unknown, b: unknown): boolean {
  if (Object.is(a, b) || (unset(a) && unset(b))) return true
  if (typeof a !== "object" || typeof b !== "object" || !a || !b || Array.isArray(a) !== Array.isArray(b)) return false
  if (Array.isArray(a)) {
    const bb = b as unknown[]
    return a.length === bb.length && a.every((x, i) => sameValue(x, bb[i]))
  }
  const ra = a as Record<string, unknown>
  const rb = b as Record<string, unknown>
  const keys = new Set([...Object.keys(ra), ...Object.keys(rb)])
  for (const k of keys) if (!sameValue(ra[k], rb[k])) return false
  return true
}

/** Same content, whatever version each was read at (a dirty draft keeps the rev it started from). */
const sameContent = (draft: Project, saved: Project) => sameValue({ ...draft, rev: saved.rev }, saved)

/** Fields the store owns (publish state, inventory stamps). A draft always carries the saved values. */
function rebase(d: Project, s: Project): Project {
  return {
    ...d,
    inventoryUpdatedAt: s.inventoryUpdatedAt,
    statusSample: s.statusSample,
    publishing: { ...d.publishing, state: s.publishing.state, updatedAt: s.publishing.updatedAt, publishedAt: s.publishing.publishedAt },
  }
}

/** Trim every string on save (domain §4 #13: trailing spaces in the old data). */
function trimDeep<T>(v: T): T {
  if (typeof v === "string") return v.trim() as T
  if (Array.isArray(v)) return v.map(trimDeep) as T
  if (v && typeof v === "object") return Object.fromEntries(Object.entries(v).map(([k, x]) => [k, trimDeep(x)])) as T
  return v
}

/** Page-content sections a card-only project folds away. Legal stays open: approvals drive the card's badge. */
export const FOLDED_SECTIONS: SectionId[] = PAGE_CONTENT_SECTIONS.filter((s) => s !== "legal")

const issueKey = (i: Issue) => `${i.section}:${i.field}`
const isLive = (p: Project) => p.publishing.state === "published"

/* ---------------- draft context (lives in the [id] layout, so Details ↔ Inventory keeps it) ---------------- */

type EditorValue = {
  saved: Project
  draft: Project
  type: ProjectType
  units: Unit[]
  issues: Issue[]
  /** `issues` as the form shows them: required gaps stay `pending` (calm) until publishing is tried or the field is left. */
  shown: ShownIssue[]
  dirty: boolean
  update: SectionProps["update"]
  /** Saves the draft; returns what was saved. No toast, no checks (callers word their own). */
  save: () => Project
  discard: () => void
  /** Save with a toast. On a live project, required gaps the saved version didn't have ask first. `then` runs after. */
  requestSave: (then?: () => void) => void
  /** Turns every required gap red (a publish attempt). */
  revealErrors: () => void
}

const EditorContext = React.createContext<EditorValue | null>(null)

export function useProjectEditor(): EditorValue {
  const v = React.useContext(EditorContext)
  if (!v) throw new Error("useProjectEditor() must be used inside <EditorProvider>.")
  return v
}

export function EditorProvider({ project, children }: { project: Project; children: React.ReactNode }) {
  const router = useRouter()
  const { saveProject } = useDemo().actions
  const projects = useProjects()
  const units = useUnits(project.id)
  const [st, setSt] = React.useState(() => ({ saved: project, draft: structuredClone(project) }))

  // The saved project changed outside the form (save, publish, inventory, another tab's hydrate):
  // a clean draft follows it; a dirty draft keeps the edits and takes the store-owned fields.
  let { draft } = st
  if (st.saved !== project) {
    draft =
      st.saved.id === project.id && !sameContent(st.draft, st.saved) ? rebase(st.draft, project) : structuredClone(project)
    setSt({ saved: project, draft })
  }

  const type = getProjectType(draft.typeId)
  const dirty = React.useMemo(() => !sameContent(draft, project), [draft, project])
  const issues = React.useMemo(() => validateProject(draft, type, units, projects), [draft, type, units, projects])

  // A new draft starts calm. Required gaps turn red after a publish attempt (a live project has had one) or once
  // their field is left (FieldTouchContext).
  const [reveal, setReveal] = React.useState(() => ({ all: isLive(project), fields: new Set<string>() }))
  const touch = React.useCallback(
    (field: string) =>
      setReveal((r) => (r.all || r.fields.has(field) ? r : { ...r, fields: new Set(r.fields).add(field) })),
    [],
  )
  const revealErrors = React.useCallback(() => setReveal((r) => (r.all ? r : { ...r, all: true })), [])
  const shown = React.useMemo<ShownIssue[]>(() => {
    if (reveal.all) return issues
    const left = [...reveal.fields]
    return issues.map((i) =>
      i.level === "required" && !left.some((f) => i.field === f || i.field.startsWith(`${f}.`)) ? { ...i, pending: true } : i,
    )
  }, [issues, reveal])

  const update = React.useCallback<SectionProps["update"]>((recipe) => {
    setSt((s) => {
      const d = structuredClone(s.draft)
      recipe(d)
      return { ...s, draft: d }
    })
  }, [])

  const save = React.useCallback(() => {
    const next = trimDeep(rebase(draft, project))
    setSt({ saved: project, draft: next })
    saveProject(next)
    return next
  }, [draft, project, saveProject])

  const discard = React.useCallback(() => {
    const prev = draft
    setSt({ saved: project, draft: structuredClone(project) })
    toast("Changes discarded", {
      duration: 10_000,
      action: { label: "Undo", onClick: () => setSt((s) => ({ ...s, draft: rebase(prev, s.saved) })) },
    })
  }, [draft, project])

  /* Saving a live project: new required gaps would go straight to the website, so they ask first. */
  const [gaps, setGaps] = React.useState<{ issues: Issue[]; then?: () => void } | null>(null)
  const fixJump = React.useRef<SectionId | null>(null)

  const commit = React.useCallback(
    (then?: () => void) => {
      save()
      toast.success("Changes saved")
      then?.()
    },
    [save],
  )

  const requestSave = React.useCallback(
    (then?: () => void) => {
      if (isLive(project)) {
        const had = new Set(
          validateProject(project, getProjectType(project.typeId), units, projects)
            .filter((i) => i.level === "required")
            .map(issueKey),
        )
        const fresh = issues.filter((i) => i.level === "required" && !had.has(issueKey(i)))
        if (fresh.length) return setGaps({ issues: fresh, then })
      }
      commit(then)
    },
    [project, units, projects, issues, commit],
  )

  function fixFirst(section: SectionId) {
    fixJump.current = section
    revealErrors()
    setGaps(null)
  }

  /* Leaving with unsaved edits: links (capture phase, before Next's <Link> handler) and the command menu ask. */
  const [leaving, setLeaving] = React.useState<{ go: () => void } | null>(null) // the navigation on hold

  React.useEffect(() => {
    if (!dirty) return
    const base = `/projects/${project.id}`
    const stays = (url: URL) =>
      url.origin === window.location.origin && (url.pathname === base || url.pathname.startsWith(`${base}/`))
    const onClick = (e: MouseEvent) => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return
      const a = e.target instanceof Element ? e.target.closest("a[href]") : null
      if (!(a instanceof HTMLAnchorElement) || (a.target && a.target !== "_self") || a.hasAttribute("download")) return
      const url = new URL(a.href)
      if (url.origin !== window.location.origin || stays(url)) return // other sites: beforeunload asks
      e.preventDefault()
      const href = url.pathname + url.search + url.hash
      setLeaving({ go: () => router.push(href) })
    }
    const guard = (e: BeforeUnloadEvent) => e.preventDefault()
    document.addEventListener("click", onClick, true)
    window.addEventListener("beforeunload", guard)
    const clearGuard = setLeaveGuard((href, go) => {
      if (stays(new URL(href, window.location.href))) return true
      setLeaving({ go })
      return false
    })
    return () => {
      document.removeEventListener("click", onClick, true)
      window.removeEventListener("beforeunload", guard)
      clearGuard()
    }
  }, [dirty, project.id, router])

  function leave(how: "save" | "discard") {
    const go = leaving?.go
    setLeaving(null)
    if (!go) return
    if (how === "save") return requestSave(go)
    setSt({ saved: project, draft: structuredClone(project) })
    go()
  }

  // Next keeps hidden routes mounted (Activity): close the dialogs when this route is hidden.
  React.useEffect(
    () => () => {
      setLeaving(null)
      setGaps(null)
    },
    [],
  )

  const value = React.useMemo(
    () => ({ saved: project, draft, type, units, issues, shown, dirty, update, save, discard, requestSave, revealErrors }),
    [project, draft, type, units, issues, shown, dirty, update, save, discard, requestSave, revealErrors],
  )
  return (
    <EditorContext.Provider value={value}>
      <FieldTouchContext.Provider value={touch}>{children}</FieldTouchContext.Provider>

      <AlertDialog open={leaving !== null} onOpenChange={(o) => !o && setLeaving(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Leave without saving?</AlertDialogTitle>
            <AlertDialogDescription>
              Your changes to <span className="font-medium text-foreground [overflow-wrap:anywhere]">{project.name}</span>{" "}
              aren&apos;t saved yet.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Stay</AlertDialogCancel>
            <Button variant="outline" onClick={() => leave("discard")}>
              Discard
            </Button>
            <Button onClick={() => leave("save")}>Save</Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={gaps !== null} onOpenChange={(o) => !o && setGaps(null)}>
        <DialogContent
          className="sm:max-w-lg"
          onCloseAutoFocus={(e) => {
            const s = fixJump.current
            if (!s) return
            fixJump.current = null
            e.preventDefault()
            requestAnimationFrame(
              () => scrollToTarget(sectionDomId(project.id, s)) || scrollToTarget(sectionDomId(project.id, "page-content")),
            )
          }}
        >
          <DialogHeader>
            <DialogTitle>This is live</DialogTitle>
            <DialogDescription>
              {gaps &&
                `Saving puts ${plural(gaps.issues.length, "new gap", "new gaps")} on the live page. Fix ${gaps.issues.length === 1 ? "it" : "them"} first, or save anyway.`}
            </DialogDescription>
          </DialogHeader>
          {gaps && <IssueList issues={gaps.issues} state="missing" onJump={fixFirst} />}
          <DialogFooter>
            <Button variant="outline" onClick={() => gaps && fixFirst(gaps.issues[0].section)}>
              Fix first
            </Button>
            <Button
              onClick={() => {
                const then = gaps?.then
                setGaps(null)
                commit(then)
              }}
            >
              Save anyway
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </EditorContext.Provider>
  )
}

/* ---------------- the Details page ---------------- */

const SECTION_COMPONENTS: Record<SectionId, (p: SectionProps) => React.ReactNode> = {
  overview: OverviewSection,
  pricing: PricingSection,
  location: LocationSection,
  media: MediaSection,
  vision: VisionSection,
  masterplan: MasterPlanSection,
  amenities: AmenitiesSection,
  legal: LegalSection,
  cta: CtaSection,
  publishing: PublishingSection,
}

const worst = (states: TocState[]): TocState =>
  states.includes("missing") ? "missing" : states.includes("todo") ? "todo" : states.includes("warning") ? "warning" : "off"

export function Editor() {
  const { saved, draft, type, units, shown, update, dirty, discard, requestSave } = useProjectEditor()
  const { hydrated } = useDemo()
  const [showHidden, setShowHidden] = React.useState(false)
  /** A section to scroll to (and focus) once the next render is on screen. */
  const [jumpTarget, setJumpTarget] = React.useState<string | null>(null)
  const detail = hasDetailPage(draft)
  const collapsed = !detail && !showHidden
  const live = isLive(saved)
  const pageContentId = sectionDomId(draft.id, "page-content")

  // Required gaps nobody has been asked to fix yet are "todo" (calm), not "missing" (red).
  const completion = React.useMemo(() => {
    const c: Record<SectionId, TocState> = sectionCompletion(shown)
    for (const s of SECTION_IDS) {
      if (c[s] === "missing" && shown.every((i) => i.section !== s || i.level !== "required" || i.pending)) c[s] = "todo"
    }
    return c
  }, [shown])

  const targetOf = React.useCallback(
    (s: SectionId) => (collapsed && FOLDED_SECTIONS.includes(s) ? pageContentId : sectionDomId(draft.id, s)),
    [draft.id, collapsed, pageContentId],
  )

  const groups = React.useMemo<TocGroup[]>(() => {
    const out: { label: string; ids: SectionId[] }[] = []
    for (const s of SECTION_IDS) {
      const g = SECTION_META[s].group
      if (out.at(-1)?.label === g) out.at(-1)!.ids.push(s)
      else out.push({ label: g, ids: [s] })
    }
    return out.map(({ label, ids }) => {
      const folded = collapsed ? ids.filter((s) => FOLDED_SECTIONS.includes(s)) : []
      const entries: TocEntry[] = []
      for (const s of ids) {
        if (!folded.includes(s)) {
          entries.push({ key: s, label: SECTION_META[s].label, target: targetOf(s), state: completion[s] })
        } else if (s === folded[0]) {
          entries.push({ key: "page-content", label: "No detail page", target: pageContentId, state: worst(folded.map((f) => completion[f])) })
        }
      }
      return { label: ids.length > 1 ? label : null, entries }
    })
  }, [collapsed, completion, targetOf, pageContentId])

  const targets = React.useMemo(() => [...new Set(groups.flatMap((g) => g.entries.map((e) => e.target)))], [groups])
  const activeId = useActiveSection(targets, hydrated)

  React.useEffect(() => {
    if (!jumpTarget) return
    const raf = requestAnimationFrame(() => {
      if (!scrollToTarget(jumpTarget)) scrollToTarget(pageContentId)
      setJumpTarget(null)
    })
    return () => cancelAnimationFrame(raf)
  }, [jumpTarget, pageContentId])

  // Deep links (/projects/x#x--vision from the dashboard). On a full load the browser's own hash jump fires while
  // the hydration gate still hides the page, and a folded section isn't rendered yet: open it, then jump.
  const onDeepLink = React.useEffectEvent(() => {
    const id = decodeURIComponent(window.location.hash.slice(1))
    if (!id) return
    if (collapsed && FOLDED_SECTIONS.some((s) => sectionDomId(draft.id, s) === id)) setShowHidden(true)
    setJumpTarget(id)
  })
  React.useEffect(() => {
    if (!hydrated) return
    const raf = requestAnimationFrame(onDeepLink)
    return () => cancelAnimationFrame(raf)
  }, [hydrated])

  const required = shown.filter((i) => i.level === "required")
  const firstOf = (level: Issue["level"]) => {
    const s = SECTION_IDS.find((id) => shown.some((i) => i.section === id && i.level === level))
    return s && targetOf(s)
  }
  const summary = {
    required: {
      count: required.length,
      target: firstOf("required"),
      state: (required.some((i) => !i.pending) ? "missing" : "todo") as TocState,
    },
    recommended: { count: shown.length - required.length, target: firstOf("recommended") },
  }

  const props: SectionProps = { draft, type, units, issues: shown, update }
  const why =
    draft.lifecycle === "completed"
      ? "Completed projects show a listing card only. To give it a page again, set the lifecycle to Ongoing in Overview."
      : `Its card opens ${hostOf(draft.publishing.externalUrl)} instead. Clear the external website in Publishing to give it a page.`

  return (
    <div>
      <div className="lg:grid lg:grid-cols-[13rem_minmax(0,1fr)] lg:gap-8">
        <EditorTocChips groups={groups} activeId={activeId} />
        <aside className="hidden lg:block">
          {/* Stops above the 3.5rem save bar, so the summary stays visible and clickable. */}
          <div className="sticky top-[72px] max-h-[calc(100svh-88px-3.5rem)] overflow-y-auto pb-4">
            <EditorToc groups={groups} activeId={activeId} live={live} {...summary} />
          </div>
        </aside>

        <div className="min-w-0">
          <div className="max-w-[760px] divide-y [&>*]:py-8 [&>*:first-child]:pt-0">
            {SECTION_IDS.map((s) => {
              const folds = !detail && FOLDED_SECTIONS.includes(s)
              if (folds && collapsed) {
                return s === FOLDED_SECTIONS[0] ? (
                  <section
                    key="page-content"
                    id={pageContentId}
                    aria-labelledby={`${pageContentId}-h`}
                    className="scroll-mt-32 lg:scroll-mt-[72px]"
                  >
                    <h2 id={`${pageContentId}-h`} className="text-base font-semibold">
                      Page content
                    </h2>
                    <p className="mt-1 max-w-[70ch] text-sm text-muted-foreground">
                      Not shown: this project has no detail page on the website. {why}
                    </p>
                    <p className="mt-1 max-w-[70ch] text-sm text-muted-foreground">
                      Vision, master plan, amenities and call to action keep their content until then.
                    </p>
                    <Button
                      type="button"
                      variant="outline"
                      size="lg"
                      className="mt-4"
                      onClick={() => {
                        setShowHidden(true)
                        setJumpTarget(sectionDomId(draft.id, FOLDED_SECTIONS[0]))
                      }}
                    >
                      Edit page content anyway
                    </Button>
                  </section>
                ) : null
              }
              const Section = SECTION_COMPONENTS[s]
              return (
                <React.Fragment key={s}>
                  {folds && s === FOLDED_SECTIONS[0] && (
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <p className="text-sm text-muted-foreground">
                        Vision, master plan, amenities and call to action are not shown on the website: this project
                        has no detail page.
                      </p>
                      <Button
                        type="button"
                        variant="ghost"
                        onClick={() => {
                          setShowHidden(false)
                          setJumpTarget(pageContentId)
                        }}
                      >
                        Collapse
                      </Button>
                    </div>
                  )}
                  <Section {...props} />
                </React.Fragment>
              )
            })}
          </div>
        </div>
      </div>
      {/* Spans the whole content width; sticks to the viewport bottom while the editor is on screen. */}
      <SaveBar
        dirty={dirty}
        required={summary.required.count}
        recommended={summary.recommended.count}
        live={live}
        focusTarget={detailsTabId(draft.id)}
        onSave={() => requestSave()}
        onDiscard={discard}
      />
    </div>
  )
}

function hostOf(url?: string) {
  try {
    return url ? new URL(url).host.replace(/^www\./, "") : "another website"
  } catch {
    return "another website"
  }
}
