"use client";

import Image from "next/image";
import { Fragment, useRef } from "react";

import { projectsHero } from "@/assets/images";
import { DESKTOP, gsap, MOTION_OK, useGSAP } from "@/components/motion/gsap";
import { Magnetic } from "@/components/motion/magnetic";
import { Container } from "@/components/site/container";
import { EnquireButton } from "@/components/site/enquire-button";
import { ImpressionChip } from "@/components/site/plate";
import { Arrow, Button } from "@/components/ui/button";
import { formatNumber } from "@/lib/format";
import { HOME_STATS } from "@/lib/home";
import { cn } from "@/lib/utils";

const HEADLINE = ["Plotted", "layouts", "across", "Hyderabad’s", "growth", "corridors."];

// Scrims in navy-deep, gradients over the picture only from the foot and the left, so the top and right of the picture
// stay bright. Stops are in rem from the edges the copy is anchored to (the foot, the container's left edge), so the
// ground under the text is the same on a short laptop and a tall monitor. Kept as light as the copy allows (the client
// found the old hero too dark).
const N = (a: number) => `rgb(1 34 63 / ${a})`;
const EDGE = "max(2rem, 50% - 40rem)"; // the container's content edge
const SHADE_TOP = `linear-gradient(to bottom, ${N(0.7)}, transparent 11rem)`; // under the transparent header only
const SHADE_FOOT = `linear-gradient(to top, ${N(0.9)}, ${N(0.64)} 14rem, ${N(0.25)} 30rem, transparent 44rem)`;
const SHADE_LEFT = `linear-gradient(to right, ${N(0.7)}, ${N(0.55)} calc(${EDGE} + 22rem), ${N(0.22)} calc(${EDGE} + 40rem), transparent calc(${EDGE} + 58rem))`;
// Phones: the copy spans the width and is anchored to the foot, so one gradient from the foot in rem (the same ground
// under the copy on a short or tall phone), solid at the picture's end (no seam into the navy the record sits on).
const SHADE_PHONE = `linear-gradient(to top, ${N(1)}, ${N(0.84)} 10rem, ${N(0.68)} 20rem, ${N(0.42)} 31.25rem, transparent 40rem)`;

/**
 * Projects hero, a full-screen picture (2026-10-27, the client asked for a generated still in place of the film): an
 * aerial render of a plotted layout at golden hour (artist's impression) fills the first screen and settles from a
 * push-in; the H1 sits large in the lower-left third, its words rising out of masks, then the teal rule, the lede with
 * the live counts and the two actions; along the foot, over the soft bottom gradient, the record bar (the live counts,
 * then 600+ acres and 6,000+ customers) on a hairline that draws in, with the impression note and a scroll cue on the
 * right. Load choreography is CSS (runs before hydration).
 * Scroll (desktop, motion allowed): a short 140svh runway under a sticky screen: the copy lifts and fades (and leaves
 * the tab order), the left shade eases off so the picture brightens, the picture pushes in; the record and the note
 * stay, then the cards follow. Phones: no runway; the picture (framed on the entrance arch) is the first screen and the
 * record continues on navy below it.
 */
