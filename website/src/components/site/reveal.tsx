"use client";

import { motion, useReducedMotion } from "motion/react";
import { Children, isValidElement, type ReactNode } from "react";

const EASE = [0.16, 1, 0.3, 1] as const;

const TAGS = { div: motion.div, section: motion.section, li: motion.li, figure: motion.figure, span: motion.span } as const;

/**
 * Scroll reveal for server-rendered children: opacity 0 → 1, y 14 → 0, 700 ms, once. Used sparingly (a block that
 * arrives, not every heading), never above the fold.
 */
export function Reveal({
  children,
  delay = 0,
  className,
  as = "div",
  amount = 0.2,
}: {
  children: ReactNode;
  delay?: number;
  className?: string;
  as?: keyof typeof TAGS;
  amount?: number;
}) {
  const M = TAGS[as];
  const reduced = useReducedMotion();
  if (reduced) return <M className={className}>{children}</M>;
  return (
    <M
      className={className}
      initial={{ opacity: 0, y: 14 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount, margin: "0px 0px -8% 0px" }}
      transition={{ duration: 0.7, delay, ease: EASE }}
    >
      {children}
    </M>
  );
}

/** Staggers direct children by 70 ms (the seventh and later arrive with the sixth). */
export function RevealGroup({
  children,
  className,
  as = "div",
  item = "div",
  stagger = 0.07,
}: {
  children: ReactNode;
  className?: string;
  as?: keyof typeof TAGS;
  item?: keyof typeof TAGS;
  stagger?: number;
}) {
  const M = TAGS[as];
  return (
    <M className={className}>
      {Children.toArray(children).map((child, i) => (
        <Reveal key={isValidElement(child) && child.key != null ? child.key : i} delay={Math.min(i, 5) * stagger} as={item}>
          {child}
        </Reveal>
      ))}
    </M>
  );
}
