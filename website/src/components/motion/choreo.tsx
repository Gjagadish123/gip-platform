"use client";

import { useRef, type ComponentPropsWithoutRef, type ElementType, type ReactNode } from "react";

import { EASE, gsap, MOTION_OK, ScrollTrigger, SplitText, useGSAP } from "./gsap";

/**
 * Scroll choreography for server-rendered markup. Wrap a section in <Choreo> and mark elements with data attributes;
 * the section stays a server component and only this wrapper ships to the client.
 *
 *   data-anim="lines"        each line rises out of its own mask (headings, ledes, paragraphs)
 *   data-anim="words"        words rise out of masks, quick stagger
 *   data-anim="chars"        a heading's letters rise out of word masks (h1–h3 only: the heading keeps an aria-label)
 *   data-anim="scrub-words"  words brighten from faint to full as the paragraph scrolls through the screen
 *   data-anim="fade-up"      the element rises 48 px and fades in
 *   data-anim="stagger"      the element's children rise in turn
 *   data-anim="line-x"       a hairline draws from the left (data-from="right" / "center")
 *   data-anim="line-y"       a hairline draws from the top
 *   data-anim="reveal"       a picture frame wipes open (data-from="bottom" | "top" | "left" | "right") and its media
 *                            settles from a 1.2 zoom
 *   data-anim="parallax"     the element drifts ±data-speed % (default 10) against its parent while the parent crosses
 *                            the screen; put it on an oversized inner layer of an overflow-hidden frame
 *   data-anim="scale-in"     the element grows from 0.92 and fades in
 *
 * Shared options: data-delay (s), data-start (ScrollTrigger start, default "top 88%"), data-trigger (a selector inside
 * the wrapper to trigger from instead of the element). Entrances play once, and are skipped when already scrolled past
 * at load. Reduced motion: nothing runs, everything is shown as written.
 */
export function Choreo<T extends ElementType = "div">({
  as,
  children,
  ...rest
}: { as?: T; children: ReactNode } & Omit<ComponentPropsWithoutRef<T>, "as" | "children">) {
  const Tag: ElementType = as ?? "div";
  const ref = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add(MOTION_OK, () => {
        const root = ref.current;
        if (root) choreograph(root);
      });
    },
    { scope: ref },
  );

  return (
    <Tag ref={ref} {...rest}>
      {children}
    </Tag>
  );
}

const CLIP_FROM = {
  bottom: "inset(100% 0% 0% 0%)",
  top: "inset(0% 0% 100% 0%)",
  left: "inset(0% 100% 0% 0%)",
  right: "inset(0% 0% 0% 100%)",
} as const;

// Masks clip at the line box; tight display leading would cut descenders (y, j, g), so each mask gets room below that
// a matching negative margin gives back.
const unclip = (masks: Element[]) => gsap.set(masks, { paddingBottom: "0.14em", marginBottom: "-0.14em" });

const ENTRANCES = new Set(["lines", "words", "chars", "fade-up", "stagger", "line-x", "line-y", "reveal", "scale-in"]);

// An entrance whose start line is already behind the reader (a reload or deep link mid-page) stays as the server
// painted it instead of blanking and playing again.
const passed = (trigger: Element, start: string) => {
  const m = /^top (\d+)%$/.exec(start);
  return m ? ScrollTrigger.positionInViewport(trigger, "top") < Number(m[1]) / 100 : false;
};

function choreograph(root: HTMLElement) {
  for (const el of gsap.utils.toArray<HTMLElement>("[data-anim]", root)) {
    const { anim, delay: d, start = "top 88%", trigger: sel, from, speed } = el.dataset;
    const delay = Number(d ?? 0);
    const trigger = (sel && root.querySelector(sel)) || el;
    const once = { trigger, start, once: true };
    if (anim && ENTRANCES.has(anim) && passed(trigger, start)) continue;

    switch (anim) {
      case "lines":
      case "words":
        SplitText.create(el, {
          type: anim,
          mask: anim,
          aria: "none",
          autoSplit: true,
          onSplit: (s) => {
            unclip(s.masks);
            return gsap.from(anim === "lines" ? s.lines : s.words, {
              yPercent: 110,
              duration: anim === "lines" ? 1.25 : 1,
              ease: EASE,
              stagger: anim === "lines" ? 0.09 : 0.035,
              delay,
              scrollTrigger: once,
            });
          },
        });
        break;
      case "chars":
        SplitText.create(el, {
          type: "words,chars",
          mask: "words",
          autoSplit: true,
          onSplit: (s) => {
            unclip(s.masks);
            return gsap.from(s.chars, { yPercent: 115, duration: 1.1, ease: EASE, stagger: 0.018, delay, scrollTrigger: once });
          },
        });
        break;
      case "scrub-words":
        SplitText.create(el, {
          type: "words",
          aria: "none",
          autoSplit: true,
          onSplit: (s) =>
            gsap.fromTo(
              s.words,
              { opacity: 0.16 },
              { opacity: 1, ease: "none", stagger: 0.1, scrollTrigger: { trigger: el, start: "top 82%", end: "bottom 48%", scrub: true } },
            ),
        });
        break;
      case "fade-up":
        gsap.from(el, { y: 48, opacity: 0, duration: 1.2, ease: EASE, delay, scrollTrigger: once });
        break;
      case "stagger":
        gsap.from(el.children, { y: 48, opacity: 0, duration: 1.1, ease: EASE, stagger: 0.12, delay, scrollTrigger: once });
        break;
      case "line-x":
        gsap.from(el, {
          scaleX: 0,
          transformOrigin: from === "right" ? "right center" : from === "center" ? "center center" : "left center",
          duration: 1.4,
          ease: "expo.inOut",
          delay,
          scrollTrigger: once,
        });
        break;
      case "line-y":
        gsap.from(el, { scaleY: 0, transformOrigin: "center top", duration: 1.4, ease: "expo.inOut", delay, scrollTrigger: once });
        break;
      case "reveal": {
        const clip = CLIP_FROM[(from as keyof typeof CLIP_FROM) ?? "bottom"] ?? CLIP_FROM.bottom;
        const tl = gsap.timeline({ delay, scrollTrigger: once });
        tl.fromTo(el, { clipPath: clip }, { clipPath: "inset(0% 0% 0% 0%)", duration: 1.4, ease: "expo.inOut" });
        // The rendered one: a frame may hold a phone and a desktop copy, one of them display: none.
        const media = gsap.utils.toArray<HTMLElement>("img, video", el).find((m) => m.getClientRects().length);
        if (media) tl.from(media, { scale: 1.2, duration: 1.9, ease: EASE }, 0.1);
        break;
      }
      case "parallax": {
        const s = Number(speed ?? 10);
        gsap.fromTo(
          el,
          { yPercent: -s },
          { yPercent: s, ease: "none", scrollTrigger: { trigger: el.parentElement ?? el, start: "top bottom", end: "bottom top", scrub: true } },
        );
        break;
      }
      case "scale-in":
        gsap.from(el, { scale: 0.92, opacity: 0, duration: 1.3, ease: EASE, delay, scrollTrigger: once });
        break;
    }
  }
}
