"use client";

import { useRef } from "react";

import { DESKTOP, EASE, gsap, MOTION_OK, PHONE, useGSAP } from "@/components/motion/gsap";
import { Container } from "@/components/site/container";
import { HOME_STATS } from "@/lib/home";
import { cn } from "@/lib/utils";

// Every digit window looks at one strip: a blank (the window before its roll), 0–9, then 0 again so a 0 rolls forward.
const CELLS = ["", "0", "1", "2", "3", "4", "5", "6", "7", "8", "9", "0"];
const pct = (cell: number) => (-100 * cell) / CELLS.length;

// Desktop shows the records two at a time. Timeline units are vh of scroll: 100 while the stage slides in, then PAIR for
// each pair, so the section is 100 + PAIR × pairs tall (h-[220vh] below: keep the two in step).
const PAIR = 60;
const PAIRS = Math.ceil(HOME_STATS.length / 2);

/** Digit windows over rolling strips, then the suffix, smaller, raised and white. Decorative: the number is also sr-only text. */
function Odometer({ value, suffix, className }: { value: number; suffix: string; className?: string }) {
  return (
    <span aria-hidden data-num className={cn("flex items-start", className)}>
      {[...String(value)].map((d, j) => {
        const cell = d === "0" ? 11 : Number(d) + 1;
        return (
          <span key={j} className="h-[0.8em] shrink-0 overflow-hidden">
            <span data-strip data-cell={cell} className="block" style={{ transform: `translateY(${pct(cell)}%)` }}>
              {CELLS.map((c, k) => (
                <span key={k} className="block h-[0.8em] leading-[0.8]">
                  {c}
                </span>
              ))}
            </span>
          </span>
        );
      })}
      <span data-suffix className="text-[0.42em] leading-none text-white">
        {suffix}
      </span>
    </span>
  );
}

/**
 * The record on a stage: the page's dark beat, grained navy-deep with the figures in teal. Desktop: a 220vh runway under
 * a faint 12-column grid holds a sticky full-screen stage that shows the records two at a time, one each side of the
 * middle column line. Each number is set in text-mega on an odometer (digit windows over rolling strips, the "+"
 * smaller, raised and white) that rolls up digit by digit, units first, as its pair arrives; under it the two-line label
 * rises out of masks and the paragraph fades in. Half way down the runway the pair lifts away and the next one rolls in.
 * An index along the bottom (01–04, teal) fills as the page scrolls. All four records stay in one <ol> in DOM order.
 * Phones: the four records down the page on hairlines, each number rolling up from 0 once as it arrives. Reduced
 * motion: no runway and no rolls, the same list with final numbers (text-stat rows against the column line on desktop).
 */
