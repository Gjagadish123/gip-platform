"use client";

import { motion, useMotionTemplate, useReducedMotion, useScroll, useTransform } from "motion/react";
import { useRef } from "react";

import { gcviArch } from "@/assets/images";
import { Plate } from "@/components/site/plate";

/** The brochure's arch design, wide: its frame opens from a 6 % inset to full as it scrolls in. Reduced motion: open. */
export function ArchPicture() {
  const ref = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "center center"] });
  const inset = useTransform(scrollYProgress, [0, 1], [6, 0]);
  const clipPath = useMotionTemplate`inset(${inset}% ${inset}% ${inset}% ${inset}% round 14px)`;

  return (
    <motion.div ref={ref} className="relative" style={reduced ? undefined : { clipPath }}>
      <Plate
        src={gcviArch}
        alt="Artist's impression of the Global City VI entrance arch, from the project brochure"
        impression
        sizes="(min-width: 1344px) 1280px, 100vw"
        className="aspect-[16/9] sm:aspect-[2000/593]"
      />
    </motion.div>
  );
}
