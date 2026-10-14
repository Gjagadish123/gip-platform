// Adapted from 21st.dev: wensity/file-uploader (demo 31348) + sean0205/c-sortable-7 ReUI sortable grid (demo 29834)
"use client"

import * as React from "react"
import { Captions, GripVertical, ImageIcon, MoreHorizontal, Star, Trash2, TriangleAlert } from "lucide-react"

import { cn } from "@/lib/utils"
import { saveUpload } from "@/lib/media-store"
import type { Asset } from "@/lib/types"
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
import { Input } from "@/components/ui/input"
import { AssetImage } from "./asset-image"
import { Dropzone } from "./dropzone"
import { FieldMessage } from "./field-row"
import { Sortable, SortableItem } from "./sortable"

const getId = (a: Asset) => a.id

/** Ids of assets whose URL already appeared earlier in the list. */
function duplicateIds(assets: Asset[]) {
  const seen = new Set<string>()
  const dups = new Set<string>()
  for (const a of assets) {
    if (seen.has(a.url)) dups.add(a.id)
    seen.add(a.url)
  }
  return dups
}

const chip = "inline-flex h-5 items-center rounded-md border px-1.5 text-xs font-medium"

/**
 * Ordered image gallery: drop/browse (multi) into IndexedDB, sortable tiles (handle: pointer or keyboard),
 * per-tile menu (set as cover / hero, caption / alt text, remove), duplicate-URL warning.
 */
