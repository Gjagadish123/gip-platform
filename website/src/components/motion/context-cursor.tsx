"use client";

import { useRef } from "react";

import { FINE_POINTER, gsap, MOTION_OK, useGSAP } from "./gsap";

/**
 * A navy disc that follows the pointer and names what a click does wherever an element carries data-cursor="View"
 * (project pictures, the legacy frame, the quotes). The real cursor stays; this only labels. Desktop pointers with
 * motion allowed.
 */
export function ContextCursor() {
  const ref = useRef<HTMLDivElement>(null);
  const label = useRef<HTMLSpanElement>(null);

  useGSAP(() => {
    const mm = gsap.matchMedia();
    mm.add(`${MOTION_OK} and ${FINE_POINTER}`, () => {
      const el = ref.current;
      if (!el || !label.current) return;
      const x = gsap.quickTo(el, "x", { duration: 0.55, ease: "power3" });
      const y = gsap.quickTo(el, "y", { duration: 0.55, ease: "power3" });
      let current = "";
      let px = -100;
      let py = -100;

      const show = (text: string) => {
        if (text === current) return;
        current = text;
        if (text && label.current) label.current.textContent = text;
        gsap.to(el, { scale: text ? 1 : 0, opacity: text ? 1 : 0, duration: 0.5, ease: "expo.out", overwrite: "auto" });
      };
      const read = (target: Element | null) => show(target?.closest<HTMLElement>("[data-cursor]")?.dataset.cursor ?? "");
      const move = (e: PointerEvent) => {
        px = e.clientX;
        py = e.clientY;
        x(px);
        y(py);
        read(e.target as Element);
      };
      // Scrolling moves things under a still pointer.
      const scroll = () => read(document.elementFromPoint(px, py));
      const out = () => show("");

      window.addEventListener("pointermove", move, { passive: true });
      window.addEventListener("scroll", scroll, { passive: true });
      document.documentElement.addEventListener("pointerleave", out);
      return () => {
        window.removeEventListener("pointermove", move);
        window.removeEventListener("scroll", scroll);
        document.documentElement.removeEventListener("pointerleave", out);
      };
    });
  });

  return (
    <div
      ref={ref}
      aria-hidden
      className="pointer-events-none fixed top-0 left-0 z-[70] -mt-12 -ml-12 flex size-24 scale-0 items-center justify-center rounded-full bg-brand text-label text-white opacity-0 shadow-overlay"
    >
      <span ref={label} />
    </div>
  );
}
