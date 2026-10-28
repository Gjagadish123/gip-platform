import type { ReactNode } from "react";

import { Choreo } from "@/components/motion/choreo";
import { Aurora } from "@/components/site/aurora";
import { Container } from "@/components/site/container";

import { ProjectCard, type ProjectCardData } from "./project-card";

/**
 * A titled grid of project cards on its own aurora light: heading and lede on a split, then the cards, which rise in
 * turn as the grid enters (once; reduced motion shows them as they are).
 */
export function ProjectGrid({
  id,
  title,
  lede,
  cards,
  scene,
  priority,
}: {
  id: string;
  title: string;
  lede: ReactNode;
  cards: ProjectCardData[];
  scene: "a" | "b" | "c" | "d" | "e" | "f";
  priority?: boolean;
}) {
  if (!cards.length) return null;
  return (
    <Choreo as="section" id={id} aria-labelledby={`${id}-title`} className="relative isolate py-20 lg:py-28">
      <Aurora scene={scene} className="[mask-image:linear-gradient(to_bottom,transparent,black_18%,black_82%,transparent)]" />
      <Container>
        <div className="grid gap-5 lg:grid-cols-12 lg:items-end lg:gap-8">
          <h2 id={`${id}-title`} data-anim="lines" className="text-h2 lg:col-span-7">
            {title}
          </h2>
          <p className="max-w-[52ch] text-body text-text lg:col-span-5">{lede}</p>
        </div>
        <ul data-anim="stagger" className="mt-10 grid gap-6 sm:grid-cols-2 lg:mt-14 lg:grid-cols-3 lg:gap-8">
          {cards.map((card, i) => (
            <li key={card.key}>
              <ProjectCard card={card} priority={priority && i < 2} />
            </li>
          ))}
        </ul>
      </Container>
    </Choreo>
  );
}
