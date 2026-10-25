import Link from "next/link";
import type { ReactNode } from "react";

import { Arrow } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/**
 * An inline action: medium navy text whose underline draws in on hover, with the sliding arrow. External, tel:, mailto:
 * and download links render a plain anchor.
 */
export function TextLink({
  href,
  children,
  className,
  external,
  download,
  arrow = true,
}: {
  href: string;
  children: ReactNode;
  className?: string;
  external?: boolean;
  download?: boolean;
  arrow?: boolean;
}) {
  const cls = cn("group/link inline-flex items-center gap-2 font-medium text-navy-soft transition-colors hover:text-navy", className);
  const inner = (
    <>
      <span className="link-draw">{children}</span>
      {arrow ? <Arrow /> : null}
    </>
  );
  if (external || download || /^(https?:|tel:|mailto:|#)/.test(href)) {
    return (
      <a href={href} className={cls} target={external ? "_blank" : undefined} rel={external ? "noreferrer" : undefined} download={download}>
        {inner}
      </a>
    );
  }
  return (
    <Link href={href} className={cls}>
      {inner}
    </Link>
  );
}
