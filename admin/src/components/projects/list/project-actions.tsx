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
import { getProjectType } from "@/lib/constants"
import { plural } from "@/lib/format"
import { useDemo } from "@/lib/store"
import type { Project, PublishState } from "@/lib/types"
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

/** Row / card ⋯ menu. Always visible (not hover-only). Delete is lifted to one dialog per list. */
export function ProjectMenu({ row, onDelete }: { row: ProjectRow; onDelete: (p: Project) => void }) {
  const router = useRouter()
  const { state, actions } = useDemo()
  const p = row.project
  const publish = p.publishing.state
  const live = liveSiteUrl(p)
  const triggerRef = React.useRef<HTMLButtonElement>(null)

  const setState = (to: PublishState, message: string) => {
    keepFocusInList(triggerRef.current)
    actions.setPublishState(p.id, to)
    toast(message, { duration: 10_000, action: { label: "Undo", onClick: () => actions.setPublishState(p.id, publish) } })
  }

  const doPublish = () => {
    const missing = blockers(validateProject(p, row.type, state.units[p.id] ?? [], state.projects))
    if (missing.length) {
      toast.error(`${p.name} can't be published yet`, {
        description: `${plural(missing.length, "required field is", "required fields are")} missing. ${missing[0].message}`,
        action: { label: "Open editor", onClick: () => router.push(`/projects/${p.id}`) },
      })
      return
    }
    setState("published", `${p.name} is published`)
  }

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
