"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import Image from "next/image";
import { useRef, useState, useSyncExternalStore } from "react";

import { Choreo } from "@/components/motion/choreo";
import { DESKTOP, gsap, MOTION_OK, PHONE, useGSAP } from "@/components/motion/gsap";
import { Aurora } from "@/components/site/aurora";
import { Container } from "@/components/site/container";
import { ImpressionChip } from "@/components/site/plate";
import { SectionChip } from "@/components/site/typography";
import { Button } from "@/components/ui/button";
import { LEGACY } from "@/lib/home";
import { cn } from "@/lib/utils";

const subscribeWide = (cb: () => void) => {
  const mq = window.matchMedia(DESKTOP);
  mq.addEventListener("change", cb);
  return () => mq.removeEventListener("change", cb);
};
const pad = (n: number) => String(n).padStart(2, "0");

/**
 * The Projects, as on the live home: "A Legacy Built on Trust and Planning", its line, and the club house pictures,
 * each covering its frame. The first is a wide panorama that pans from its URBAN EDEN CLUB HOUSE lettering at the left
 * to the far end of the building.
 * Desktop: a 240vh runway under a sticky screen; the heading row rises in at the top and the frame fills the rest. The
 * panorama settles from a slight zoom as the screen arrives and pans through the first part of the runway; then the
 * second picture wipes up over it (settling from its own zoom) while the first swells and darkens, and the 01 / 02
 * counter (a dark chip on the picture, the current number in teal) rolls over. Phones: the pictures in a 4:3 (16:9 from sm) swipe strip that snaps,
 * with a counter and previous / next buttons (or ← →); the panorama pans as the strip crosses the screen.
 * Reduced motion: still, the panorama framed on its lettering and the left of the building; on desktop no runway, the
 * two pictures one above the other.
 */
