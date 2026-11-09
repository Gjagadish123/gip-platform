"use client";

import { Pause, Play } from "lucide-react";
import Image from "next/image";
import { useState } from "react";

import { Choreo } from "@/components/motion/choreo";
import { SectionChip } from "@/components/site/typography";
import { Button } from "@/components/ui/button";
import { TESTIMONIALS } from "@/lib/home";
import { cn } from "@/lib/utils";

type Item = (typeof TESTIMONIALS.items)[number];

/** The live site's card: a picture, then the quote (three lines, italic) over the face and name. */
function Card({ t }: { t: Item }) {
  return (
    <li className="flex shrink-0 py-2 pr-6 sm:pr-8">
      <figure className="group/card flex w-[320px] items-start gap-4 rounded-2xl border border-line bg-white p-5 shadow-xs transition-shadow duration-300 hover:shadow-xl sm:w-[400px] lg:w-[450px]">
        <span className="size-24 shrink-0 overflow-hidden rounded-xl sm:size-28">
          <Image src={t.home} alt="" sizes="112px" className="size-full object-cover transition-transform duration-500 group-hover/card:scale-110" />
        </span>
        <div className="flex flex-1 flex-col gap-3 self-stretch">
          {/* Inter is loaded upright only and the site turns synthesis off; the quotes slant like the live site's. */}
          <blockquote className="text-small leading-relaxed text-muted italic [font-synthesis:style]">
            <p className="line-clamp-3">&ldquo;{t.quote}&rdquo;</p>
          </blockquote>
          <figcaption className="mt-auto flex items-center gap-3">
            <Image src={t.face} alt="" className="size-8 rounded-full border border-line object-cover" />
            <span className="text-small font-semibold text-navy">{t.name}</span>
          </figcaption>
        </div>
      </figure>
    </li>
  );
}

/**
 * Client Feedbacks as on the live home: the chip and heading centred on white, then two rows of the same seven
 * feedback cards drifting in opposite directions (each list drawn twice for a seamless loop, the copies and the second
 * row hidden from assistive tech), faded at the edges. Hovering the rows or the pause button stops them. Reduced
 * motion: no drift and no second row; the seven cards wrap, centred.
 */
export function Testimonials() {
  const [paused, setPaused] = useState(false);

  return (
    <Choreo as="section" aria-labelledby="testimonials-title" className="overflow-x-clip bg-white py-16 md:py-24">
      <div className="mx-auto max-w-[1440px] px-4 sm:px-6 lg:px-8">
        <div className="mb-12 flex flex-col items-center text-center lg:mb-16">
          <div data-anim="fade-up">
            <SectionChip>{TESTIMONIALS.label}</SectionChip>
          </div>
          <h2 id="testimonials-title" data-anim="chars" className="mt-5 text-h2 text-navy">
            {TESTIMONIALS.title}
          </h2>
        </div>

        <div
          data-anim="fade-up"
          data-delay="0.1"
          className="group/rows grid gap-8 [--marquee-duration:28s] motion-safe:[mask-image:linear-gradient(to_right,transparent,black_4rem,black_calc(100%-4rem),transparent)] sm:motion-safe:[mask-image:linear-gradient(to_right,transparent,black_8rem,black_calc(100%-8rem),transparent)]"
        >
          {[0, 1].map((r) => (
            <div key={r} aria-hidden={r > 0 || undefined} className={cn("flex overflow-hidden", r > 0 && "motion-reduce:hidden")}>
              {[0, 1].map((copy) => (
                <ul
                  key={copy}
                  aria-hidden={copy > 0 || undefined}
                  className={cn(
                    "flex shrink-0 animate-marquee group-hover/rows:[animation-play-state:paused]",
                    r > 0 && "[animation-direction:reverse]",
                    paused && "[animation-play-state:paused]",
                    "motion-reduce:shrink motion-reduce:animate-none motion-reduce:flex-wrap motion-reduce:justify-center",
                    copy > 0 && "motion-reduce:hidden",
                  )}
                >
                  {TESTIMONIALS.items.map((t) => (
                    <Card key={t.name} t={t} />
                  ))}
                </ul>
              ))}
            </div>
          ))}
        </div>

        <div className="mt-8 flex justify-center motion-reduce:hidden">
          <Button
            variant="secondary"
            size="icon"
            aria-label={paused ? "Play the client feedback" : "Pause the client feedback"}
            onClick={() => setPaused(!paused)}
          >
            {paused ? <Play /> : <Pause />}
          </Button>
        </div>
      </div>
    </Choreo>
  );
}
