"use client"

import * as React from "react"
import { flushSync } from "react-dom"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Archive, ArchiveRestore, ArrowUpRight, Copy, FolderX, MoreHorizontal, Trash2 } from "lucide-react"
import { toast } from "sonner"

import { PageHeader } from "@/components/app/page-header"
import { FieldRow, SampleBadge } from "@/components/form"
import {
  AlertDialog,
  AlertDialogAction,
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty"
import { Input } from "@/components/ui/input"
import { SECTION_IDS, getProjectType, type SectionId } from "@/lib/constants"
import { plural } from "@/lib/format"
import { useDemo, useProject } from "@/lib/store"
import type { ID } from "@/lib/types"
import { cn } from "@/lib/utils"
import { liveSiteUrl, reraNumber, validateProject, type Issue } from "@/lib/validate"

import { EditorProvider, useProjectEditor } from "./editor/editor"
import { sectionDomId } from "./editor/section-types"
import { IssueList, scrollToTarget } from "./editor/toc"
import { LifecycleBadge, PublishBadge } from "./list/project-badges"
import { ProjectTabs } from "./project-tabs"

/* ---------------- frame: header + tabs + draft context, shared by Details and Inventory ---------------- */

export function ProjectFrame({ id, children }: { id: ID; children: React.ReactNode }) {
  const project = useProject(id)
  if (!project) return <ProjectNotFound />
  return (
    <EditorProvider key={project.id} project={project}>
      <ProjectHeader />
      {children}
    </EditorProvider>
  )
}

export function ProjectHeaderSkeleton() {
  return (
    <div aria-busy="true" aria-label="Loading project" className="pb-6">
      <div className="h-8 w-64 max-w-full rounded-md bg-muted" />
      <div className="mt-2 h-5 w-96 max-w-full rounded-md bg-muted" />
      <div className="mt-4 h-10 border-b" />
    </div>
  )
}

function ProjectNotFound() {
  return (
    <Empty className="border p-12">
      <EmptyHeader>
        <EmptyMedia>
          <FolderX aria-hidden className="size-5 text-muted-foreground" />
        </EmptyMedia>
        <EmptyTitle>Project not found</EmptyTitle>
        <EmptyDescription>It may have been deleted, or the link is out of date.</EmptyDescription>
      </EmptyHeader>
      <EmptyContent>
        <Button asChild size="lg">
          <Link href="/projects">Back to projects</Link>
        </Button>
      </EmptyContent>
    </Empty>
  )
}

/* ---------------- header ---------------- */

export function ProjectHeader() {
  const router = useRouter()
  const { state, actions } = useDemo()
  const { saved: p, draft, dirty, units, save, revealErrors } = useProjectEditor()
  const type = getProjectType(p.typeId)
  const rera = reraNumber(p)
  // Same location everywhere (list, cards, dashboard): the short one; the full one is the tooltip.
  const meta: { text: string; title?: string; numeric?: boolean }[] = [
    { text: p.typeLabel?.trim() || type.name },
    { text: p.location.short, title: p.location.full || undefined },
    ...(rera ? [{ text: `TG RERA ${rera}`, numeric: true }] : []),
  ].filter((m) => m.text)
  const live = liveSiteUrl(p)
  const pubState = p.publishing.state

  const [check, setCheck] = React.useState<Issue[] | null>(null)
  const [deleteOpen, setDeleteOpen] = React.useState(false)
  const [confirmName, setConfirmName] = React.useState("")
  const confirmRef = React.useRef<HTMLInputElement>(null)
  const pendingJump = React.useRef<SectionId | null>(null)
  /** Set by Delete: the project is removed once this route is hidden, so it never flashes "Project not found". */
  const pendingDelete = React.useRef<{ id: ID; name: string } | null>(null)
  // Next keeps hidden routes mounted (Activity): close dialogs when this route is hidden, then finish a delete.
  React.useEffect(
    () => () => {
      setCheck(null)
      setDeleteOpen(false)
      const del = pendingDelete.current
      if (!del) return
      pendingDelete.current = null
      actions.deleteProject(del.id)
      toast(`Deleted ${del.name}`)
    },
    [actions],
  )

  function publish() {
    const source = dirty ? draft : p
    const issues = validateProject(source, getProjectType(source.typeId), units, state.projects)
    const blocking = issues.filter((i) => i.level === "required")
    if (blocking.length && showGaps(blocking)) return
    if (issues.length || dirty) setCheck(issues)
    else confirmPublish()
  }

  /**
   * On Details: turns the required gaps red, focuses the first one and announces the count once.
   * False when the form isn't on screen (Inventory tab): the check dialog lists them instead.
   */
  function showGaps(blocking: Issue[]) {
    const first = SECTION_IDS.find((s) => blocking.some((i) => i.section === s))
    const section = first && document.getElementById(sectionDomId(p.id, first))
    if (!section?.offsetParent) return false
    flushSync(revealErrors)
    const field = section.querySelector<HTMLElement>('[aria-invalid="true"], [data-invalid]')
    if (field) {
      const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches
      field.scrollIntoView({ block: "center", behavior: reduce ? "auto" : "smooth" })
      field.focus({ preventScroll: true })
    } else scrollToTarget(section.id)
    toast(`${plural(blocking.length, "required field", "required fields")} missing`, {
      description: "Fill them in to publish.",
    })
    return true
  }

  function confirmPublish() {
    const name = (dirty ? save() : p).name
    actions.setPublishState(p.id, "published")
    setCheck(null)
    toast.success(`Published ${name}`, { description: dirty ? "Your changes were saved first." : undefined })
  }

  function unpublish() {
    actions.setPublishState(p.id, "draft")
    toast(`Unpublished ${p.name}`, {
      description: "It is off the website and back in drafts.",
      duration: 10_000,
      action: { label: "Undo", onClick: () => actions.setPublishState(p.id, "published") },
    })
  }

  function archive() {
    const prev = pubState
    actions.archiveProject(p.id)
    toast(`Archived ${p.name}`, {
      duration: 10_000,
      action: { label: "Undo", onClick: () => actions.setPublishState(p.id, prev) },
    })
  }

  function duplicate() {
    const id = actions.duplicateProject(p.id)
    if (!id) return
    toast.success(`Duplicated ${p.name}`, { description: "Approvals, media and the web address were cleared." })
    router.push(`/projects/${id}`)
  }

  function remove() {
    pendingDelete.current = { id: p.id, name: p.name }
    router.push("/projects")
  }

  function jumpTo(section: SectionId) {
    const target = sectionDomId(p.id, section)
    if (!scrollToTarget(target) && !scrollToTarget(sectionDomId(p.id, "page-content"))) {
      router.push(`/projects/${p.id}#${target}`)
    }
  }

  const required = check?.filter((i) => i.level === "required") ?? []
  const recommended = check?.filter((i) => i.level === "recommended") ?? []
  const blocked = required.length > 0
  const listed = blocked ? required : recommended

  return (
    <>
      <PageHeader
        title={p.name}
        titleAside={
          <>
            <LifecycleBadge lifecycle={p.lifecycle} />
            <PublishBadge state={pubState} />
            {(p.sample || p.statusSample) && <SampleBadge />}
          </>
        }
        description={
          // One line of facts; each separator travels with the item after it, so no line ends in "·". Phones: one per line.
          <p className="w-full min-w-0">
            {meta.map((m, i) => (
              <React.Fragment key={m.text}>
                {i > 0 && " "}
                <span
                  title={m.title}
                  className={cn("block max-w-full truncate align-top sm:inline-block", m.numeric && "tabular-nums")}
                >
                  {/* Phones stack the facts one per line, so the separator would only start a line. */}
                  {i > 0 && <span aria-hidden className="hidden sm:inline">·&nbsp;</span>}
                  {m.text}
                </span>
              </React.Fragment>
            ))}
          </p>
        }
        actions={
          <>
            {live && (
              <Button asChild variant="outline" size="lg">
                <a href={live} target="_blank" rel="noreferrer">
                  View on live site
                  <ArrowUpRight aria-hidden data-icon="inline-end" />
                  <span className="sr-only">(opens in a new tab)</span>
                </a>
              </Button>
            )}
            {pubState === "published" ? (
              <Button variant="outline" size="lg" onClick={unpublish}>
                Unpublish
              </Button>
            ) : (
              <Button size="lg" onClick={publish}>
                Publish
              </Button>
            )}
            <DropdownMenu modal={false}>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon-lg" aria-label="More project actions">
                  <MoreHorizontal aria-hidden />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-44">
                <DropdownMenuItem onSelect={duplicate}>
                  <Copy aria-hidden />
                  Duplicate
                </DropdownMenuItem>
                {pubState === "archived" ? (
                  <DropdownMenuItem
                    onSelect={() => {
                      actions.setPublishState(p.id, "draft")
                      toast(`Restored ${p.name} to drafts`)
                    }}
                  >
                    <ArchiveRestore aria-hidden />
                    Restore
                  </DropdownMenuItem>
                ) : (
                  <DropdownMenuItem onSelect={archive}>
                    <Archive aria-hidden />
                    Archive
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem variant="destructive" onSelect={() => setDeleteOpen(true)}>
                  <Trash2 aria-hidden />
                  Delete…
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </>
        }
      >
        <ProjectTabs
          projectId={p.id}
          projectName={p.name}
          showInventory={type.hasInventory}
          unitCount={units.length}
          dirty={dirty}
        />
      </PageHeader>

      {/* Publish check: required issues block (when the form isn't on screen); recommended ones need a confirm. */}
      <Dialog open={check !== null} onOpenChange={(o) => !o && setCheck(null)}>
        <DialogContent
          className="sm:max-w-lg"
          onCloseAutoFocus={(e) => {
            const target = pendingJump.current
            if (!target) return
            pendingJump.current = null
            e.preventDefault()
            requestAnimationFrame(() => jumpTo(target))
          }}
        >
          <DialogHeader>
            <DialogTitle className="[overflow-wrap:anywhere]">
              {blocked
                ? "Can't publish yet"
                : recommended.length
                  ? `Publish with ${plural(recommended.length, "recommendation", "recommendations")} open?`
                  : "Save and publish?"}
            </DialogTitle>
            <DialogDescription>
              {blocked
                ? `Fix ${plural(required.length, "required field", "required fields")} first.${recommended.length ? ` ${plural(recommended.length, "recommendation", "recommendations")} can wait.` : ""}`
                : recommended.length
                  ? "These don't block publishing, but buyers will see the gaps."
                  : "Your unsaved changes are saved, then the project goes live."}
              {!blocked && recommended.length > 0 && dirty && " Unsaved changes are saved first."}
            </DialogDescription>
          </DialogHeader>
          {listed.length > 0 && (
            <IssueList
              issues={listed}
              state={blocked ? "missing" : "warning"}
              onJump={(s) => {
                if (blocked) revealErrors()
                pendingJump.current = s
                setCheck(null)
              }}
            />
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setCheck(null)}>
              {blocked ? "Close" : "Cancel"}
            </Button>
            {!blocked && <Button onClick={confirmPublish}>{dirty ? "Save and publish" : "Publish anyway"}</Button>}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete: type the name to confirm (critique G9). */}
      <AlertDialog
        open={deleteOpen}
        onOpenChange={(o) => {
          setDeleteOpen(o)
          if (!o) setConfirmName("")
        }}
      >
        <AlertDialogContent
          onOpenAutoFocus={(e) => {
            e.preventDefault()
            confirmRef.current?.focus()
          }}
        >
          <AlertDialogHeader>
            <AlertDialogTitle className="[overflow-wrap:anywhere]">Delete {p.name}?</AlertDialogTitle>
            <AlertDialogDescription>
              This removes the project
              {units.length > 0 && <>, its {plural(units.length, type.unitNoun.toLowerCase(), type.unitNounPlural.toLowerCase())} and their history</>}.
              It can&apos;t be undone. To take it off the website but keep it, archive it instead.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <FieldRow
            htmlFor={`${p.id}-delete-confirm`}
            label={
              <span className="[overflow-wrap:anywhere]">
                Type <span className="font-semibold">{p.name}</span> to confirm
              </span>
            }
          >
            <Input
              ref={confirmRef}
              id={`${p.id}-delete-confirm`}
              value={confirmName}
              onChange={(e) => setConfirmName(e.target.value)}
              autoComplete="off"
              spellCheck={false}
              className="h-9"
            />
          </FieldRow>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction variant="destructive" disabled={confirmName.trim() !== p.name.trim()} onClick={remove}>
              Delete project
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
