"use client"

import * as React from "react"
import { ImageOff } from "lucide-react"

import { cn } from "@/lib/utils"
import { useAssetUrl } from "@/lib/media-store"
import type { Asset } from "@/lib/types"

/**
 * Plain <img> for any Asset URL (https, /brand, idb: uploads). A muted block shows while the URL resolves and the
 * photo loads (no white boxes); a missing upload or a failed remote (Supabase over quota) shows a quiet ImageOff
 * tile. `className` sizes every state.
 */
export function AssetImage({
  asset,
  alt,
  className,
  loading = "lazy",
}: {
  asset: Asset | null | undefined
  alt: string
  className?: string
  loading?: "lazy" | "eager"
}) {
  // undefined = still resolving (idb: upload), null = nothing to show.
  const url: string | null | undefined = useAssetUrl(asset ?? null)
  const [loadedUrl, setLoadedUrl] = React.useState<string | null>(null)
  const [failedUrl, setFailedUrl] = React.useState<string | null>(null)

  if (url === undefined) {
    return <span aria-hidden className={cn("block bg-muted", className)} />
  }
  if (!url || failedUrl === url) {
    return (
      <span
        role="img"
        aria-label={alt ? `${alt} (image unavailable)` : "Image unavailable"}
        className={cn("flex items-center justify-center bg-muted text-muted-foreground", className)}
      >
        <ImageOff aria-hidden className="size-5" />
      </span>
    )
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element -- hot-linked remote + idb blob URLs; next/image can't optimise these in a UI-only build
    <img
      // Cached images can finish before React attaches onLoad.
      ref={(el) => {
        if (el?.complete && el.naturalWidth && loadedUrl !== url) setLoadedUrl(url)
      }}
      src={url}
      alt={alt}
      loading={loading}
      decoding="async"
      onLoad={() => setLoadedUrl(url)}
      onError={() => setFailedUrl(url)}
      className={cn("object-cover", loadedUrl !== url && "bg-muted", className)}
    />
  )
}
