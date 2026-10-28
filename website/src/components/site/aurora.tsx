import type { CSSProperties } from "react";

import { cn } from "@/lib/utils";

type Light = { x: string; y: string; size: string; color: string; dx: string; dy: string; delay: string };

const TEAL = "rgb(44 196 182 / 0.5)";
const MINT = "rgb(139 227 214 / 0.55)";
const SKY = "rgb(127 182 240 / 0.42)";
const NAVY = "rgb(29 90 146 / 0.18)";

// One arrangement per light section, so the light never repeats from one to the next.
const SCENES: Record<"a" | "b" | "c" | "d" | "e" | "f", Light[]> = {
  a: [
    { x: "78%", y: "-8%", size: "60vmax", color: TEAL, dx: "-8vmax", dy: "6vmax", delay: "0s" },
    { x: "-12%", y: "55%", size: "55vmax", color: SKY, dx: "7vmax", dy: "-5vmax", delay: "-7s" },
  ],
  b: [
    { x: "-15%", y: "5%", size: "50vmax", color: MINT, dx: "6vmax", dy: "8vmax", delay: "-3s" },
    { x: "70%", y: "45%", size: "55vmax", color: SKY, dx: "-6vmax", dy: "-6vmax", delay: "-11s" },
    { x: "30%", y: "85%", size: "45vmax", color: TEAL, dx: "5vmax", dy: "-4vmax", delay: "-6s" },
  ],
  c: [
    { x: "85%", y: "10%", size: "52vmax", color: SKY, dx: "-7vmax", dy: "5vmax", delay: "-2s" },
    { x: "5%", y: "70%", size: "58vmax", color: TEAL, dx: "8vmax", dy: "-6vmax", delay: "-9s" },
  ],
  d: [
    { x: "60%", y: "-15%", size: "62vmax", color: MINT, dx: "-5vmax", dy: "7vmax", delay: "-5s" },
    { x: "-10%", y: "40%", size: "48vmax", color: TEAL, dx: "7vmax", dy: "4vmax", delay: "-12s" },
    { x: "90%", y: "80%", size: "50vmax", color: NAVY, dx: "-6vmax", dy: "-5vmax", delay: "-8s" },
  ],
  e: [
    { x: "15%", y: "-10%", size: "55vmax", color: TEAL, dx: "6vmax", dy: "6vmax", delay: "-4s" },
    { x: "95%", y: "60%", size: "56vmax", color: MINT, dx: "-8vmax", dy: "-4vmax", delay: "-10s" },
  ],
  f: [
    { x: "50%", y: "-30%", size: "70vmax", color: SKY, dx: "-6vmax", dy: "5vmax", delay: "-1s" },
    { x: "-20%", y: "60%", size: "50vmax", color: TEAL, dx: "6vmax", dy: "-3vmax", delay: "-8s" },
  ],
};

/**
 * Aurora: soft teal, mint and sky light drifting slowly behind a light section, with film grain, so white grounds have
 * depth instead of a flat tint. Pure CSS (radial gradients moved by transform), aria-hidden, behind the content (the
 * host needs `relative isolate`). Reduced motion: the lights hold still.
 */
export function Aurora({ scene, className }: { scene: keyof typeof SCENES; className?: string }) {
  return (
    <div aria-hidden className={cn("grain pointer-events-none absolute inset-0 -z-10 overflow-hidden bg-white", className)}>
      {SCENES[scene].map((l, i) => (
        <span
          key={i}
          className="absolute -translate-1/2 rounded-full motion-safe:animate-[aurora-drift_22s_ease-in-out_infinite_alternate]"
          style={
            {
              left: l.x,
              top: l.y,
              width: l.size,
              height: l.size,
              background: `radial-gradient(closest-side, ${l.color}, transparent)`,
              animationDelay: l.delay,
              "--dx": l.dx,
              "--dy": l.dy,
            } as CSSProperties
          }
        />
      ))}
    </div>
  );
}
