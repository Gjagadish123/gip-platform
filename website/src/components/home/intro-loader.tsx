"use client";

import { DrawSVGPlugin } from "gsap/DrawSVGPlugin";
import { useRef } from "react";

import { gsap, MOTION_OK, useGSAP } from "@/components/motion/gsap";
import { withBase } from "@/lib/base-path";

import { LOCKUP_VIEWBOX, MARK, WORDMARK } from "./gip-lockup";
import { INTRO_SEEN as SEEN } from "./intro-boot";

gsap.registerPlugin(DrawSVGPlugin);

// The lockup is drawn 320 units wide in a 520 × 800 frame that meets the screen, so it is ~360 px on a laptop and
// ~240 px on a phone, always centred.
const W = 320;
const K = W / LOCKUP_VIEWBOX.width;
const PLACE = `translate(${-W / 2} ${(-LOCKUP_VIEWBOX.height * K) / 2}) scale(${K})`;
// The push-through point, in logo units: inside the thick left roof, which ends up covering the whole screen.
const THROUGH = { x: 150, y: 37 };
const BIG = { x: -4000, y: -4000, width: 8000, height: 8000 };
// Where each roof piece flies in from (window bars, left roof, peak, lower wing, wing tip), in logo units.
const FROM = [
  { x: 0, y: 24 },
  { x: 0, y: 36 },
  { x: -46, y: 30 },
  { x: 0, y: -40 },
  { x: 52, y: 26 },
  { x: 40, y: 20 },
];

/**
 * The page loader, first visit of a session only, upgraded from the live site's animated logo. On navy-deep the roof
 * mark is first drawn in teal outline, then its six pieces fly in and fill white, and the wordmark rises letter by
 * letter while a teal counter and hairline run to 100 (and the hero poster and fonts are ready). Then the wordmark steps
 * away, the white roof dissolves into a window onto the hero film, and the screen pushes through it: the roof grows
 * until the film fills the screen and the hero's own entrance plays. Scroll is held and the page behind is inert
 * meanwhile. Reduced motion and repeat visits: no loader. Without script it fades by itself after 4.5 s.
 */
