"use client";

import { ChevronLeft, ChevronRight, X } from "lucide-react";
import Image, { type StaticImageData } from "next/image";
import { useId, useState, type KeyboardEvent } from "react";

import { Container } from "@/components/site/container";
import { ImpressionChip } from "@/components/site/plate";
import { Section } from "@/components/site/section";
import { Lede } from "@/components/site/typography";
import { Button } from "@/components/ui/button";
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

import { Segmented } from "./parts";

export interface Slide {
  src: StaticImageData | string;
  alt: string;
  caption: string;
  impression?: boolean;
}

type Filter = "all" | "photos" | "impressions";

const pad = (n: number) => String(n).padStart(2, "0");
const keyOf = (s: Slide) => (typeof s.src === "string" ? s.src : s.src.src);

/**
 * Site gallery: a filter over photos and impressions, a grid whose first tile is large, and a lightbox with previous /
 * next buttons, arrow keys and a counter. Impressions keep their chip everywhere.
 */
export function Gallery({ slides }: { slides: Slide[] }) {
  const uid = useId();
  const [filter, setFilter] = useState<Filter>("all");
  const [open, setOpen] = useState<number | null>(null);

  const photos = slides.filter((s) => !s.impression).length;
  const shown = filter === "all" ? slides : slides.filter((s) => (filter === "impressions" ? s.impression : !s.impression));
  const big = shown.length >= 5; // the 2 × 2 lead tile needs four tiles beside it
  const current = open === null ? null : shown[open];
  const go = (d: number) => setOpen((i) => (i === null ? i : (i + d + shown.length) % shown.length));
  const onKey = (e: KeyboardEvent) => {
    if (e.key === "ArrowRight") go(1);
    else if (e.key === "ArrowLeft") go(-1);
    else return;
    e.preventDefault();
  };
  const tabId = (f: Filter) => `${uid}-tab-${f}`;
  const panelId = `${uid}-panel`;

  return (
    <Section id="gallery" aria-labelledby="gallery-title" className="border-t border-line">
      <Container>
        <h2 id="gallery-title" className="text-h2">
          Site gallery
        </h2>
        <Lede className="mt-4 max-w-[52ch]">Photographs from the site, March 2026, then artist&rsquo;s impressions, each one marked.</Lede>

        <Segmented
          label="Gallery filter"
          options={[
            { id: "all", label: "All" },
            { id: "photos", label: <>Site photos <span className="text-small text-muted tabular-nums">{photos}</span></> },
            { id: "impressions", label: <>Impressions <span className="text-small text-muted tabular-nums">{slides.length - photos}</span></> },
          ]}
          value={filter}
          onChange={(f) => {
            setFilter(f);
            setOpen(null);
          }}
          idOf={tabId}
          panelId={panelId}
          className="mt-8 lg:mt-10"
        />

        <ul id={panelId} role="tabpanel" aria-labelledby={tabId(filter)} className="mt-6 grid grid-cols-2 gap-2 sm:gap-3 lg:grid-cols-4">
          {shown.map((s, i) => (
            <li key={keyOf(s)} className={cn("min-w-0", big && i === 0 && "col-span-2 lg:row-span-2")}>
              <button
                type="button"
                onClick={() => setOpen(i)}
                className={cn(
                  "group relative block aspect-[4/3] w-full overflow-hidden rounded-lg bg-mist",
                  big && i === 0 && "lg:aspect-auto lg:h-full",
                )}
              >
                <Image
                  src={s.src}
                  alt={s.alt}
                  fill
                  sizes={big && i === 0 ? "(min-width: 1024px) 640px, 100vw" : "(min-width: 1024px) 320px, 50vw"}
                  className="object-cover transition-transform duration-700 ease-(--ease-out) group-hover:scale-[1.03]"
                />
                {s.impression ? <ImpressionChip /> : null}
              </button>
            </li>
          ))}
        </ul>
      </Container>

      <Dialog open={current !== null} onOpenChange={(o) => !o && setOpen(null)}>
        <DialogContent
          showCloseButton={false}
          onKeyDown={onKey}
          className="on-navy flex h-[92dvh] w-[96vw] max-w-[1280px] flex-col gap-0 overflow-hidden rounded-lg bg-navy-deep p-0 text-white ring-0 sm:max-w-[1280px]"
        >
          {current ? (
            <>
              <div className="relative min-h-0 flex-1">
                <Image key={keyOf(current)} src={current.src} alt={current.alt} fill sizes="96vw" className="animate-in object-contain duration-300 fade-in" />
                {current.impression ? <ImpressionChip /> : null}
                <DialogClose asChild>
                  <Button variant="light" size="icon" aria-label="Close" className="absolute top-3 right-3">
                    <X />
                  </Button>
                </DialogClose>
              </div>
              <div className="flex items-center gap-4 border-t border-white/14 px-4 py-3 sm:px-5">
                <p className="text-ui font-medium text-white tabular-nums">
                  {pad((open ?? 0) + 1)} / {pad(shown.length)}
                </p>
                <DialogTitle className="min-w-0 flex-1 truncate text-small font-normal text-on-navy-2">{current.caption}</DialogTitle>
                <DialogDescription className="sr-only">Use the left and right arrow keys to move between pictures.</DialogDescription>
                <Button variant="outline-light" size="icon" aria-label="Previous picture" onClick={() => go(-1)}>
                  <ChevronLeft />
                </Button>
                <Button variant="outline-light" size="icon" aria-label="Next picture" onClick={() => go(1)}>
                  <ChevronRight />
                </Button>
              </div>
            </>
          ) : null}
        </DialogContent>
      </Dialog>
    </Section>
  );
}
