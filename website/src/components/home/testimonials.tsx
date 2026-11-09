"use client";

import { Pause, Play } from "lucide-react";
import { useState } from "react";

import { Choreo } from "@/components/motion/choreo";
import { Container } from "@/components/site/container";
import { SectionChip } from "@/components/site/typography";
import { Button } from "@/components/ui/button";
import { TESTIMONIALS } from "@/lib/home";
import { cn } from "@/lib/utils";

type Item = (typeof TESTIMONIALS.items)[number];

const ITEMS = TESTIMONIALS.items;
// The second row starts part way through the list so the two rows never line up.
const ROWS = [ITEMS, [...ITEMS.slice(3), ...ITEMS.slice(0, 3)]];
const initials = (name: string) =>
  name
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0])
    .join("");

function Card({ t }: { t: Item }) {
  return (
    <li className="flex w-[19rem] shrink-0 pr-5 sm:w-[23rem]">
      <figure className="flex w-full flex-col rounded-2xl border border-line bg-white p-6 shadow-raise">
        {/* Inter is loaded upright only and the site turns synthesis off; the quotes slant like the old site's. */}
        <blockquote className="text-body text-text italic [font-synthesis:style]">
          <p>&ldquo;{t.quote}&rdquo;</p>
        </blockquote>
        <figcaption className="mt-auto flex items-center gap-3 pt-5">
          <span aria-hidden className="grid size-9 shrink-0 place-items-center rounded-full bg-teal-soft text-label text-teal-deep">
            {initials(t.name)}
          </span>
          <span className="text-small font-semibold text-navy">{t.name}</span>
        </figcaption>
      </figure>
    </li>
  );
}

/**
 * Client Feedbacks in the old site's layout: the chip and heading centred on white, then the feedback as cards in two
 * rows drifting in opposite directions (each list drawn twice for a seamless loop, the copies hidden from assistive
 * tech, the second row decorative), faded at the edges. Hovering a row or pressing pause stops both. Reduced motion:
 * no drift and no second row; the seven cards wrap, centred.
 */
export function Testimonials() {
  const [paused, setPaused] = useState(false);

  return (
    <Choreo as="section" aria-labelledby="testimonials-title" className="overflow-x-clip bg-white py-24 lg:py-32">
      <Container className="flex flex-col items-center text-center">
        <div data-anim="fade-up">
          <SectionChip>{TESTIMONIALS.label}</SectionChip>
        </div>
        <h2 id="testimonials-title" data-anim="chars" className="mt-7 text-h2 text-navy">
          {TESTIMONIALS.title}
        </h2>
      </Container>

      <div
        data-anim="fade-up"
        data-delay="0.1"
        className="group/rows mt-14 grid gap-5 [--marquee-duration:70s] motion-safe:[mask-image:linear-gradient(to_right,transparent,black_6%,black_94%,transparent)] lg:mt-16"
      >
        {ROWS.map((row, r) => (
          <div key={r} aria-hidden={r > 0 || undefined} className={cn("flex", r > 0 && "motion-reduce:hidden")}>
            {[0, 1].map((copy) => (
              <ul
                key={copy}
                aria-hidden={copy > 0 || undefined}
                className={cn(
                  "flex shrink-0 animate-marquee group-hover/rows:[animation-play-state:paused]",
                  r > 0 && "[animation-direction:reverse]",
                  paused && "[animation-play-state:paused]",
                  "motion-reduce:mx-auto motion-reduce:max-w-[1344px] motion-reduce:shrink motion-reduce:animate-none motion-reduce:flex-wrap motion-reduce:justify-center motion-reduce:gap-y-5 motion-reduce:px-5 sm:motion-reduce:px-8",
                  copy > 0 && "motion-reduce:hidden",
                )}
              >
                {row.map((t) => (
                  <Card key={t.name} t={t} />
                ))}
              </ul>
            ))}
          </div>
        ))}
      </div>

      <Container className="mt-8 flex justify-center motion-reduce:hidden">
        <Button
          variant="secondary"
          size="icon"
          aria-label={paused ? "Play the client feedback" : "Pause the client feedback"}
          onClick={() => setPaused(!paused)}
        >
          {paused ? <Play /> : <Pause />}
        </Button>
      </Container>
    </Choreo>
  );
}
