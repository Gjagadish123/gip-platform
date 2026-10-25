"use client";

import { ChevronLeft, ChevronRight, Pause, Play } from "lucide-react";
import { useRef, useState, useSyncExternalStore } from "react";

import { Choreo } from "@/components/motion/choreo";
import { EASE, gsap, MOTION_OK, SplitText, useGSAP } from "@/components/motion/gsap";
import { Container } from "@/components/site/container";
import { SectionChip } from "@/components/site/typography";
import { Button } from "@/components/ui/button";
import { TESTIMONIALS } from "@/lib/home";
import { cn } from "@/lib/utils";

import { useOnScreen, usePrefersReducedMotion } from "./hooks";

const ITEMS = TESTIMONIALS.items;
const N = ITEMS.length;
const pad = (n: number) => String(n).padStart(2, "0");

const subscribeVisible = (cb: () => void) => {
  document.addEventListener("visibilitychange", cb);
  return () => document.removeEventListener("visibilitychange", cb);
};

/**
 * Client Feedbacks, as on the live home, as a quote stage on a solid teal band (all text navy for contrast). Desktop:
 * the heading, a rolling "01 / 07" counter, previous / next, a pause toggle and an 8 s progress hairline filling navy
 * hold the left four columns; the right eight hold all seven quotes stacked in one grid cell as slides labelled "3 of 7"
 * (the inactive ones transparent and hidden from assistive tech, still text), each set between navy-deep quote marks and
 * signed with a short navy rule and the name pinned to the foot of the cell so names never jump. On a change the new
 * quote's words rise out of their masks while the old one fades. Autoplay advances when
 * the progress hairline fills, only while motion is allowed, the section is on screen, the tab is visible, nothing in
 * it is hovered or focused and the visitor has not paused it. The stage takes the arrow keys; changes the visitor makes
 * are announced politely. Phones: the same, stacked, the quote one step smaller.
 * Reduced motion: no autoplay, no progress line or pause toggle, instant swaps.
 */
