import Image, { type StaticImageData } from "next/image";
import type { ReactNode } from "react";

import { withBase } from "@/lib/base-path";
import { cn } from "@/lib/utils";

/** The note every artist's impression carries. The alt text already says it. */
export function ImpressionChip({ className }: { className?: string }) {
  return (
    <span aria-hidden className={cn("chip-impression", className)}>
      Artist&rsquo;s impression
    </span>
  );
}

/**
 * A picture in a 14 px frame: the image covers, renders carry the impression note, photos may take a caption.
 * `className` sizes the frame (aspect or height). Local images: pass the static import. Remote: pass the URL string.
 */
export function Plate({
  src,
  alt,
  impression,
  caption,
  sizes = "(min-width: 1024px) 50vw, 100vw",
  preload,
  position,
  className,
  imgClassName,
  rounded = true,
  children,
}: {
  src: StaticImageData | string;
  alt: string;
  impression?: boolean;
  caption?: ReactNode;
  sizes?: string;
  preload?: boolean;
  position?: string;
  className?: string;
  imgClassName?: string;
  rounded?: boolean;
  children?: ReactNode;
}) {
  const source = typeof src === "string" && src.startsWith("/") ? withBase(src) : src;
  return (
    <figure className="m-0">
      <div className={cn("relative overflow-hidden bg-mist", rounded && "rounded-lg", className)}>
        <Image
          src={source}
          alt={alt}
          fill
          sizes={sizes}
          preload={preload}
          fetchPriority={preload ? "high" : undefined}
          loading={preload ? "eager" : "lazy"}
          className={cn("object-cover", imgClassName)}
          style={position ? { objectPosition: position } : undefined}
        />
        {impression ? <ImpressionChip /> : null}
        {children}
      </div>
      {caption ? <figcaption className="mt-3 text-small text-muted">{caption}</figcaption> : null}
    </figure>
  );
}
