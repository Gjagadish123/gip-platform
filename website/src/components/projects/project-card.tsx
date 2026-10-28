import { MapPin } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";

import { StatusChip } from "@/components/site/typography";
import { Arrow, Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import { isExternal, STATUS_LABEL, type ProjectCardData } from "./cards";
import { LayoutDrawing } from "./layout-drawing";

export type { ProjectCardData } from "./cards";

// Images from a local Supabase stack (127.0.0.1) can't go through the optimizer; hosted storage can.
const isLocal = (src: string) => /^https?:\/\/(127\.0\.0\.1|localhost)[:/]/.test(src);
const COLS = ["grid-cols-1", "grid-cols-1", "grid-cols-2", "grid-cols-3"] as const; // by fact count

/**
 * One project in the grid, the "editorial frame" (the client's pick, 2026-10-26): the real photograph (or a drawn
 * layout) inset in a light card with its status, the name, the place, the facts as a spec row on hairlines, and a
 * full-width action when there is somewhere to go (View project, Visit website). Hover: the card lifts, a teal rule
 * draws along its top and the picture eases in. The action covers the whole card (one target, one name).
 */
export function ProjectCard({ card, priority }: { card: ProjectCardData; priority?: boolean }) {
  return (
    <article className="group/card relative flex h-full flex-col rounded-2xl border border-line bg-white p-2.5 transition-[translate,box-shadow,border-color] duration-500 ease-(--ease-out) hover:-translate-y-1 hover:border-line-strong hover:shadow-raise focus-within:border-line-strong motion-reduce:hover:translate-y-0">
      <div aria-hidden className="absolute inset-x-6 top-0 h-0.5 origin-left scale-x-0 bg-teal transition-transform duration-500 ease-(--ease-out) group-hover/card:scale-x-100" />
      <div className="relative aspect-[16/11] overflow-hidden rounded-[14px] bg-mist">
        {card.photo ? (
          <Image
            src={card.photo.src}
            alt={card.photo.alt}
            fill
            priority={priority}
            unoptimized={isLocal(card.photo.src)}
            sizes="(min-width: 1280px) 400px, (min-width: 1024px) 31vw, (min-width: 640px) 46vw, 100vw"
            className="object-cover transition-transform duration-[900ms] ease-(--ease-out) group-hover/card:scale-[1.06] motion-reduce:group-hover/card:scale-100"
          />
        ) : (
          <LayoutDrawing
            seed={card.key}
            className="transition-transform duration-[900ms] ease-(--ease-out) group-hover/card:scale-[1.04] motion-reduce:group-hover/card:scale-100"
          />
        )}
        <div className="absolute top-3 left-3">
          {card.status === "selling" ? (
            <StatusChip>{STATUS_LABEL.selling}</StatusChip>
          ) : (
            <StatusChip tone="plain" className="bg-white">{STATUS_LABEL[card.status]}</StatusChip>
          )}
        </div>
      </div>

      <div className="flex flex-1 flex-col px-3.5 pt-5 pb-3.5">
        <h3 className="text-h3 text-navy">{card.name}</h3>
        <p className="mt-1.5 flex items-center gap-1.5 text-small text-muted">
          <MapPin aria-hidden className="size-4 shrink-0 text-teal-deep" /> {card.place}
        </p>
        {card.facts.length ? (
          <dl className={cn("mt-5 grid divide-x divide-line border-y border-line", COLS[Math.min(card.facts.length, 3)])}>
            {card.facts.map((f) => (
              <div key={f.label} className="flex min-w-0 flex-col px-3 py-3.5 first:pl-0 last:pr-0">
                <dt className="text-label text-muted">{f.label}</dt>
                <dd className="mt-1 text-ui font-medium text-pretty text-navy tabular-nums">{f.value}</dd>
              </div>
            ))}
          </dl>
        ) : (
          <div className="mt-5 border-t border-line" />
        )}
        {card.href ? (
          <div className="mt-auto pt-5">
            <Button asChild variant="primary" className="w-full justify-between">
              <CardLink card={card}>
                {card.action ?? (isExternal(card.href) ? "Visit website" : "View project")} <Arrow />
              </CardLink>
            </Button>
          </div>
        ) : null}
      </div>
    </article>
  );
}

/** The card's one link; its ::after covers the card so the whole card is the click target. */
function CardLink({ card, className, children }: { card: ProjectCardData; className?: string; children: ReactNode }) {
  const cover = cn("after:absolute after:inset-0 after:rounded-2xl after:content-['']", className);
  return isExternal(card.href!) ? (
    <a href={card.href} target="_blank" rel="noreferrer" aria-label={`${card.action ? `${card.action}: ${card.name}` : `Visit the ${card.name} website`} (opens in a new tab)`} className={cover}>
      {children}
    </a>
  ) : (
    <Link href={card.href!} aria-label={card.action ? `${card.action}: ${card.name}` : `View ${card.name}`} className={cover}>
      {children}
    </Link>
  );
}
