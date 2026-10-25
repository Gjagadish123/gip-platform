"use client";

import { useRef } from "react";

import { DESKTOP, EASE, gsap, MOTION_OK, PHONE, useGSAP } from "@/components/motion/gsap";
import { Container } from "@/components/site/container";
import { HOME_STATS } from "@/lib/home";
import { cn } from "@/lib/utils";

// Every digit window looks at one strip: a blank (an unused leading window), 0–9, then 0 again so each roll runs forward.
const CELLS = ["", "0", "1", "2", "3", "4", "5", "6", "7", "8", "9", "0"];
const pct = (cell: number) => (-100 * cell) / CELLS.length;

/** The cell each window shows for `digits`, right-aligned; a 0 whose window has already turned rolls on to the end 0. */
const cellsFor = (digits: string, prev: number[]) =>
  [...digits.padStart(prev.length)].map((d, j) => (d === " " ? 0 : d === "0" && prev[j] > 1 ? 11 : Number(d) + 1));

// The stage odometer: as many windows as the longest record, opening on 00, then each record in turn (6000 keeps no comma).
const SLOTS = Math.max(...HOME_STATS.map((s) => String(s.value).length));
const OPEN = cellsFor("0".repeat(String(HOME_STATS[0].value).length), Array<number>(SLOTS).fill(0));
const STEPS = HOME_STATS.reduce<number[][]>((acc, s) => [...acc, cellsFor(String(s.value), acc.at(-1) ?? OPEN)], []);

/** Digit windows over rolling strips, then the suffix, smaller, raised and white. Decorative: the number is also sr-only text. */
function Odometer({ cells, suffix, className }: { cells: readonly number[]; suffix: string; className?: string }) {
  return (
    <span aria-hidden className={cn("flex items-start", className)}>
      {cells.map((cell, j) => (
        <span key={j} className="h-[0.8em] overflow-hidden">
          <span data-strip data-cell={cell} className="block" style={{ transform: `translateY(${pct(cell)}%)` }}>
            {CELLS.map((d, k) => (
              <span key={k} className="block h-[0.8em] leading-[0.8]">
                {d}
              </span>
            ))}
          </span>
        </span>
      ))}
      <span className="text-[0.42em] leading-none text-white">{suffix}</span>
    </span>
  );
}

