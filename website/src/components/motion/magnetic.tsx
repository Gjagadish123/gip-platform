"use client";

import { useRef, type ReactNode } from "react";

import { cn } from "@/lib/utils";

import { FINE_POINTER, gsap, MOTION_OK, useGSAP } from "./gsap";

/**
 * A control that leans toward the pointer and springs back when it leaves (desktop pointers, motion allowed). Wraps one
 * button or link; the hit area travels with it.
 */
export function Magnetic({ children, strength = 0.32, className }: { children: ReactNode; strength?: number; className?: string }) {
  const ref = useRef<HTMLSpanElement>(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add(`${MOTION_OK} and ${FINE_POINTER}`, () => {
        const el = ref.current;
        if (!el) return;
        const x = gsap.quickTo(el, "x", { duration: 0.9, ease: "elastic.out(1, 0.45)" });
        const y = gsap.quickTo(el, "y", { duration: 0.9, ease: "elastic.out(1, 0.45)" });
        const move = (e: PointerEvent) => {
          const r = el.getBoundingClientRect();
          x((e.clientX - (r.left + r.width / 2)) * strength);
          y((e.clientY - (r.top + r.height / 2)) * strength);
        };
        const leave = () => {
          x(0);
          y(0);
        };
        el.addEventListener("pointermove", move);
        el.addEventListener("pointerleave", leave);
        return () => {
          el.removeEventListener("pointermove", move);
          el.removeEventListener("pointerleave", leave);
        };
      });
    },
    { scope: ref },
  );

  return (
    <span ref={ref} className={cn("inline-block", className)}>
      {children}
    </span>
  );
}
