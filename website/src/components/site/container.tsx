import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

/** 1280 px of content inside 20 / 32 px page gutters. */
export function Container({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn("mx-auto w-full max-w-[1344px] px-5 sm:px-8", className)}>{children}</div>;
}
