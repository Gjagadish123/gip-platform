"use client";

import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";

gsap.registerPlugin(useGSAP, ScrollTrigger, SplitText);

/** Motion runs only for visitors who have not asked for less; under reduced motion everything sits at its final state. */
export const MOTION_OK = "(prefers-reduced-motion: no-preference)";
/** Tailwind's lg breakpoint, in rem like the CSS so both switch together whatever the visitor's default font size. */
export const DESKTOP = "(min-width: 64rem)";
export const PHONE = "(max-width: 63.999rem)";
/** Desktop pointer: magnetic buttons, the context cursor. */
export const FINE_POINTER = "(hover: hover) and (pointer: fine)";

/** The site's ease (cubic-bezier(0.16, 1, 0.3, 1)) is close to expo.out; reveals use it, wipes use expo.inOut. */
export const EASE = "expo.out";

export { gsap, ScrollTrigger, SplitText, useGSAP };
