"use client";

import { useRef, type ReactNode } from "react";

import { DESKTOP, gsap, MOTION_OK, ScrollTrigger, useGSAP } from "@/components/motion/gsap";

/**
 * The Values split and its switch. Desktop with motion allowed: the row ([data-row]) crossing 55 % of the screen is the
 * active one; it sits at full strength while the other rows dim to 0.35, and the sticky well crossfades in 500 ms to
 * that value's drawing ([data-art], same order). Before the first row arrives the first is active; after the last
 * passes the last stays. Phones, tablets and reduced motion: nothing runs, every row at full strength.
 */
export function ValuesSwitch({ className, children }: { className?: string; children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add(`${MOTION_OK} and ${DESKTOP}`, () => {
        const root = ref.current;
        if (!root) return;
        const rows = gsap.utils.toArray<HTMLElement>("[data-row]", root);
        const arts = gsap.utils.toArray<HTMLElement>("[data-art]", root);
        const show = (on: number, duration = 0.5) => {
          const ease = "power2.out";
          gsap.to(rows, { opacity: (i) => (i === on ? 1 : 0.35), duration, ease, overwrite: true });
          gsap.to(arts, { opacity: (i) => (i === on ? 1 : 0), scale: (i) => (i === on ? 1 : 0.96), duration, ease, overwrite: true });
        };
        show(0, 0);
        rows.forEach((row, i) =>
          ScrollTrigger.create({
            trigger: row,
            start: "top 55%",
            end: "bottom 55%",
            onToggle: (self) => {
              if (self.isActive) show(i);
            },
          }),
        );
        // Switch tweens start in scroll callbacks, outside this context's record, so leaving desktop clears them by hand.
        return () => {
          gsap.killTweensOf([...rows, ...arts]);
          gsap.set([...rows, ...arts], { clearProps: "opacity,transform" });
        };
      });
    },
    { scope: ref },
  );

  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  );
}
