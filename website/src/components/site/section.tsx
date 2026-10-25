import type { ElementType, ReactNode } from "react";

import { cn } from "@/lib/utils";

export type SectionTone = "white" | "mist" | "navy";
export type SectionRhythm = "primary" | "secondary" | "none";

const TONE: Record<SectionTone, string> = {
  white: "bg-canvas",
  mist: "bg-mist",
  navy: "on-navy bg-navy-deep",
};

// 96 / 144 px between primary sections, 80 / 112 for secondary ones (phone / desktop).
const RHYTHM: Record<SectionRhythm, string> = {
  primary: "py-24 lg:py-36",
  secondary: "py-20 lg:py-28",
  none: "",
};

export function Section({
  children,
  tone = "white",
  rhythm = "primary",
  id,
  className,
  as: Tag = "section",
  ...rest
}: {
  children: ReactNode;
  tone?: SectionTone;
  rhythm?: SectionRhythm;
  id?: string;
  className?: string;
  as?: ElementType;
  "aria-labelledby"?: string;
  "aria-label"?: string;
}) {
  return (
    <Tag id={id} className={cn("relative", TONE[tone], RHYTHM[rhythm], className)} {...rest}>
      {children}
    </Tag>
  );
}
