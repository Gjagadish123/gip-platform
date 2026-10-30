import { cn } from "@/lib/utils";

/**
 * The plain white ground behind a light section (the host needs `relative isolate`). The sections that slide or pin
 * over others (About's sheet, the sticky Legacy and Recent projects stages) need it to stay opaque.
 */
export function Backdrop({ className }: { className?: string }) {
  return <div aria-hidden className={cn("pointer-events-none absolute inset-0 -z-10 bg-white", className)} />;
}
