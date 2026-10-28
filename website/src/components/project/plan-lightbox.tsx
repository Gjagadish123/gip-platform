"use client";

import { Download, Expand, Minus, Plus, X } from "lucide-react";
import Image from "next/image";
import { useState } from "react";

import { gcviLayoutCopy } from "@/assets/images";
import { Button } from "@/components/ui/button";
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

// 0 fits the whole sheet in the window; the others are multiples of the window width, panned by scrolling.
const LEVELS = [0, 1, 1.75, 2.5] as const;
const ALT = "Global City VI layout copy: 288 numbered plots with sizes, 40 ft and 30 ft roads, parks and the land-use table";

/** The layout copy in a white hairline frame; it opens full screen with zoom and pan (scroll, or pinch on phones). */
export function PlanLightbox({ pdf }: { pdf?: string }) {
  const [level, setLevel] = useState(0);
  const zoom = LEVELS[level];

  return (
    <Dialog onOpenChange={(open) => !open && setLevel(0)}>
      <DialogTrigger asChild>
        <button
          type="button"
          className="group relative block w-full cursor-zoom-in overflow-hidden rounded-lg border border-line bg-white p-3 text-left sm:p-5"
          aria-label="Open the layout copy full size"
        >
          <span className="relative block aspect-[4/5] overflow-hidden rounded-md">
            <Image
              src={gcviLayoutCopy}
              alt={ALT}
              fill
              sizes="(min-width: 1024px) 640px, 100vw"
              className="object-contain transition-transform duration-700 ease-(--ease-out) group-hover:scale-[1.03]"
            />
          </span>
          <span className="absolute right-5 bottom-5 inline-flex h-10 items-center gap-2 rounded-md border border-line-strong bg-white px-4 text-ui font-medium text-navy shadow-raise transition-colors duration-300 group-hover:bg-mist sm:right-7 sm:bottom-7">
            <Expand aria-hidden className="size-4" /> View full size
          </span>
        </button>
      </DialogTrigger>
      <DialogContent
        showCloseButton={false}
        className="flex h-[92dvh] w-[96vw] max-w-[1280px] flex-col gap-0 overflow-hidden rounded-lg p-0 sm:max-w-[1280px]"
      >
        <div className="flex items-center gap-2 border-b border-line px-4 py-3 sm:px-5">
          <DialogTitle className="mr-auto truncate text-h3 text-navy">Layout copy</DialogTitle>
          <DialogDescription className="sr-only">Zoom with the buttons, then scroll to move around the sheet.</DialogDescription>
          <Button variant="secondary" size="icon" aria-label="Zoom out" disabled={level === 0} onClick={() => setLevel((l) => Math.max(0, l - 1))}>
            <Minus />
          </Button>
          <span aria-live="polite" className="w-14 text-center text-small text-muted tabular-nums">
            {zoom ? `${Math.round(zoom * 100)}%` : "Fit"}
          </span>
          <Button
            variant="secondary"
            size="icon"
            aria-label="Zoom in"
            disabled={level === LEVELS.length - 1}
            onClick={() => setLevel((l) => Math.min(LEVELS.length - 1, l + 1))}
          >
            <Plus />
          </Button>
          {pdf ? (
            <Button asChild variant="secondary" className="hidden sm:inline-flex">
              <a href={pdf} target="_blank" rel="noreferrer" download>
                <Download aria-hidden /> PDF
              </a>
            </Button>
          ) : null}
          <DialogClose asChild>
            <Button size="icon" aria-label="Close">
              <X />
            </Button>
          </DialogClose>
        </div>
        {/* Focusable so the keyboard can pan with the arrow keys. */}
        <div tabIndex={0} aria-label="Layout copy, scroll to pan" className="min-h-0 flex-1 overflow-auto overscroll-contain bg-mist">
          <Image
            src={gcviLayoutCopy}
            alt={ALT}
            sizes="2200px"
            className={zoom ? "mx-auto h-auto max-w-none" : "size-full object-contain"}
            style={zoom ? { width: `${zoom * 100}%` } : undefined}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
