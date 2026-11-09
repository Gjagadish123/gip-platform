"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import Image from "next/image";
import { useRef, useState } from "react";

import { Choreo } from "@/components/motion/choreo";
import { Container } from "@/components/site/container";
import { ImpressionChip } from "@/components/site/plate";
import { SectionChip } from "@/components/site/typography";
import { Button } from "@/components/ui/button";
import { LEGACY } from "@/lib/home";

const pad = (n: number) => String(n).padStart(2, "0");

/**
 * The Projects, as on the live home: "A Legacy Built on Trust and Planning", its line, and the club house pictures in a
 * slider, each shown whole at its own proportions as the live site shows them (the first is a ~3.7:1 panorama with its
 * URBAN EDEN CLUB HOUSE lettering). A swipe strip that snaps a picture at a time; the frame takes the height of the
 * picture on show; a counter and previous / next buttons (or ← →) below.
 */
export function Legacy() {
  const strip = useRef<HTMLDivElement>(null);
  const [i, setI] = useState(0);
  const n = LEGACY.slides.length;

  const go = (d: number) => {
    const el = strip.current;
    const slide = el?.querySelectorAll<HTMLElement>("[data-slide]")[(i + d + n) % n];
    if (el && slide) el.scrollTo({ left: slide.offsetLeft });
  };
  const track = () => {
    const el = strip.current;
    const max = el ? el.scrollWidth - el.clientWidth : 0;
    if (el && max > 0) setI(Math.round((el.scrollLeft / max) * (n - 1)));
  };

  return (
    <Choreo as="section" aria-labelledby="legacy-title" className="bg-white py-24 lg:py-36">
      <Container>
        <div className="grid gap-6 lg:grid-cols-12 lg:items-end lg:gap-14">
          <div className="lg:col-span-8">
            <div data-anim="fade-up">
              <SectionChip>{LEGACY.label}</SectionChip>
            </div>
            <h2 id="legacy-title" data-anim="chars" className="mt-6 text-title">
              {LEGACY.title}
            </h2>
          </div>
          <p data-anim="lines" className="max-w-[40ch] text-lede text-text lg:col-span-4 lg:justify-self-end lg:pb-2">
            {LEGACY.text}
          </p>
        </div>

        <div data-anim="fade-up">
          <div
            ref={strip}
            onScroll={track}
            role="region"
            aria-roledescription="carousel"
            aria-label={LEGACY.title}
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
              e.preventDefault();
              go(e.key === "ArrowRight" ? 1 : -1);
            }}
            style={{ aspectRatio: `${LEGACY.slides[i].w} / ${LEGACY.slides[i].h}` }}
            className="mt-10 flex snap-x snap-mandatory items-start gap-3 overflow-x-auto overflow-y-hidden overscroll-x-contain rounded-2xl [scrollbar-width:none] motion-safe:scroll-smooth motion-safe:transition-[aspect-ratio] motion-safe:duration-500 lg:mt-14 [&::-webkit-scrollbar]:hidden"
          >
            {LEGACY.slides.map((s) => (
              <div
                key={s.src}
                data-slide
                style={{ aspectRatio: `${s.w} / ${s.h}` }}
                className="relative w-full shrink-0 snap-start overflow-hidden rounded-2xl bg-mist-2"
              >
                <Image src={s.src} alt={s.alt} fill sizes="(min-width: 84rem) 1280px, 100vw" className="object-cover" />
                <ImpressionChip />
              </div>
            ))}
          </div>
        </div>

        <div className="mt-6 flex items-center justify-between">
          <p aria-live="polite" className="text-small font-medium text-navy tabular-nums">
            <span className="text-teal-deep">{pad(i + 1)}</span> <span className="text-muted">/ {pad(n)}</span>
          </p>
          <div className="flex gap-2">
            <Button variant="secondary" size="icon" aria-label="Previous picture" onClick={() => go(-1)}>
              <ChevronLeft />
            </Button>
            <Button variant="secondary" size="icon" aria-label="Next picture" onClick={() => go(1)}>
              <ChevronRight />
            </Button>
          </div>
        </div>
      </Container>
    </Choreo>
  );
}