export function Stats() {
  const ref = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const root = ref.current;
      if (!root) return;
      const items = gsap.utils.toArray<HTMLElement>("[data-item]", root);
      const paras = gsap.utils.toArray<HTMLElement>("[data-para]", root);
      const mm = gsap.matchMedia();

      mm.add(`${MOTION_OK} and ${DESKTOP}`, () => {
        const nums = items.map((li) => li.querySelector("[data-num]"));
        const strips = items.map((li) => li.querySelectorAll<HTMLElement>("[data-strip]"));
        const suffixes = gsap.utils.toArray<HTMLElement>("[data-suffix]", root);
        const lines = items.map((li) => li.querySelectorAll("[data-line]"));
        const ticks = gsap.utils.toArray<HTMLElement>("[data-tick]", root);
        const fills = gsap.utils.toArray<HTMLElement>("[data-fill]", root);

        // Everything waits off stage: blank windows, lines under their masks; the items hand their visibility over.
        gsap.set(gsap.utils.toArray("[data-strip]", root), { y: 0, yPercent: pct(0) });
        gsap.set(suffixes, { opacity: 0 });
        gsap.set(gsap.utils.toArray("[data-line]", root), { yPercent: 110 });
        gsap.set(paras, { opacity: 0, y: 32 });
        gsap.set(items, { opacity: 1 });

        const tl = gsap.timeline({
          defaults: { ease: "none" },
          scrollTrigger: { trigger: root, start: "top bottom", end: "bottom bottom", scrub: 0.5 },
        });
        const show = (i: number, at: number) =>
          tl
            .to(strips[i], { yPercent: (_: number, el: HTMLElement) => pct(Number(el.dataset.cell)), duration: 28, stagger: { each: 2, from: "end" } }, at)
            .to(suffixes[i], { opacity: 1, duration: 8 }, at + 20)
            .to(lines[i], { yPercent: 0, duration: 16, stagger: 3 }, at + 6)
            .to(paras[i], { opacity: 1, y: 0, duration: 16 }, at + 10);
        const hide = (i: number, at: number) =>
          tl
            .to(nums[i], { yPercent: -110, duration: 12 }, at)
            .to(lines[i], { yPercent: -110, duration: 12, stagger: 2 }, at)
            .to(paras[i], { opacity: 0, y: -24, duration: 12 }, at);

        for (let p = 0; p < PAIRS; p++) {
          const at = 100 + PAIR * p;
          for (const k of [0, 1]) {
            const i = 2 * p + k;
            if (p) {
              hide(i - 2, at - 18 + 2 * k);
              show(i, at - 6 + 4 * k);
            } else show(i, 40 + 4 * k);
            tl.to(fills[i], { scaleX: 1, duration: PAIR / 2 }, at + (PAIR / 2) * k);
            if (p) tl.to(ticks[i - 2], { opacity: 0.35, duration: 6 }, at - 6).to(ticks[i], { opacity: 1, duration: 6 }, at - 6);
          }
        }
      });

      mm.add(`${MOTION_OK} and ${PHONE}`, () => {
        items.forEach((li, i) => {
          gsap
            .timeline({ defaults: { ease: EASE }, scrollTrigger: { trigger: li, start: "top 85%", once: true } })
            .fromTo(
              li.querySelectorAll("[data-strip]"),
              { y: 0, yPercent: pct(1) },
              { yPercent: (_: number, el: HTMLElement) => pct(Number(el.dataset.cell)), duration: 1.4, stagger: 0.08 },
            )
            .from(li.querySelectorAll("[data-line]"), { yPercent: 110, duration: 1.1, stagger: 0.08 }, 0.15)
            .from(paras[i], { y: 32, opacity: 0, duration: 1.1 }, 0.3);
        });
      });
    },
    { scope: ref },
  );

  return (
    <section
      ref={ref}
      aria-label="Our record in numbers"
      className="on-navy grain relative overflow-x-clip bg-navy-deep py-24 lg:motion-safe:h-[220vh] lg:motion-safe:py-0 lg:motion-reduce:py-36"
    >
      {/* The column grid, drawn as 12 hairlines across the container. */}
      <Container className="pointer-events-none absolute inset-0 hidden lg:block">
        <div aria-hidden className="grid h-full grid-cols-12 border-x border-white/[0.06]">
          {Array.from({ length: 11 }, (_, i) => (
            <span key={i} className="border-r border-white/[0.06]" />
          ))}
        </div>
      </Container>

      <div className="relative lg:motion-safe:sticky lg:motion-safe:top-0 lg:motion-safe:h-svh">
        <Container className="lg:motion-safe:flex lg:motion-safe:h-full lg:motion-safe:flex-col lg:motion-safe:pt-28 lg:motion-safe:pb-10">
          <ol className="lg:motion-safe:my-auto lg:motion-safe:grid lg:motion-safe:grid-cols-2">
            {HOME_STATS.map((s, i) => (
              <li
                key={s.label.join(" ")}
                data-item
                className={cn(
                  "border-t border-line py-12 first:border-t-0 first:pt-0 last:pb-0",
                  "lg:motion-reduce:grid lg:motion-reduce:grid-cols-12 lg:motion-reduce:items-start lg:motion-reduce:py-16",
                  "lg:motion-safe:row-start-1 lg:motion-safe:border-0 lg:motion-safe:px-10 lg:motion-safe:py-0",
                  i % 2 ? "lg:motion-safe:col-start-2" : "lg:motion-safe:col-start-1",
                  i > 1 && "lg:motion-safe:opacity-0",
                )}
              >
                <p className="text-mega text-teal lg:motion-safe:overflow-y-clip lg:motion-reduce:col-span-7 lg:motion-reduce:pr-10 lg:motion-reduce:text-stat">
                  <Odometer value={s.value} suffix={s.suffix} className="lg:motion-reduce:justify-end" />
                  <span className="sr-only">{`${s.value}${s.suffix}`}</span>
                </p>
                <div className="mt-8 lg:motion-safe:mt-10 lg:motion-reduce:col-span-5 lg:motion-reduce:mt-0 lg:motion-reduce:pl-10">
                  <p className="text-h2 text-navy">
                    {s.label.map((line, j) => (
                      <span key={j} className="-mb-[0.1em] block overflow-hidden pb-[0.1em]">
                        <span data-line className="block">
                          {line}
                        </span>
                      </span>
                    ))}
                  </p>
                  <p data-para className="mt-5 max-w-[44ch] text-lede text-text lg:mt-6">
                    {s.text}
                  </p>
                </div>
              </li>
            ))}
          </ol>

          {/* The index: four teal ticks that fill in turn as the stage scrolls, the pair on stage at full strength. */}
          <div aria-hidden className="hidden lg:motion-safe:grid lg:motion-safe:grid-cols-4 lg:motion-safe:gap-5 lg:motion-safe:px-10">
            {HOME_STATS.map((s, i) => (
              <div key={s.label.join(" ")} className="flex items-center gap-3">
                <span data-tick className={cn("text-label text-teal tabular-nums", i > 1 && "opacity-35")}>
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span className="relative h-px flex-1 bg-line">
                  <span data-fill className="absolute inset-0 origin-left bg-teal" style={{ transform: "scaleX(0)" }} />
                </span>
              </div>
            ))}
          </div>
        </Container>
      </div>
    </section>
  );
}