export function Testimonials() {
  const box = useRef<HTMLDivElement>(null);
  const stage = useRef<HTMLDivElement>(null);
  const moved = useRef(false);
  const [active, setActive] = useState(0);
  const [told, setTold] = useState(false);
  const [paused, setPaused] = useState(false);
  const [hover, setHover] = useState(false);
  const [focus, setFocus] = useState(false);
  const reduced = usePrefersReducedMotion();
  const onScreen = useOnScreen(box, 0.35);
  const visible = useSyncExternalStore(subscribeVisible, () => document.visibilityState === "visible", () => false);
  const running = !reduced && onScreen && visible && !hover && !focus && !paused;

  const go = (i: number, byVisitor = true) => {
    moved.current = true;
    setActive((i + N) % N);
    setTold(byVisitor);
  };

  // The new quote's words rise out of masks; the previous split is reverted with the context on the next change.
  useGSAP(
    () => {
      if (!moved.current) return;
      const mm = gsap.matchMedia();
      mm.add(MOTION_OK, () => {
        const fig = stage.current?.children[active];
        const quote = fig?.querySelector("blockquote p");
        if (!fig || !quote) return;
        // The quote marks are ignored so SplitText folds them into the first and last words: no orphaned mark.
        const split = SplitText.create(quote, { type: "words", mask: "words", aria: "none", ignore: quote.querySelectorAll("span") });
        gsap.from(split.words, { yPercent: 110, duration: 1, ease: EASE, stagger: 0.014 });
        gsap.from(fig.querySelector("figcaption"), { y: 16, opacity: 0, duration: 1, ease: EASE, delay: 0.25 });
        return () => split.revert();
      });
    },
    { dependencies: [active], scope: stage, revertOnUpdate: true },
  );

  return (
    <Choreo as="section" aria-labelledby="testimonials-title" className="bg-teal py-28 lg:py-40">
      <Container>
        <div
          ref={box}
          onPointerEnter={() => setHover(true)}
          onPointerLeave={() => setHover(false)}
          onFocus={() => setFocus(true)}
          onBlur={(e) => {
            if (!e.currentTarget.contains(e.relatedTarget)) setFocus(false);
          }}
          className="grid gap-14 lg:grid-cols-12 lg:gap-x-14"
        >
          <div className="lg:col-span-4">
            <div data-anim="fade-up">
              <SectionChip>{TESTIMONIALS.label}</SectionChip>
            </div>
            <h2 id="testimonials-title" data-anim="chars" className="mt-7 text-title">
              {TESTIMONIALS.title}
            </h2>

            <div data-anim="fade-up" data-delay="0.2" className="mt-10 lg:mt-14">
              <div className="flex flex-wrap items-center gap-x-6 gap-y-4">
                <p aria-hidden className="flex items-baseline gap-1.5 text-ui font-medium text-navy tabular-nums">
                  <span className="inline-block h-[1.2em] overflow-hidden leading-[1.2em] text-navy-deep">
                    <span className="flex flex-col transition-transform duration-700 ease-(--ease-out)" style={{ transform: `translateY(${-active * 1.2}em)` }}>
                      {ITEMS.map((t, i) => (
                        <span key={t.name}>{pad(i + 1)}</span>
                      ))}
                    </span>
                  </span>
                  <span className="text-navy">/ {pad(N)}</span>
                </p>
                <div className="flex gap-2">
                  <Button variant="secondary" size="icon" aria-label="Previous feedback" onClick={() => go(active - 1)}>
                    <ChevronLeft />
                  </Button>
                  <Button variant="secondary" size="icon" aria-label="Next feedback" onClick={() => go(active + 1)}>
                    <ChevronRight />
                  </Button>
                  <Button
                    variant="secondary"
                    size="icon"
                    aria-label={paused ? "Play the client feedback" : "Pause the client feedback"}
                    onClick={() => setPaused(!paused)}
                    className="motion-reduce:hidden"
                  >
                    {paused ? <Play /> : <Pause />}
                  </Button>
                </div>
              </div>
              {/* Autoplay is this line filling: it pauses with the line and advances when it ends. */}
              <div aria-hidden className="relative mt-6 h-px max-w-80 overflow-hidden bg-navy-deep/15 motion-reduce:hidden">
                <span
                  key={active}
                  onAnimationEnd={() => {
                    if (running) go(active + 1, false);
                  }}
                  className="absolute inset-0 origin-left animate-[bar-fill_8s_linear_both] bg-navy-deep motion-reduce:animate-none"
                  style={{ animationPlayState: running ? "running" : "paused" }}
                />
              </div>
            </div>
          </div>

          <div data-anim="fade-up" data-delay="0.1" className="lg:col-span-8">
            <div
              ref={stage}
              role="region"
              aria-roledescription="carousel"
              aria-label={TESTIMONIALS.title}
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return;
                e.preventDefault();
                go(active + (e.key === "ArrowRight" ? 1 : -1));
              }}
              className="grid rounded-lg outline-offset-8 [grid-template-areas:'s']"
            >
              {ITEMS.map((t, i) => (
                <figure
                  key={t.name}
                  aria-hidden={i !== active || undefined}
                  aria-roledescription="slide"
                  aria-label={`${i + 1} of ${N}`}
                  className={cn(
                    "flex flex-col transition-opacity [grid-area:s]",
                    i === active ? "opacity-100 duration-200" : "pointer-events-none opacity-0 duration-500",
                  )}
                >
                  <blockquote className="text-h3 text-navy lg:text-h2">
                    <p>
                      <span className="text-navy-deep">&ldquo;</span>
                      {t.quote}
                      <span className="text-navy-deep">&rdquo;</span>
                    </p>
                  </blockquote>
                  <figcaption className="mt-auto flex items-center gap-4 pt-10">
                    <span aria-hidden className="h-px w-6 shrink-0 bg-navy-deep" />
                    <span className="text-ui font-semibold text-navy">{t.name}</span>
                  </figcaption>
                </figure>
              ))}
            </div>
            <p aria-live="polite" className="sr-only">
              {told ? `${ITEMS[active].quote} ${ITEMS[active].name}` : ""}
            </p>
          </div>
        </div>
      </Container>
    </Choreo>
  );
}