export function IntroLoader() {
  const ref = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const root = ref.current;
      if (!root) return;
      let seen = false;
      try {
        seen = Boolean(sessionStorage.getItem(SEEN));
      } catch {}
      if (root.hidden || seen) {
        root.hidden = true;
        return;
      }

      const mm = gsap.matchMedia();
      mm.add(MOTION_OK, () => {
        const q = gsap.utils.selector(root);
        const hole = root.querySelector<SVGGElement>("[data-hole]");
        const counter = root.querySelector<HTMLElement>("[data-count]");
        if (!hole || !counter) return;
        const html = document.documentElement;
        // The timeline owns the loader now: the boot script's failsafe is no longer needed.
        clearTimeout((window as Window & { __gipIntro?: number }).__gipIntro);
        root.setAttribute("data-js", "");
        html.setAttribute("data-intro", ""); // SmoothScroll holds Lenis while this is set
        document.body.inert = true; // nothing under the loader takes focus
        window.scrollTo(0, 0);

        const open = () => {
          root.hidden = true;
          html.removeAttribute("data-intro");
          document.body.inert = false;
          try {
            sessionStorage.setItem(SEEN, "1");
          } catch {}
        };

        // Ready when the fonts and the hero poster are in; at the end of the count it waits at most 1.2 s more.
        const poster = new Promise<void>((resolve) => {
          const img = new Image();
          img.onload = img.onerror = () => resolve();
          img.src = withBase(
            window.matchMedia("(min-width: 64rem)").matches
              ? "/media/hero-film-poster.webp"
              : "/media/hero-film-poster-mobile.webp",
          );
        });
        const assets = Promise.all([document.fonts.ready, poster]);

        const zoom = { s: 1 };
        const count = { v: 0 };
        const tl = gsap.timeline({ defaults: { ease: "expo.out" }, onComplete: open });
        // The teal outline draws on its own first; the white pieces fly in once it is nearly done.
        tl.from(q("[data-outline] path"), { drawSVG: "0%", duration: 1, ease: "power2.inOut", stagger: 0.06 }, 0)
          .from(
            q("[data-piece]"),
            { opacity: 0, x: (i) => FROM[i].x, y: (i) => FROM[i].y, duration: 1.1, stagger: 0.07 },
            0.8,
          )
          .to(q("[data-outline]"), { opacity: 0, duration: 0.5, ease: "power2.out" }, 1.6)
          .from(q("[data-word] path"), { opacity: 0, y: 16, duration: 0.8, stagger: 0.018 }, 1.1)
          .from(q("[data-ui]"), { opacity: 0, duration: 0.6 }, 0.1)
          .to(
            count,
            {
              v: 100,
              duration: 2,
              ease: "power2.inOut",
              onUpdate: () => {
                counter.textContent = String(Math.round(count.v)).padStart(3, "0");
              },
            },
            0,
          )
          .fromTo(q("[data-progress]"), { scaleX: 0 }, { scaleX: 1, duration: 2, ease: "power2.inOut" }, 0)
          .addPause(2.05, () => void Promise.race([assets, new Promise((r) => setTimeout(r, 1200))]).then(() => tl.resume()))
          .to([q("[data-word]"), q("[data-ui]")], { opacity: 0, duration: 0.4, ease: "power2.out" }, 2.1)
          // The white roof dissolves into a window onto the film, holds a beat, then the screen pushes through it.
          .add(() => hole.setAttribute("visibility", "visible"), 2.3)
          .to(q("[data-mark]"), { opacity: 0, duration: 0.35, ease: "power1.inOut" }, 2.3)
          .to(
            zoom,
            {
              s: 90,
              duration: 1.35,
              ease: "power4.in",
              onUpdate: () =>
                hole.setAttribute(
                  "transform",
                  `translate(${THROUGH.x} ${THROUGH.y}) scale(${zoom.s}) translate(${-THROUGH.x} ${-THROUGH.y})`,
                ),
            },
            2.75,
          )
          // The hero's entrance starts as the window opens up, so its words rise in view.
          .add(() => root.setAttribute("data-out", ""), 3.55);
        // The from() calls above have set the start state: the lockup can show (no finished logo before the draw).
        root.setAttribute("data-run", "");

        return () => {
          tl.kill();
          html.removeAttribute("data-intro");
          document.body.inert = false;
        };
      });
    },
    { scope: ref },
  );

  return (
    <div
      id="intro"
      ref={ref}
      aria-hidden
      suppressHydrationWarning
      className="fixed inset-0 z-[100] motion-reduce:hidden [&:not([data-js])]:animate-[intro-fallback_0.6s_ease_4.5s_forwards]"
    >
      <svg className="absolute inset-0 size-full" viewBox="-260 -400 520 800" preserveAspectRatio="xMidYMid meet">
        <defs>
          <mask id="intro-window" maskUnits="userSpaceOnUse" {...BIG}>
            <rect {...BIG} fill="white" />
            <g transform={PLACE}>
              <g data-hole visibility="hidden">
                {MARK.map((p) => (
                  <path key={p.d} d={p.d} fill="black" fillRule={p.evenOdd ? "evenodd" : "nonzero"} />
                ))}
              </g>
            </g>
          </mask>
        </defs>
        <rect {...BIG} fill="#01223f" mask="url(#intro-window)" />
        <g transform={PLACE}>
          <g data-mark fill="white">
            {MARK.map((p) => (
              <path key={p.d} data-piece d={p.d} fillRule={p.evenOdd ? "evenodd" : "nonzero"} />
            ))}
          </g>
          <g data-outline fill="none" stroke="#2cc4b6" strokeWidth={2.2} strokeLinejoin="round">
            {MARK.map((p) => (
              <path key={p.d} d={p.d} />
            ))}
          </g>
          <g data-word fill="white">
            {WORDMARK.map((d) => (
              <path key={d} d={d} />
            ))}
          </g>
        </g>
      </svg>

      <div
        data-ui
        className="absolute inset-x-0 bottom-0 px-5 pb-[calc(env(safe-area-inset-bottom)+1.5rem)] sm:px-8 lg:px-12 lg:pb-10"
      >
        <div className="flex items-end justify-end">
          <span data-count className="text-label text-teal tabular-nums">
            000
          </span>
        </div>
        <span className="mt-3 block h-px bg-white/12">
          <span data-progress className="block h-full origin-left scale-x-0 bg-teal" />
        </span>
      </div>
    </div>
  );
}
