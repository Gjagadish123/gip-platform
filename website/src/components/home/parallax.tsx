"use client";

import { motion, useScroll, useTransform } from "motion/react";
import Image, { type StaticImageData } from "next/image";
import { useRef, type ReactNode } from "react";

import { cn } from "@/lib/utils";

import { usePrefersReducedMotion } from "./hooks";

/**
 * A picture that drifts inside its frame as the page scrolls (the frame stays put, the image moves slower than the
 * page). Reduced motion: still.
 */
export function ParallaxImage({
  src,
  alt,
  sizes,
  className,
  position,
  children,
}: {
  src: StaticImageData | string;
  alt: string;
  sizes: string;
  className?: string;
  position?: string;
  children?: ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const reduced = usePrefersReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const y = useTransform(scrollYProgress, [0, 1], ["-7%", "7%"]);

  return (
    <div ref={ref} className={cn("relative overflow-hidden bg-mist", className)}>
      <motion.div className="absolute -inset-y-[9%] inset-x-0" style={reduced ? undefined : { y }}>
        <Image src={src} alt={alt} fill sizes={sizes} className="object-cover" style={position ? { objectPosition: position } : undefined} />
      </motion.div>
      {children}
    </div>
  );
}

/**
 * A wide panel that grows to its full width as it scrolls into view (90 % → 100 %), for the home films. Reduced
 * motion: full width from the start.
 */
export function ScrollGrow({ children, className, from = 0.9 }: { children: ReactNode; className?: string; from?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const reduced = usePrefersReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "start 0.25"] });
  const scale = useTransform(scrollYProgress, [0, 1], [from, 1]);

  return (
    <motion.div ref={ref} style={reduced ? undefined : { scale }} className={cn("relative origin-bottom overflow-hidden", className)}>
      {children}
    </motion.div>
  );
}