export function ProjectsHero({ selling, delivered }: { selling: number; delivered: number }) {
  const ref = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const root = ref.current;
      if (!root) return;
      const q = gsap.utils.selector(root);
      gsap.matchMedia().add(`${DESKTOP} and ${MOTION_OK}`, () => {
        gsap
          .timeline({
            defaults: { ease: "none" },
            scrollTrigger: { trigger: root, start: "top top", end: "bottom bottom", scrub: 0.6 },
          })
          .to(q("[data-copy]"), { y: -96, autoAlpha: 0, duration: 0.7 }, 0)
          .to(q("[data-cue]"), { autoAlpha: 0, duration: 0.3 }, 0)
          .to(q("[data-veil]"), { opacity: 0.3, duration: 1 }, 0)
          .to(q("[data-push]"), { scale: 1.08, duration: 1 }, 0);
      });
    },
    { scope: ref },
  );

  const stat = (key: string) => HOME_STATS.find((s) => s.label[0] === key)!;
  const acres = stat("Acres");
  const customers = stat("Happy");
  const record = [
    { value: formatNumber(selling), label: [selling === 1 ? "Layout" : "Layouts", "selling now"], live: true },
    { value: formatNumber(delivered), label: [delivered === 1 ? "Layout" : "Layouts", "delivered"] },
    { value: `${formatNumber(acres.value)}${acres.suffix}`, label: acres.label },
    { value: `${formatNumber(customers.value)}${customers.suffix}`, label: customers.label },
  ];

  return (
    <section ref={ref} id="hero" aria-labelledby="projects-title" className="relative bg-navy-deep lg:h-[140svh] lg:motion-reduce:h-svh">
      <div className="on-navy grain relative flex min-h-svh flex-col overflow-hidden bg-navy-deep lg:sticky lg:top-0 lg:h-svh lg:min-h-[40rem]">
        {/* The picture, anchored right so the entrance arch stays whole on 16:10 screens; phones frame the arch. */}
        <div data-push className="absolute inset-x-0 top-0 h-svh overflow-hidden lg:inset-0 lg:h-auto">
          <div className="absolute inset-0 motion-safe:animate-[film-settle_2.8s_var(--ease-out)_backwards]">
            <Image
              src={projectsHero}
              alt=""
              fill
              priority
              sizes="100vw"
              placeholder="blur"
              className="object-cover object-[86%_center] lg:object-[90%_center]"
            />
          </div>
        </div>
        <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-svh lg:inset-0 lg:h-auto">
          <span className="absolute inset-0" style={{ backgroundImage: SHADE_TOP }} />
          <span className="absolute inset-0 lg:hidden" style={{ backgroundImage: SHADE_PHONE }} />
          <span className="absolute inset-0 hidden lg:block" style={{ backgroundImage: SHADE_FOOT }} />
          <span data-veil className="absolute inset-0 hidden lg:block" style={{ backgroundImage: SHADE_LEFT }} />
        </div>

        {/* Phones: the impression note under the header, clear of the copy. */}
        <div className="absolute inset-x-5 top-20 z-10 flex items-center motion-safe:animate-[fade-in_1s_ease_1.2s_both] sm:inset-x-8 lg:hidden">
          <ImpressionChip className="static!" />
        </div>

        <Container className="relative z-10 flex flex-1 flex-col justify-end pb-14 lg:pt-28 lg:pb-[clamp(1.25rem,3.5svh,2.25rem)]">
          {/* Phones: the copy closes the first screen just above the action bar; the record follows below the fold. */}
          <div className="grid max-lg:min-h-svh max-lg:content-end max-lg:pt-30 max-lg:pb-[calc(60px+env(safe-area-inset-bottom)+1.75rem)] lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end lg:gap-x-10">
            <div data-copy>
              <h1 id="projects-title" aria-label={HEADLINE.join(" ")} className="max-w-[10em] text-title text-white">
                {HEADLINE.map((w, i) => (
                  <Fragment key={w}>
                    {/* The space sits between the masks: inside an inline-block it would collapse. */}
                    {i ? " " : null}
                    <span aria-hidden className="-mb-[0.12em] inline-block overflow-hidden pb-[0.12em] align-bottom">
                      <span
                        className="inline-block motion-safe:animate-[word-rise_1.3s_var(--ease-out)_both]"
                        style={{ animationDelay: `${220 + i * 75}ms` }}
                      >
                        {w}
                      </span>
                    </span>
                  </Fragment>
                ))}
              </h1>
              <span
                aria-hidden
                className="mt-6 block h-0.5 w-14 origin-left bg-teal motion-safe:animate-[bar-fill_1.1s_var(--ease-out)_750ms_both] lg:mt-[clamp(1.5rem,3.5svh,2.25rem)]"
              />
              <div className="motion-safe:animate-[fade-rise_1.1s_var(--ease-out)_850ms_both]">
                <p className="mt-5 max-w-[32rem] text-lede text-white">
                  {formatNumber(selling)} {selling === 1 ? "layout" : "layouts"} selling now and {formatNumber(delivered)} delivered,
                  each with clear titles and an approved plan.
                </p>
                <div className="mt-7 grid gap-3 sm:flex sm:flex-wrap sm:items-center lg:mt-[clamp(1.5rem,3.5svh,2.25rem)]">
                  <Magnetic>
                    <EnquireButton variant="teal" size="lg" arrow className="max-sm:w-full">
                      Book a site visit
                    </EnquireButton>
                  </Magnetic>
                  <Button asChild variant="outline-light" size="lg" className="max-sm:w-full">
                    <a href="#current">
                      See current projects <Arrow />
                    </a>
                  </Button>
                </div>
              </div>
            </div>

            {/* Desktop: the note and the scroll cue at the copy's foot, on the right. The note stays through the scroll (the
                picture stays labelled); only the cue leaves. */}
            <div className="mb-1.5 hidden items-center gap-5 motion-safe:animate-[fade-in_1s_ease_1.3s_both] lg:flex">
              <span aria-hidden className="text-label text-on-navy-2">
                Artist&rsquo;s impression
              </span>
              <span data-cue aria-hidden className="flex items-center gap-3 border-l border-white/15 pl-5 text-label text-on-navy-2">
                <span className="relative h-8 w-px overflow-hidden bg-white/20">
                  <span className="absolute inset-0 bg-teal motion-safe:animate-[cue-run_2.4s_var(--ease-in-out)_infinite]" />
                </span>
                Scroll
              </span>
            </div>
          </div>

          {/* The record: a hairline that draws in, then the four figures, the live ones first. */}
          <div className="lg:mt-[clamp(1.75rem,5svh,3rem)]">
            <span aria-hidden className="block h-px origin-left bg-white/15 motion-safe:animate-[bar-fill_1.4s_var(--ease-out)_950ms_both]" />
            <dl className="grid grid-cols-2 gap-y-6 pt-6 lg:grid-cols-4">
              {record.map((r, i) => (
                <div
                  key={r.label[1]}
                  className={cn(
                    "flex flex-col gap-1.5 motion-safe:animate-[fade-rise_1s_var(--ease-out)_both] sm:flex-row sm:items-end sm:gap-3",
                    "max-lg:even:border-l max-lg:even:border-white/15 max-lg:even:pl-5",
                    i > 0 && "lg:border-l lg:border-white/15 lg:pl-7",
                  )}
                  style={{ animationDelay: `${1050 + i * 90}ms` }}
                >
                  {/* The live dot hangs in its own indent, so both label lines start on the same edge. */}
                  <dt className={cn("relative order-2 text-small text-on-navy-2 sm:pb-px", r.live && "pl-3.5")}>
                    {r.live ? <span aria-hidden className="absolute top-2 left-0 size-1.5 rounded-full bg-[#3ccf7e]" /> : null}
                    <span className="sm:block">{r.label[0]}</span>{" "}
                    <span className="sm:block">{r.label[1]}</span>
                  </dt>
                  <dd className="order-1 text-h2 leading-none text-white tabular-nums">{r.value}</dd>
                </div>
              ))}
            </dl>
          </div>
        </Container>
      </div>
    </section>
  );
}
