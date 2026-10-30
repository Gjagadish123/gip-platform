import type { CSSProperties } from "react";

import { Choreo } from "@/components/motion/choreo";
import { Backdrop } from "@/components/site/backdrop";
import { Container } from "@/components/site/container";
import { LineArt } from "@/components/site/line-art";
import { SectionChip } from "@/components/site/typography";
import { PRINCIPLES_BLOCK } from "@/lib/home";
import { cn } from "@/lib/utils";

import { PrinciplesDeck } from "./principles-deck";

// The old site's line drawings, one per principle, in order.
const ART = ["transparency", "quality-driven-planning", "trust-reliability", "timely-responsible-execution"];

/**
 * Key Principles, as on the live home: "Built on Principle" (its letters rising in) over a drawn rule, then the four
 * principles as large cards, each with its number set big (faint teal-deep on the white cards), its title and line, and
 * its drawing in a well (teal-white mist on the white cards; on the fourth, GIP navy, the climax, a teal number and a faint
 * white well framed in teal with the drawing in white strokes). Desktop: the cards are sticky a step lower each (112 px
 * + 28 px a card), so each new one slides up over the last while the ones beneath shrink and dim into a deck, which
 * holds for a beat before the page moves on (PrinciplesDeck). Below desktop:
 * compact stacked cards, the number and a small drawing side by side over the title and line, rising in. Reduced
 * motion: the same stacked cards, nothing moves.
 */
export function Principles() {
  const last = PRINCIPLES_BLOCK.items.length - 1;

  return (
    <Choreo as="section" aria-labelledby="principles-title" className="relative isolate py-24 lg:py-36">
      <Backdrop />
      <Container>
        <div data-anim="fade-up">
          <SectionChip>{PRINCIPLES_BLOCK.label}</SectionChip>
        </div>
        <h2 id="principles-title" data-anim="chars" className="mt-7 text-title">
          {PRINCIPLES_BLOCK.title}
        </h2>
        <span aria-hidden data-anim="line-x" className="mt-10 block h-px bg-line-strong lg:mt-14" />

        <PrinciplesDeck className="mt-10 flex flex-col gap-4 lg:mt-16 lg:gap-[14svh] motion-safe:lg:after:h-[22svh] motion-reduce:lg:gap-6">
          {PRINCIPLES_BLOCK.items.map((p, i) => {
            const navy = i === last;
            return (
              <li
                key={p.title}
                data-card
                style={{ "--i": i } as CSSProperties}
                className={cn(
                  // Below desktop: number | drawing on top, then the title and line across both columns.
                  "relative grid grid-cols-[1fr_6.5rem] gap-6 overflow-hidden rounded-2xl p-6 sm:gap-8 sm:p-10",
                  "lg:sticky lg:top-[calc(112px+var(--i)*28px)] lg:min-h-[68svh] lg:origin-top lg:grid-cols-12 lg:gap-14 lg:p-14",
                  "motion-reduce:lg:relative motion-reduce:lg:top-auto motion-reduce:lg:min-h-0",
                  navy ? "on-navy grain bg-brand" : "border border-line bg-white shadow-raise",
                )}
              >
                {/* Below desktop this column dissolves into the card's grid, so its children carry their own layer. */}
                <div className="contents lg:relative lg:z-10 lg:col-span-7 lg:flex lg:flex-col lg:justify-between lg:gap-12">
                  <span aria-hidden className="relative z-10 block overflow-hidden max-lg:self-center">
                    <span data-index className={cn("block text-figure lg:text-stat", navy ? "text-teal" : "text-teal-deep")}>
                      {String(i + 1).padStart(2, "0")}
                    </span>
                  </span>
                  <div className="relative z-10 col-span-2">
                    <h3 className="max-w-[18ch] text-h3 sm:text-h2">{p.title}</h3>
                    <p className="mt-4 max-w-[44ch] text-lede text-text lg:mt-6">{p.description}</p>
                  </div>
                </div>

                {/* No z-index on the well: a stacking context here would stop the blend at the navy card's translucent
                    well (its black ground would show); without one it blends with the card itself. */}
                <div
                  aria-hidden
                  className={cn(
                    "relative h-26 overflow-hidden rounded-lg max-lg:col-start-2 max-lg:row-start-1 lg:col-span-5 lg:h-auto",
                    navy ? "bg-white" : "border border-line bg-white",
                  )}
                >
                  {/* The drawing in its own live colours on a white tile; multiply drops its white ground into the tile. */}
                  <span
                    data-art
                    className={cn(
                      "absolute inset-0 grid place-items-center p-3 mix-blend-multiply lg:p-10",
                    )}
                  >
                    <LineArt
                      name={ART[i]}
                      className="size-full max-h-[26rem] max-w-[26rem] object-contain"
                    />
                  </span>
                </div>

                {navy ? null : <span data-dim aria-hidden className="pointer-events-none absolute inset-0 z-20 bg-navy-deep opacity-0" />}
              </li>
            );
          })}
        </PrinciplesDeck>
      </Container>
    </Choreo>
  );
}
