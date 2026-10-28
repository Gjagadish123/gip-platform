"use client";

import { useRef } from "react";

import { DESKTOP, gsap, MOTION_OK, PHONE, useGSAP } from "@/components/motion/gsap";
import { ImpressionChip } from "@/components/site/plate";
import { WHY } from "@/lib/home";

import { Film } from "./film";

/**
 * The Why Choose Us film, a render, so it carries the impression note top-left. The frame morphs with the scroll (a
 * clip-path), scrubbed from the frame entering the screen to its centre reaching the screen centre; the pause control
 * sits bottom-centre so the pill never clips it. Desktop: the frame is centred and capped at 52 rem (the source is
 * only 640 px wide) and opens from a pill 64 % of its width to the full frame with 20 px corners while the film settles
 * from a 1.04 zoom. Phones and tablets: a 16:9 frame (the film's lettering stays whole) opening from a pill 76 % wide
 * to 28 px corners. Reduced motion: the final, full frame.
 */
export function WhyFilm() {
  const ref = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add(`${MOTION_OK} and ${DESKTOP}`, () => {
        const frame = ref.current;
        const video = frame?.querySelector("video");
        if (!frame || !video) return;
        gsap
          .timeline({ defaults: { ease: "none" }, scrollTrigger: { trigger: frame, start: "top bottom", end: "center center", scrub: 0.8 } })
          .fromTo(frame, { clipPath: "inset(0% 18% 0% 18% round 999px)" }, { clipPath: "inset(0% 0% 0% 0% round 20px)" })
          .fromTo(video, { scale: 1.04 }, { scale: 1 }, 0);
      });
      mm.add(`${MOTION_OK} and ${PHONE}`, () => {
        gsap.fromTo(
          ref.current,
          { clipPath: "inset(0% 12% 0% 12% round 999px)" },
          {
            clipPath: "inset(0% 0% 0% 0% round 28px)",
            ease: "none",
            scrollTrigger: { trigger: ref.current, start: "top bottom", end: "center center", scrub: true },
          },
        );
      });
    },
    { scope: ref },
  );

  return (
    <div
      ref={ref}
      className="relative mt-20 aspect-video overflow-hidden rounded-[28px] bg-navy-deep lg:mx-auto lg:mt-28 lg:aspect-[21/9] lg:max-w-[52rem] lg:rounded-2xl"
    >
      <Film src={WHY.video.src} poster={WHY.video.poster} control="bottom-4 left-1/2 -translate-x-1/2 lg:bottom-6" />
      <ImpressionChip className="top-4 bottom-auto! left-4!" />
    </div>
  );
}
