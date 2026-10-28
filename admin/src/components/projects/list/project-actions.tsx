"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  Archive, ArchiveRestore, ArrowUpRight, Copy, EyeOff, Globe, LayoutGrid, MoreHorizontal, Pencil, Trash2,
} from "lucide-react"
import { toast } from "sonner"

import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { getProjectType } from "@/lib/constants"
import { plural } from "@/lib/format"
import { useDemo } from "@/lib/store"
import type { Project, PublishState } from "@/lib/types"
import { cn } from "@/lib/utils"
import { blockers, liveSiteUrl, validateProject } from "@/lib/validate"

import type { ProjectRow } from "./list-model"

/**
 * When an action moves a row out of the current tab or filter, focus would drop to <body>. Remember the rows
 * around it now; once React has re-rendered, focus the next row's name link (or the previous one at the end).
 */
function keepFocusInList(trigger: HTMLElement | null) {
  const row = trigger?.closest<HTMLElement>("[data-project-row]")
  const list = row?.parentElement
  if (!row || !list) return
  const ids = [...list.children].map((el) => (el as HTMLElement).dataset.projectRow)
  const i = ids.indexOf(row.dataset.projectRow)
  const order = [...ids.slice(i + 1), ...ids.slice(0, i).reverse()]
  setTimeout(() => {
    if (row.isConnected) return // still listed: the menu returns focus to its trigger as usual
    for (const id of order) {
      const link = list.querySelector<HTMLElement>(`[data-project-row="${id}"] [data-row-link]`)
      if (link) return link.focus()
    }
  }, 0)
}

/**
 * Publish-state changes from a list row: every change toasts with Undo, and publishing first checks the required
 * fields (a project with gaps stays put and offers the editor). Shared by the ⋯ menu and the Active toggle.
 */
function usePublishControl(row: ProjectRow) {
  const router = useRouter()
  const { state, actions } = useDemo()
  const p = row.project
  const publish = p.publishing.state

  const setState = (to: PublishState, message: string, from: HTMLElement | null) => {
    keepFocusInList(from)
    actions.setPublishState(p.id, to)
    toast(message, { duration: 10_000, action: { label: "Undo", onClick: () => actions.setPublishState(p.id, publish) } })
  }

  /** False when required fields are missing (nothing changes). */
  const doPublish = (from: HTMLElement | null, message = `${p.name} is published`) => {
    const missing = blockers(validateProject(p, row.type, state.units[p.id] ?? [], state.projects))
    if (missing.length) {
      toast.error(`${p.name} can't be published yet`, {
        description: `${plural(missing.length, "required field is", "required fields are")} missing. ${missing[0].message}`,
        action: { label: "Open editor", onClick: () => router.push(`/projects/${p.id}`) },
      })
      return false
    }
    setState("published", message, from)
    return true
  }

  return { publish, setState, doPublish }
}

/**
 * Active / Inactive: whether the project shows on the website. On publishes it (after the required-field check), off
 * moves it to drafts; both toast with Undo. Archived projects read "Archived" and switch straight to published.
 */
export function ActiveToggle({ row, className }: { row: ProjectRow; className?: string }) {
  const p = row.project
  const { publish, setState, doPublish } = usePublishControl(row)
  const ref = React.useRef<HTMLButtonElement>(null)
  const active = publish === "published"
  const id = React.useId()

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <Switch
        ref={ref}
        id={id}
        checked={active}
        className="data-checked:bg-success"
        aria-label={`Show ${p.name} on the website`}
        onCheckedChange={(on) => {
          if (on) doPublish(ref.current, `${p.name} is active on the website`)
          else setState("draft", `${p.name} is inactive: hidden from the website`, ref.current)
        }}
      />
      <span aria-hidden className={cn("text-xs font-medium", active ? "text-success" : "text-muted-foreground")}>
        {active ? "Active" : publish === "archived" ? "Archived" : "Inactive"}
      </span>
    </div>
  )
}

