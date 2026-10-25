import { withBase } from "@/lib/base-path";
import { COMPANY } from "@/lib/constants";
import { cn } from "@/lib/utils";

/** Brand lockup (349×156 viewBox) or the roof mark (238×96). Plain <img>: SVGs need no optimiser. */
export function Logo({
  variant = "navy",
  mark = false,
  className,
  width,
}: {
  variant?: "navy" | "white";
  mark?: boolean;
  className?: string;
  width?: number;
}) {
  const file = mark ? `gip-roof-${variant}.svg` : `gip-lockup-${variant}.svg`;
  const w = width ?? (mark ? 48 : 134);
  const h = mark ? Math.round((w * 96) / 238) : Math.round((w * 156) / 349);
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={withBase(`/brand/${file}`)}
      alt={mark ? "" : COMPANY.name}
      aria-hidden={mark || undefined}
      width={w}
      height={h}
      className={cn("block h-auto", className)}
      decoding="async"
      loading={mark ? "lazy" : "eager"}
    />
  );
}
