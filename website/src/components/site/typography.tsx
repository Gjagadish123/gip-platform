import type { ElementType, ReactNode } from "react";

import { cn } from "@/lib/utils";

/** The paragraph that follows a heading: 18 → 20 px slate. */
export function Lede({ children, className, as: Tag = "p" }: { children: ReactNode; className?: string; as?: ElementType }) {
  return <Tag className={cn("text-lede text-text", className)}>{children}</Tag>;
}

/**
 * The small label the live site sets over each home section ("About us", "Key Principles"): a chip with a teal dot,
 * white with a hairline and navy text (`tone="light"`), or translucent white with white text on navy (`"dark"`).
 */
export function SectionChip({ children, tone = "light", className }: { children: ReactNode; tone?: "light" | "dark"; className?: string }) {
  return (
    <p
      className={cn(
        "inline-flex h-8 items-center gap-2 rounded-full border px-3.5 text-label",
        tone === "light" ? "border-line bg-white text-navy" : "border-white/20 bg-white/8 text-white",
        className,
      )}
    >
      <span aria-hidden className="size-1.5 rounded-full bg-teal" />
      {children}
    </p>
  );
}

/** A small status chip with a dot: "Ongoing", "Completed"; `go-navy` is the hairline version for navy surfaces. */
export function StatusChip({
  children,
  tone = "go",
  className,
}: {
  children: ReactNode;
  tone?: "go" | "go-navy" | "plain";
  className?: string;
}) {
  const dot = tone === "go" ? "bg-go" : tone === "go-navy" ? "bg-[#3ccf7e]" : "bg-navy/50";
  return (
    <span
      className={cn(
        "inline-flex h-7 items-center gap-2 rounded-full px-3 text-label",
        tone === "go" && "bg-go-soft text-go",
        tone === "go-navy" && "border border-white/20 text-on-navy-2",
        tone === "plain" && "bg-mist text-navy",
        className,
      )}
    >
      <span aria-hidden className={cn("relative size-1.5 rounded-full", dot)}>
        {tone === "plain" ? null : <span className={cn("absolute inset-0 rounded-full motion-safe:animate-ping", dot)} />}
      </span>
      {children}
    </span>
  );
}
