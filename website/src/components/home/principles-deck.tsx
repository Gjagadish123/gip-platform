"use client";

import { useRef, type ReactNode } from "react";

import { DESKTOP, EASE, gsap, MOTION_OK, PHONE, useGSAP } from "@/components/motion/gsap";

/** Where card i sticks; the cards carry the same rule (lg:top-[calc(112px+var(--i)*28px)]). */
const stuckAt = (i: number) => 112 + i * 28;

/**
 * The principles list and its motion. Desktop (motion allowed): the cards are sticky, so each slides up over the last
 * (its drawing settling from a zoom on the way) and every card underneath shrinks toward its top edge and dims, deeper
 * cards further, until the four sit as a deck. Each card's number rises out of its mask on a short scrub of its own,
 * from the card's top entering the screen to its reaching 60 % of the way down, so it reads whole long before the card
 * sticks. Below desktop: each card rises in once. Reduced motion: nothing runs.
 */
export function PrinciplesDeck({ className, children }: { className?: string; children: ReactNode }) {
  const ref = useRef<HTMLOListElement>(null);

  useGSAP(
    () => {
      const list = ref.current;
      if (!list) return;
      const cards = gsap.utils.toArray<HTMLElement>("[data-card]", list);
      const last = cards.length - 1;
      const mm = gsap.matchMedia();

      mm.add(`${MOTION_OK} and ${DESKTOP}`, () => {
        // A stuck card measures where it is stuck, not where it sits in the flow, so every trigger hangs off the list
        // at the card's flow offset (the heights and gaps before it).
        const flow = (i: number) =>
          cards.slice(0, i).reduce((y, c) => y + c.offsetHeight, 0) + i * parseFloat(getComputedStyle(list).rowGap);
        const arrival = (from: number, to: number) => ({
          trigger: list,
          start: () => `top+=${flow(from)} bottom`,
          end: () => `top+=${flow(to)} ${stuckAt(to)}px`,
          scrub: 0.8,
        });

        cards.forEach((card, i) => {
          gsap.from(card.querySelector("[data-index]"), {
            yPercent: 100,
            ease: "none",
            scrollTrigger: { trigger: list, start: () => `top+=${flow(i)} bottom`, end: () => `top+=${flow(i)} 60%`, scrub: 0.8 },
          });
          gsap.from(card.querySelector("[data-art]"), { scale: 1.15, ease: "none", scrollTrigger: arrival(i, i) });
          if (i === last) return;
          // Covered from the next card's arrival until the deck is complete: 0.925 / 0.95 / 0.975.
          const depth = last - i;
          gsap
            .timeline({ defaults: { ease: "none" }, scrollTrigger: arrival(i + 1, last) })
            .to(card, { scale: 1 - depth * 0.025 }, 0)
            .to(card.querySelector("[data-dim]"), { opacity: depth * 0.05 }, 0);
        });
      });

      mm.add(`${MOTION_OK} and ${PHONE}`, () => {
        for (const card of cards) {
          gsap.from(card, { y: 56, opacity: 0, duration: 1.2, ease: EASE, scrollTrigger: { trigger: card, start: "top 90%", once: true } });
        }
      });
    },
    { scope: ref },
  );

  return (
    <ol ref={ref} className={className}>
      {children}
    </ol>
  );
}
