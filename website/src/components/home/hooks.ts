"use client";

import { useSyncExternalStore } from "react";

const QUERY = "(prefers-reduced-motion: reduce)";
const subscribeMotion = (cb: () => void) => {
  const mq = window.matchMedia(QUERY);
  mq.addEventListener("change", cb);
  return () => mq.removeEventListener("change", cb);
};

/** Reduced-motion preference; false during server render and hydration, then the real value. */
export function usePrefersReducedMotion() {
  return useSyncExternalStore(subscribeMotion, () => window.matchMedia(QUERY).matches, () => false);
}
