"use client";

import "lenis/dist/lenis.css";

import Lenis from "lenis";
import { useEffect } from "react";

import { gsap, MOTION_OK, ScrollTrigger } from "./gsap";

/**
 * Lenis smooth scrolling on the GSAP ticker, so every ScrollTrigger reads the smoothed position. Home only (the master
 * plan page needs raw wheel input). Off under reduced motion. Stops while a dialog or drawer holds the scroll lock
 * (Radix marks the body with data-scroll-locked) or the logo loader holds the screen (data-intro on <html>), and never
 * smooths wheels inside a dialog.
 */
export function SmoothScroll() {
  useEffect(() => {
    if (!window.matchMedia(MOTION_OK).matches) return;
    const lenis = new Lenis({
      lerp: 0.09,
      anchors: { offset: -104 },
      prevent: (node) => Boolean(node.closest("[role=dialog], [data-lenis-prevent]")),
    });
    lenis.on("scroll", ScrollTrigger.update);
    const tick = (time: number) => lenis.raf(time * 1000);
    gsap.ticker.add(tick);
    gsap.ticker.lagSmoothing(0);

    const held = () => document.body.hasAttribute("data-scroll-locked") || document.documentElement.hasAttribute("data-intro");
    const sync = () => (held() ? lenis.stop() : lenis.start());
    const lock = new MutationObserver(sync);
    lock.observe(document.body, { attributes: true, attributeFilter: ["data-scroll-locked"] });
    lock.observe(document.documentElement, { attributes: true, attributeFilter: ["data-intro"] });
    sync();

    return () => {
      lock.disconnect();
      gsap.ticker.remove(tick);
      gsap.ticker.lagSmoothing(500, 33);
      lenis.destroy();
    };
  }, []);
  return null;
}