/**
 * The record on a stage: the page's dark beat, grained navy-deep with the figures in teal. Desktop: a 420vh runway under
 * a faint 12-column grid holds a sticky full-screen stage that shows one record at a time. The number is set in
 * text-mega on an odometer (four digit windows over rolling strips, right-aligned against the seventh column line, the
 * "+" smaller, raised and white); it rolls up from 00 to 11
 * as the stage arrives, then on to 20, 600 and 6000 at each quarter of the scroll, units first. Beside it the record's
 * two-line label rises out of masks and its paragraph crossfades; an index along the bottom (01–04, teal) fills as the
 * page scrolls. All four records stay in one <ol> in DOM order; the odometer is decorative and the number is sr-only text.
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
        const strips = gsap.utils.toArray<HTMLElement>("[data-stage] [data-strip]", root);
        const lines = items.map((li) => li.querySelectorAll("[data-line]"));
        const ticks = gsap.utils.toArray<HTMLElement>("[data-tick]", root);
        const fills = gsap.utils.toArray<HTMLElement>("[data-fill]", root);

        // Everything waits off stage; the list items hand their visibility over to their lines and paragraphs.
        gsap.set(strips, { y: 0, yPercent: (j: number) => pct(OPEN[j]) });
        gsap.set(gsap.utils.toArray("[data-line]", root), { yPercent: 110 });
        gsap.set(paras, { opacity: 0, y: 32 });
        gsap.set(items, { opacity: 1 });

        // Timeline units are vh of scroll: 100 while the stage slides in, then 80 for each record.
        const tl = gsap.timeline({
          defaults: { ease: "none" },
          scrollTrigger: { trigger: root, start: "top bottom", end: "bottom bottom", scrub: 0.8 },
        });
        const roll = (i: number, at: number, duration: number) =>
          tl.to(strips, { yPercent: (j: number) => pct(STEPS[i][j]), duration, stagger: { each: 2, from: "end" } }, at);
        const show = (i: number, at: number) =>
          tl.to(lines[i], { yPercent: 0, duration: 20, stagger: 3 }, at).to(paras[i], { opacity: 1, y: 0, duration: 20 }, at + 6);
        const hide = (i: number, at: number) =>
          tl.to(lines[i], { yPercent: -110, duration: 14, stagger: 2 }, at).to(paras[i], { opacity: 0, y: -24, duration: 14 }, at);

        roll(0, 40, 48);
        show(0, 62);
        HOME_STATS.forEach((_, i) => {
          const at = 100 + 80 * i;
          tl.to(fills[i], { scaleX: 1, duration: 80 }, at);
          if (!i) return;
          roll(i, at - 20, 34);
          hide(i - 1, at - 20);
          show(i, at - 2);
          tl.to(ticks[i - 1], { opacity: 0.35, duration: 6 }, at - 3).to(ticks[i], { opacity: 1, duration: 6 }, at - 3);
        });
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
      className="on-navy grain relative overflow-x-clip bg-navy-deep py-24 lg:motion-safe:h-[420vh] lg:motion-safe:py-0 lg:motion-reduce:py-36"
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
          <div className="lg:motion-safe:my-auto lg:motion-safe:grid lg:motion-safe:grid-cols-12 lg:motion-safe:items-start">
            <div data-stage className="hidden text-mega text-teal lg:motion-safe:col-span-7 lg:motion-safe:flex lg:motion-safe:justify-end lg:motion-safe:pr-10">
              <Odometer cells={STEPS[0]} suffix={HOME_STATS[0].suffix} />
            </div>

            <ol className="lg:motion-safe:col-span-5 lg:motion-safe:col-start-8 lg:motion-safe:grid lg:motion-safe:pl-10">
              {HOME_STATS.map((s, i) => (
                <li
                  key={s.label.join(" ")}
                  data-item
                  className={cn(
                    "border-t border-line py-12 first:border-t-0 first:pt-0 last:pb-0",
                    "lg:motion-reduce:grid lg:motion-reduce:grid-cols-12 lg:motion-reduce:items-start lg:motion-reduce:py-16",
                    "lg:motion-safe:col-start-1 lg:motion-safe:row-start-1 lg:motion-safe:border-0 lg:motion-safe:p-0",
                    i > 0 && "lg:motion-safe:opacity-0",
                  )}
                >
                  <p className="text-mega text-teal lg:motion-safe:sr-only lg:motion-reduce:col-span-7 lg:motion-reduce:pr-10 lg:motion-reduce:text-stat">
                    <Odometer
                      cells={[...String(s.value)].map((d) => (d === "0" ? 11 : Number(d) + 1))}
                      suffix={s.suffix}
                      className="lg:motion-reduce:justify-end"
                    />
                    <span className="sr-only">{`${s.value}${s.suffix}`}</span>
                  </p>
                  <div className="mt-8 lg:mt-0 lg:motion-reduce:col-span-5 lg:motion-reduce:pl-10">
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
          </div>

          {/* The index: four teal ticks that fill in turn as the stage scrolls, the current numeral at full strength. */}
          <div aria-hidden className="hidden lg:motion-safe:grid lg:motion-safe:grid-cols-12">
            <div className="col-span-7 grid grid-cols-4 gap-5 pr-10">
              {HOME_STATS.map((s, i) => (
                <div key={s.label.join(" ")} className="flex items-center gap-3">
                  <span data-tick className={cn("text-label text-teal tabular-nums", i > 0 && "opacity-35")}>
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span className="relative h-px flex-1 bg-line">
                    <span data-fill className="absolute inset-0 origin-left bg-teal" style={{ transform: "scaleX(0)" }} />
                  </span>
                </div>
              ))}
            </div>
          </div>
        </Container>
      </div>
    </section>
  );
}
