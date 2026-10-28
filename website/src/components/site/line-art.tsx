import { withBase } from "@/lib/base-path";
import { cn } from "@/lib/utils";

/**
 * One of the old site's animated line illustrations (public/illustrations/<name>.webp). A plain <img> keeps it moving
 * (next/image would freeze it); visitors who ask for reduced motion get the still last frame (<name>-still.webp).
 */
export function LineArt({ name, className }: { name: string; className?: string }) {
  return (
    <picture className="contents">
      <source media="(prefers-reduced-motion: reduce)" srcSet={withBase(`/illustrations/${name}-still.webp`)} />
      <img src={withBase(`/illustrations/${name}.webp`)} alt="" width={480} height={480} loading="lazy" decoding="async" className={cn(className)} />
    </picture>
  );
}
