"use client"

import * as React from "react"
import { ArrowUpRight, FileText, Image as ImageIcon, Link2, Loader2, RefreshCw, Trash2 } from "lucide-react"

import { cn } from "@/lib/utils"
import { saveUpload, useAssetUrl } from "@/lib/media-store"
import type { Asset } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { InputGroup, InputGroupAddon, InputGroupButton, InputGroupInput } from "@/components/ui/input-group"
import { AssetImage } from "./asset-image"
import { Dropzone, IMAGE_ACCEPT, LOCAL_UPLOAD_HINT, screenFiles, uploadErrorMessage } from "./dropzone"
import { FieldMessage, LabelMark } from "./field-row"
import { focusIsWithin, focusLater } from "./image-field"

const ACCEPT = `application/pdf,${IMAGE_ACCEPT}`
const IMAGE_EXT = /\.(png|jpe?g|webp|avif|gif)(?:[?#]|$)/i

function fileNameFromUrl(url: string) {
  try {
    return decodeURIComponent(new URL(url, "https://x").pathname.split("/").pop() || url)
  } catch {
    return url
  }
}

/**
 * PDF (or image) by link or upload. Shows the file, an "Open PDF" link at the chosen page, an optional page
 * number, and an inline <iframe> preview toggle. Remote PDFs are links; uploads go to IndexedDB.
 */
export function PdfField({
  value,
  onChange,
  page,
  onPageChange,
  label,
  mark,
  id,
  invalid,
  "aria-describedby": describedBy,
  className,
}: {
  value: Asset | null
  onChange: (next: Asset | null) => void
  /** 1-based page the website renders. */
  page?: number
  onPageChange?: (page: number) => void
  label?: string
  /** Muted requirement after the label: "Required", "Optional". */
  mark?: React.ReactNode
  id?: string
  /** Forwarded to the link input and the drop button (a required file is missing). */
  invalid?: boolean
  "aria-describedby"?: string
  className?: string
}) {
  const autoId = React.useId()
  const baseId = id ?? autoId
  const [link, setLink] = React.useState("")
  const [error, setError] = React.useState<string | null>(null)
  const [busy, setBusy] = React.useState(false)
  const [preview, setPreview] = React.useState(false)
  const pickerRef = React.useRef<HTMLInputElement>(null)
  const rootRef = React.useRef<HTMLDivElement>(null)
  const replaceRef = React.useRef<HTMLButtonElement>(null)
  const linkRef = React.useRef<HTMLInputElement>(null)
  const url = useAssetUrl(value)
  const isPdf = value?.kind !== "image"
  const pageNo = Math.max(1, page ?? 1)

  async function upload(files: File[], rejected: string[]) {
    setError(rejected[0] ?? null)
    const file = files[0]
    if (!file) return
    setBusy(true)
    try {
      const asset = await saveUpload(file)
      const keepFocus = focusIsWithin(rootRef.current)
      onChange(asset)
      if (keepFocus) focusLater(replaceRef)
    } catch (e) {
      setError(uploadErrorMessage(e, "file"))
    } finally {
      setBusy(false)
    }
  }

  function addLink() {
    const href = link.trim()
    if (!/^(https?:\/\/|\/)\S+$/i.test(href)) {
      setError("Enter a full link starting with https://")
      return
    }
    setError(null)
    setLink("")
    onChange({
      // Not crypto.randomUUID(): it only exists on secure origins (http://<LAN IP> has none). Store's mintId pattern.
      id: `ext-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`,
      url: href,
      kind: IMAGE_EXT.test(href) ? "image" : "pdf",
      name: fileNameFromUrl(href),
      source: "external",
    })
    focusLater(replaceRef)
  }

  const openHref = url && (isPdf ? `${url}#page=${pageNo}` : url)

  return (
    <div ref={rootRef} className={cn("flex min-w-0 flex-col gap-1.5", className)}>
      {label && (
        <label htmlFor={value ? undefined : `${baseId}-link`} className="flex items-center gap-2 text-sm leading-5 font-medium">
          {label}
          {mark && <LabelMark mark={mark} />}
        </label>
      )}

      {!value ? (
        <div className="flex flex-col gap-2">
          <InputGroup className="h-9">
            <InputGroupAddon>
              <Link2 aria-hidden />
            </InputGroupAddon>
            <InputGroupInput
              ref={linkRef}
              id={`${baseId}-link`}
              type="url"
              inputMode="url"
              value={link}
              placeholder="Paste a link to a PDF"
              aria-invalid={!!error || invalid || undefined}
              aria-describedby={[describedBy, error && `${baseId}-link-error`].filter(Boolean).join(" ") || undefined}
              onChange={(e) => {
                setLink(e.target.value)
                setError(null)
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault()
                  addLink()
                }
              }}
            />
            <InputGroupAddon align="inline-end">
              <InputGroupButton variant="secondary" disabled={!link.trim()} onClick={addLink}>
                Add link
              </InputGroupButton>
            </InputGroupAddon>
          </InputGroup>
          <Dropzone
            accept={ACCEPT}
            busy={busy}
            onFiles={upload}
            icon={<FileText />}
            title="Or drop a PDF here, or browse"
            ariaLabel={`${label ?? "File"}: drop a PDF or browse`}
            invalid={invalid}
            aria-describedby={describedBy}
            className="py-4"
          />
        </div>
      ) : (
        <div className="flex flex-col gap-3 rounded-xl border p-3">
          <div className="flex flex-wrap items-center gap-3">
            <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
              {isPdf ? <FileText aria-hidden className="size-4" /> : <ImageIcon aria-hidden className="size-4" />}
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{value.name || fileNameFromUrl(value.url)}</p>
              <p className="truncate text-xs text-muted-foreground">
                {value.source === "upload"
                  ? LOCAL_UPLOAD_HINT || "Uploaded"
                  : value.url.startsWith("/")
                    ? "Bundled with the site"
                    : `Link · ${hostOf(value.url)}`}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-1.5">
              {openHref && (
                <Button asChild variant="outline">
                  <a href={openHref} target="_blank" rel="noreferrer">
                    {isPdf ? "Open PDF" : "Open image"}
                    <ArrowUpRight aria-hidden />
                    <span className="sr-only">(opens in a new tab)</span>
                  </a>
                </Button>
              )}
              <Button
                type="button"
                variant="outline"
                aria-expanded={preview}
                aria-controls={`${baseId}-preview`}
                onClick={() => setPreview((p) => !p)}
              >
                {preview ? "Hide preview" : "Preview"}
              </Button>
              <input
                ref={pickerRef}
                type="file"
                accept={ACCEPT}
                tabIndex={-1}
                aria-hidden
                className="sr-only"
                onChange={(e) => {
                  if (e.target.files?.length) {
                    const { ok, rejected } = screenFiles([e.target.files[0]], ACCEPT)
                    void upload(ok, rejected)
                  }
                  e.target.value = ""
                }}
              />
              <Button
                ref={replaceRef}
                type="button"
                variant="ghost"
                size="icon"
                aria-label="Replace with an upload"
                disabled={busy}
                onClick={() => pickerRef.current?.click()}
              >
                {busy ? <Loader2 aria-hidden className="animate-spin" /> : <RefreshCw aria-hidden />}
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                aria-label="Remove file"
                className="text-muted-foreground hover:text-destructive"
                onClick={() => {
                  setPreview(false)
                  onChange(null)
                  focusLater(linkRef)
                }}
              >
                <Trash2 aria-hidden />
              </Button>
            </div>
          </div>

          {isPdf && onPageChange && (
            <div className="flex items-center gap-2">
              <label htmlFor={`${baseId}-page`} className="text-sm text-muted-foreground">
                Page shown on the website
              </label>
              <Input
                id={`${baseId}-page`}
                type="number"
                inputMode="numeric"
                min={1}
                step={1}
                value={pageNo}
                onChange={(e) => {
                  const n = Math.floor(Number(e.target.value))
                  if (n >= 1) onPageChange(n)
                }}
                className="h-9 w-20 tabular-nums"
              />
            </div>
          )}

          {preview && (
            <div id={`${baseId}-preview`}>
              {!url ? (
                <div className="h-24 rounded-lg bg-muted" />
              ) : isPdf ? (
                <iframe
                  key={`${url}#${pageNo}`}
                  src={`${url}#page=${pageNo}`}
                  title={`${label ?? "PDF"} preview, page ${pageNo}`}
                  className="h-[480px] w-full rounded-lg border bg-muted"
                />
              ) : (
                <AssetImage asset={value} alt={label ?? ""} className="max-h-[480px] w-full rounded-lg border object-contain" />
              )}
              <p className="mt-1.5 text-xs text-muted-foreground">
                If the preview stays blank, the host may block embedding. Use Open {isPdf ? "PDF" : "image"} instead.
              </p>
            </div>
          )}
        </div>
      )}

      {error && (
        <div role="alert">
          <FieldMessage id={`${baseId}-link-error`} kind="error">
            {error}
          </FieldMessage>
        </div>
      )}
    </div>
  )
}

function hostOf(url: string) {
  try {
    return new URL(url).host
  } catch {
    return url
  }
}