/** Row / card ⋯ menu. Always visible (not hover-only). Delete is lifted to one dialog per list. */
export function ProjectMenu({ row, onDelete }: { row: ProjectRow; onDelete: (p: Project) => void }) {
  const router = useRouter()
  const { actions } = useDemo()
  const p = row.project
  const live = liveSiteUrl(p)
  const triggerRef = React.useRef<HTMLButtonElement>(null)
  const control = usePublishControl(row)
  const { publish } = control
  const setState = (to: PublishState, message: string) => control.setState(to, message, triggerRef.current)
  const doPublish = () => control.doPublish(triggerRef.current)

  const duplicate = () => {
    const id = actions.duplicateProject(p.id)
    if (!id) return
    toast.success(`Draft created from ${p.name}`, { description: "Photos, approvals and inventory were not copied." })
    router.push(`/projects/${id}`)
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button ref={triggerRef} variant="ghost" size="icon-sm" aria-label={`Actions for ${p.name}`}>
          <MoreHorizontal />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-52">
        <DropdownMenuItem asChild>
          <Link href={`/projects/${p.id}`}>
            <Pencil />
            Edit details
          </Link>
        </DropdownMenuItem>
        {row.type.hasInventory && (
          <DropdownMenuItem asChild>
            <Link href={`/projects/${p.id}/inventory`}>
              <LayoutGrid />
              Manage inventory
            </Link>
          </DropdownMenuItem>
        )}
        {live && (
          <DropdownMenuItem asChild>
            <a href={live} target="_blank" rel="noreferrer">
              <Globe />
              View on live site
              <ArrowUpRight className="ml-auto text-muted-foreground" />
              <span className="sr-only">(opens in a new tab)</span>
            </a>
          </DropdownMenuItem>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={duplicate}>
          <Copy />
          Duplicate
        </DropdownMenuItem>
        {publish === "published" && (
          <DropdownMenuItem onSelect={() => setState("draft", `${p.name} moved to drafts`)}>
            <EyeOff />
            Unpublish
          </DropdownMenuItem>
        )}
        {publish === "draft" && (
          <DropdownMenuItem onSelect={doPublish}>
            <Globe />
            Publish
          </DropdownMenuItem>
        )}
        {publish === "archived" ? (
          <DropdownMenuItem onSelect={() => setState("draft", `${p.name} restored as a draft`)}>
            <ArchiveRestore />
            Restore
          </DropdownMenuItem>
        ) : (
          <DropdownMenuItem onSelect={() => setState("archived", `${p.name} archived`)}>
            <Archive />
            Archive
          </DropdownMenuItem>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem variant="destructive" onSelect={() => onDelete(p)}>
          <Trash2 />
          Delete…
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

/** Type-the-name-to-confirm delete (critique G9). Keeps the last project while the close animation runs. */
export function DeleteProjectDialog({ project, onClose }: { project: Project | null; onClose: () => void }) {
  const { state, actions } = useDemo()
  const [shown, setShown] = React.useState<Project | null>(project)
  const [typed, setTyped] = React.useState("")
  const inputRef = React.useRef<HTMLInputElement>(null)
  if (project && project !== shown) {
    setShown(project)
    setTyped("")
  }
  if (!shown) return null

  const units = state.units[shown.id]?.length ?? 0
  const type = getProjectType(shown.typeId)
  const ok = typed.trim() === shown.name
  const confirm = () => {
    actions.deleteProject(shown.id)
    toast(`${shown.name} deleted`)
    onClose()
  }

  return (
    <AlertDialog open={!!project} onOpenChange={(open) => !open && onClose()}>
      <AlertDialogContent
        className="data-[size=default]:sm:max-w-md"
        // Radix focuses Cancel by default; the one thing to do here is type the name.
        onOpenAutoFocus={(e) => {
          e.preventDefault()
          inputRef.current?.focus()
        }}
      >
        <AlertDialogHeader>
          <AlertDialogTitle className="[overflow-wrap:anywhere]">Delete {shown.name}?</AlertDialogTitle>
          <AlertDialogDescription>
            This removes the project
            {units > 0 && <>, its {plural(units, type.unitNoun.toLowerCase(), type.unitNounPlural.toLowerCase())} and their status history</>} for good. To take it off the
            website but keep it, archive it instead.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="grid gap-1.5">
          <Label htmlFor="delete-project-confirm" className="font-normal">
            Type <span className="font-semibold">{shown.name}</span> to confirm
          </Label>
          <Input
            ref={inputRef}
            id="delete-project-confirm"
            value={typed}
            onChange={(e) => setTyped(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && ok) confirm()
            }}
            autoComplete="off"
            spellCheck={false}
          />
        </div>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction variant="destructive" disabled={!ok} onClick={confirm}>
            Delete project
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