export function GalleryField({
  value,
  onChange,
  coverId,
  onSetCover,
  heroId,
  onSetHero,
  noun = "image",
  className,
}: {
  value: Asset[]
  onChange: (next: Asset[]) => void
  /** Asset id currently used as the listing cover (gets a "Cover" chip). */
  coverId?: string | null
  onSetCover?: (asset: Asset) => void
  /** Asset id currently used as the page hero (gets a "Hero" chip). */
  heroId?: string | null
  onSetHero?: (asset: Asset) => void
  noun?: string
  className?: string
}) {
  const baseId = React.useId()
  const latest = React.useRef(value)
  React.useEffect(() => {
    latest.current = value
  }, [value])
  const dropRef = React.useRef<HTMLButtonElement>(null)
  /** Tile whose menu chose Remove; removed once the menu has closed, so focus can move on cleanly. */
  const removing = React.useRef<string | null>(null)

  const [pending, setPending] = React.useState(0)
  const [error, setError] = React.useState<string | null>(null)
  const [editing, setEditing] = React.useState<Asset | null>(null)
  // Close the caption dialog when the route is hidden (Activity) or unmounted.
  React.useEffect(() => () => setEditing(null), [])

  const dups = React.useMemo(() => duplicateIds(value), [value])
  const nameOf = (a: Asset, i: number) => a.alt || a.name || `${noun} ${i + 1}`
  const triggerId = (id: string) => `${baseId}-${id}-actions`
  const focusSoon = (id?: string) =>
    requestAnimationFrame(() => (id ? document.getElementById(id) : dropRef.current)?.focus())

  async function upload(files: File[], rejected: string[]) {
    setError(rejected.length ? rejected.join(". ") : null)
    if (!files.length) return
    setPending((n) => n + files.length)
    const results = await Promise.allSettled(files.map((f) => saveUpload(f)))
    setPending((n) => n - files.length)
    const saved = results.flatMap((r) => (r.status === "fulfilled" ? [r.value] : []))
    const failed = results.length - saved.length
    if (failed) setError(`${failed} ${failed === 1 ? noun : `${noun}s`} couldn't be stored in the browser.`)
    if (saved.length) onChange([...latest.current, ...saved])
  }

  function remove(id: string) {
    const i = value.findIndex((a) => a.id === id)
    const next = value[i + 1]
    onChange(value.filter((a) => a.id !== id))
    focusSoon(next && triggerId(next.id))
  }

  const patch = (id: string, next: Partial<Asset>) =>
    onChange(value.map((a) => (a.id === id ? { ...a, ...next } : a)))

  return (
    <div className={cn("flex min-w-0 flex-col gap-3", className)}>
      {dups.size > 0 && (
        <div
          role="status"
          className="flex flex-wrap items-center justify-between gap-2 rounded-lg border bg-muted/40 px-3 py-2 text-[13px] text-foreground"
        >
          <span className="flex items-center gap-2">
            <TriangleAlert aria-hidden className="size-3.5 shrink-0 text-warning" />
            {dups.size === 1 ? `1 ${noun} appears` : `${dups.size} ${noun}s appear`} twice. The website would show{" "}
            {dups.size === 1 ? "it" : "them"} twice.
          </span>
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => {
              onChange(value.filter((a) => !dups.has(a.id)))
              focusSoon()
            }}
          >
            Remove duplicates
          </Button>
        </div>
      )}

      {value.length > 0 && (
        <Sortable
          items={value}
          getId={getId}
          onReorder={onChange}
          strategy="grid"
          noun={noun}
          label={(id) => {
            const i = value.findIndex((a) => a.id === id)
            return i < 0 ? undefined : nameOf(value[i], i)
          }}
          className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4"
        >
          {value.map((asset, index) => {
            const isCover = !!coverId && asset.id === coverId
            const isHero = !!heroId && asset.id === heroId
            const isDup = dups.has(asset.id)
            const name = nameOf(asset, index)
            return (
              <SortableItem key={asset.id} id={asset.id}>
                {(handle, dragging) => (
                  <figure className="group flex min-w-0 flex-col gap-1.5">
                    <div
                      className={cn(
                        "relative aspect-[4/3] overflow-hidden rounded-xl border bg-muted",
                        dragging && "shadow-overlay",
                        isDup && "border-warning",
                      )}
                    >
                      <AssetImage asset={asset} alt={asset.alt ?? ""} className="size-full" />
                      <div className="pointer-events-none absolute top-2 left-2 flex flex-wrap gap-1">
                        {isCover && <span className={cn(chip, "bg-background text-foreground")}>Cover</span>}
                        {isHero && <span className={cn(chip, "bg-background text-foreground")}>Hero</span>}
                        {isDup && (
                          <span className={cn(chip, "gap-1 bg-background text-warning")}>
                            <TriangleAlert aria-hidden className="size-3" />
                            Duplicate
                          </span>
                        )}
                        {asset.source === "generated" && (
                          <span className={cn(chip, "border-transparent bg-muted text-muted-foreground")}>Sample data</span>
                        )}
                      </div>
                      <div className="absolute top-2 right-2 flex gap-1 opacity-0 transition-opacity group-focus-within:opacity-100 group-hover:opacity-100 group-has-[[aria-expanded=true]]:opacity-100 pointer-coarse:opacity-100">
                        <button
                          type="button"
                          {...handle}
                          aria-label={`Reorder ${name}, position ${index + 1} of ${value.length}`}
                          className="inline-flex size-7 cursor-grab touch-none items-center justify-center rounded-md border bg-background text-muted-foreground outline-none hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-ring active:cursor-grabbing"
                        >
                          <GripVertical aria-hidden className="size-4" />
                        </button>
                        <DropdownMenu modal={false}>
                          <DropdownMenuTrigger asChild>
                            <button
                              id={triggerId(asset.id)}
                              type="button"
                              aria-label={`Actions for ${name}`}
                              className="inline-flex size-7 items-center justify-center rounded-md border bg-background text-muted-foreground outline-none hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-ring"
                            >
                              <MoreHorizontal aria-hidden className="size-4" />
                            </button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent
                            align="end"
                            className="w-48"
                            onCloseAutoFocus={(e) => {
                              if (removing.current !== asset.id) return
                              removing.current = null
                              e.preventDefault()
                              remove(asset.id)
                            }}
                          >
                            {onSetCover && (
                              <DropdownMenuItem disabled={isCover} onSelect={() => onSetCover(asset)}>
                                <Star aria-hidden />
                                {isCover ? "Current cover" : "Set as cover"}
                              </DropdownMenuItem>
                            )}
                            {onSetHero && (
                              <DropdownMenuItem disabled={isHero} onSelect={() => onSetHero(asset)}>
                                <ImageIcon aria-hidden />
                                {isHero ? "Current hero" : "Set as hero"}
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem onSelect={() => setEditing(asset)}>
                              <Captions aria-hidden />
                              Edit caption
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              variant="destructive"
                              onSelect={() => {
                                removing.current = asset.id
                              }}
                            >
                              <Trash2 aria-hidden />
                              Remove
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                    <figcaption className="min-w-0">
                      <button
                        type="button"
                        onClick={() => setEditing(asset)}
                        className={cn(
                          "max-w-full truncate rounded-sm text-left text-xs outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring",
                          asset.alt
                            ? "text-muted-foreground"
                            : "text-muted-foreground/70 opacity-0 transition-opacity group-focus-within:opacity-100 group-hover:opacity-100 pointer-coarse:opacity-100",
                        )}
                      >
                        {asset.alt || "Add caption"}
                      </button>
                    </figcaption>
                  </figure>
                )}
              </SortableItem>
            )
          })}
          {Array.from({ length: pending }, (_, i) => (
            <div key={`pending-${i}`} aria-hidden className="aspect-[4/3] rounded-xl border bg-muted" />
          ))}
        </Sortable>
      )}

      <Dropzone
        ref={dropRef}
        accept="image/*"
        multiple
        busy={pending > 0 && value.length === 0}
        onFiles={upload}
        title={value.length ? `Drop more ${noun}s or browse` : `Drop ${noun}s or browse`}
        ariaLabel={`Add ${noun}s: drop files or browse`}
        className={value.length ? "py-4" : "py-10"}
      />

      {value.length > 1 && (
        <p className="text-xs text-muted-foreground">
          {value.length} {noun}s, shown on the website in this order. Drag a handle, or focus it and use Space and
          the arrow keys.
        </p>
      )}
      {error && (
        <div role="alert">
          <FieldMessage kind="error">{error}</FieldMessage>
        </div>
      )}

      <CaptionDialog
        asset={editing}
        onClose={() => setEditing(null)}
        onSave={(alt) => {
          if (editing) patch(editing.id, { alt })
          setEditing(null)
        }}
      />
    </div>
  )
}

function CaptionDialog({
  asset,
  onClose,
  onSave,
}: {
  asset: Asset | null
  onClose: () => void
  onSave: (alt: string) => void
}) {
  return (
    <Dialog open={!!asset} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        {asset && <CaptionForm key={asset.id} asset={asset} onCancel={onClose} onSave={onSave} />}
      </DialogContent>
    </Dialog>
  )
}

function CaptionForm({
  asset,
  onCancel,
  onSave,
}: {
  asset: Asset
  onCancel: () => void
  onSave: (alt: string) => void
}) {
  const [alt, setAlt] = React.useState(asset.alt ?? "")
  const id = React.useId()
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        onSave(alt.trim())
      }}
      className="flex flex-col gap-4"
    >
      <DialogHeader>
        <DialogTitle>Edit caption</DialogTitle>
        <DialogDescription>Describes the photo for screen readers and search engines.</DialogDescription>
      </DialogHeader>
      <div className="flex gap-3">
        <AssetImage asset={asset} alt="" className="size-16 shrink-0 rounded-md border" />
        <div className="flex min-w-0 flex-1 flex-col gap-1.5">
          <label htmlFor={id} className="text-sm font-medium">
            Caption / alt text
          </label>
          <Input
            id={id}
            className="h-9"
            value={alt}
            autoFocus
            placeholder="e.g. 40 ft internal road with avenue plantation"
            onChange={(e) => setAlt(e.target.value)}
          />
        </div>
      </div>
      <DialogFooter>
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit">Save caption</Button>
      </DialogFooter>
    </form>
  )
}
