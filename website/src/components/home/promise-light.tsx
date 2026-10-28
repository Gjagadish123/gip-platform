"use client";

import { useRef } from "react";

import { DESKTOP, FINE_POINTER, gsap, MOTION_OK, useGSAP } from "@/components/motion/gsap";

/**
 * The soft teal glow inside Our Promise (teal at 7 %). Desktop pointers with motion allowed: it trails the
 * pointer across its parent section. Otherwise it rests near the top-left corner. Phones and reduced motion: none.
 */
export function PromiseLight() {
  const ref = useRef<HTMLSpanElement>(null);

  useGSAP(() => {
    const mm = gsap.matchMedia();
    mm.add(`${MOTION_OK} and ${FINE_POINTER} and ${DESKTOP}`, () => {
      const el = ref.current;
      const area = el?.parentElement;
      if (!el || !area) return;
      const x = gsap.quickTo(el, "x", { duration: 1.2, ease: "power3" });
      const y = gsap.quickTo(el, "y", { duration: 1.2, ease: "power3" });
      // The light's centre rests at (160, 160); move it so the centre sits under the pointer.
      const move = (e: PointerEvent) => {
        const r = area.getBoundingClientRect();
        x(e.clientX - r.left - 160);
        y(e.clientY - r.top - 160);
      };
      area.addEventListener("pointermove", move);
      return () => area.removeEventListener("pointermove", move);
    });
  });

  return (
    <span
      ref={ref}
      aria-hidden
      className="pointer-events-none absolute -top-40 -left-40 hidden size-[640px] rounded-full bg-[radial-gradient(closest-side,color-mix(in_srgb,var(--teal)_7%,transparent),transparent)] lg:block motion-reduce:hidden"
    />
  );
}