export function Legacy() {
  const runway = useRef<HTMLDivElement>(null);
  const strip = useRef<HTMLDivElement>(null);
  const [i, setI] = useState(0);
  const n = LEGACY.slides.length;
  // Phones are the only place the frame behaves as a carousel; server and hydration render the phone markup.
  const carousel = !useSyncExternalStore(subscribeWide, () => window.matchMedia(DESKTOP).matches, () => false);

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

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add(`${MOTION_OK} and ${DESKTOP}`, () => {
        const root = runway.current;
        if (!root) return;
        const slides = gsap.utils.toArray<HTMLElement>("[data-slide]", root);
        const media = slides.map((s) => s.querySelector("[data-media]"));
        const dim = slides.map((s) => s.querySelector("[data-dim]"));
        const digits = root.querySelector("[data-digits]");

        // The screen arrives: the first picture settles.
        gsap.fromTo(media[0], { scale: 1.06 }, { scale: 1, ease: "none", scrollTrigger: { trigger: root, start: "top bottom", end: "top top", scrub: 0.8 } });

        // Pan the panorama from its lettering to the far end, wipe each next picture up over the last, hold.
        const tl = gsap.timeline({ defaults: { ease: "none" }, scrollTrigger: { trigger: root, start: "top top", end: "bottom bottom", scrub: 0.8 } });
        tl.fromTo(root.querySelector("[data-slide] img"), { objectPosition: "0% 50%" }, { objectPosition: "100% 50%", duration: 1 }, 0);
        for (let k = 1; k < slides.length; k++) {
          const at = k;
          tl.fromTo(slides[k], { clipPath: "inset(100% 0% 0% 0%)" }, { clipPath: "inset(0% 0% 0% 0%)", duration: 0.65 }, at)
            .fromTo(media[k], { scale: 1.12 }, { scale: 1, duration: 0.65 }, at)
            .fromTo(media[k - 1], { scale: 1 }, { scale: 1.06, duration: 0.65, immediateRender: false }, at)
            .to(dim[k - 1], { opacity: 0.5, duration: 0.65 }, at)
            .to(digits, { yPercent: (-100 * k) / slides.length, duration: 0.15 }, at + 0.3);
        }
        tl.to({}, { duration: 0.3 });
      });

      // Phones: the panorama pans while the strip crosses the screen.
      mm.add(`${MOTION_OK} and ${PHONE}`, () => {
        const el = strip.current;
        if (!el) return;
        gsap.fromTo(
          el.querySelector("[data-slide] img"),
          { objectPosition: "0% 50%" },
          { objectPosition: "100% 50%", ease: "none", scrollTrigger: { trigger: el, start: "top bottom", end: "bottom top", scrub: true } },
        );
      });
    },
    { scope: runway },
  );

  return (
    <Choreo as="section" aria-labelledby="legacy-title" className="bg-white">
      <div ref={runway} className="py-24 lg:h-[240vh] lg:py-0 motion-reduce:lg:h-auto motion-reduce:lg:py-36">
        <div className="relative isolate lg:sticky lg:top-0 lg:flex lg:h-svh lg:flex-col lg:pt-26 lg:pb-8 motion-reduce:lg:static motion-reduce:lg:h-auto motion-reduce:lg:pt-0 motion-reduce:lg:pb-0">
          {/* In the stage itself, so the light stays put while the stage holds. */}
          <Aurora scene="c" className="max-lg:-inset-y-24" />
          <Container className="lg:flex lg:min-h-0 lg:flex-1 lg:flex-col">
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

            <div
              ref={strip}
              onScroll={track}
              role={carousel ? "region" : undefined}
              aria-roledescription={carousel ? "carousel" : undefined}
              aria-label={carousel ? LEGACY.title : undefined}
              tabIndex={carousel ? 0 : undefined}
              onKeyDown={(e) => {
                if (!carousel || (e.key !== "ArrowRight" && e.key !== "ArrowLeft")) return;
                e.preventDefault();
                go(e.key === "ArrowRight" ? 1 : -1);
              }}
              className={cn(
                // Phones: a swipe strip that snaps a picture at a time.
                "relative mt-10 flex snap-x snap-mandatory gap-3 overflow-x-auto overscroll-x-contain rounded-2xl [scrollbar-width:none] motion-safe:scroll-smooth [&::-webkit-scrollbar]:hidden",
                // Desktop: one frame filling the rest of the screen, the pictures stacked inside it.
                "lg:mt-10 lg:block lg:min-h-0 lg:flex-1 lg:snap-none lg:overflow-hidden",
                // Reduced motion on desktop: the pictures one above the other.
                "motion-reduce:lg:grid motion-reduce:lg:flex-none motion-reduce:lg:gap-6 motion-reduce:lg:overflow-visible motion-reduce:lg:rounded-none",
              )}
            >
              {LEGACY.slides.map((s, k) => (
                <div
                  key={s.src}
                  data-slide
                  className={cn(
                    "relative aspect-[4/3] w-full shrink-0 snap-start overflow-hidden rounded-2xl bg-mist-2 sm:aspect-[16/9]",
                    "lg:absolute lg:inset-0 lg:aspect-auto lg:rounded-none",
                    "motion-reduce:lg:relative motion-reduce:lg:aspect-[1280/585] motion-reduce:lg:rounded-2xl",
                    // Later pictures wait below their wipe until the script takes over.
                    k > 0 && "motion-safe:lg:[clip-path:inset(100%_0_0_0)]",
                  )}
                >
                  <div data-media className="absolute inset-0">
                    {/* Covering a frame, the ~3.7:1 panorama renders about 3.7 times the frame's height wide. */}
                    <Image
                      src={s.src}
                      alt={s.alt}
                      fill
                      sizes={k === 0 ? "(min-width: 64rem) 300vh, 280vw" : "(min-width: 80rem) 1280px, (min-width: 64rem) 100vw, 165vw"}
                      className={cn("object-cover", k === 0 ? "object-[0%_50%] motion-reduce:object-[20%_50%]" : "object-[50%_60%]")}
                    />
                  </div>
                  <span data-dim aria-hidden className="pointer-events-none absolute inset-0 bg-navy-deep opacity-0" />
                  <ImpressionChip className="lg:top-5 lg:bottom-auto! lg:left-5!" />
                </div>
              ))}

              {/* The desktop frame's counter, a dark chip on the picture; it rolls as each picture wipes in. */}
              <div
                aria-hidden
                className="pointer-events-none absolute bottom-6 left-6 z-10 hidden h-10 items-center gap-1.5 rounded-md bg-navy-deep/80 px-3.5 text-ui font-medium text-white tabular-nums backdrop-blur-md lg:flex motion-reduce:lg:hidden"
              >
                <span className="h-[1lh] overflow-hidden text-teal">
                  <span data-digits className="flex flex-col">
                    {LEGACY.slides.map((s, k) => (
                      <span key={s.src}>{pad(k + 1)}</span>
                    ))}
                  </span>
                </span>
                <span className="text-white/60">/ {pad(n)}</span>
              </div>
            </div>

            <div className="mt-6 flex items-center justify-between lg:hidden">
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
        </div>
      </div>
    </Choreo>
  );
}
