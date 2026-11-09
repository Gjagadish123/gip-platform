import { CircleCheck } from "lucide-react";

import { Choreo } from "@/components/motion/choreo";
import { Container } from "@/components/site/container";
import { SectionChip } from "@/components/site/typography";
import { PROMISE } from "@/lib/home";

import { PromiseLight } from "./promise-light";

/**
 * Our Promise in the old site's layout on a grained GIP-navy band: on the left the chip, "Why Choose Greater Infra
 * Projects" (its letters rise), the line and a short teal rule, centred against the cards; on the right the four
 * promises as stacked glass cards, each with a teal check, its title and description. Desktop: a soft teal glow trails
 * the pointer across the band and a hovered card's border turns teal. Phones: the heading block, then the cards.
 * Reduced motion: no glow, nothing moves.
 */
export function OurPromise() {
  return (
    <Choreo as="section" aria-labelledby="promise-title" className="on-navy grain relative overflow-clip bg-brand py-24 lg:py-32">
      <PromiseLight />
      <Container className="relative grid gap-12 lg:grid-cols-12 lg:items-center lg:gap-14">
        <div className="lg:col-span-5">
          <div data-anim="fade-up">
            <SectionChip tone="dark">{PROMISE.label}</SectionChip>
          </div>
          <h2 id="promise-title" data-anim="chars" className="mt-7 text-h2 text-white">
            {PROMISE.title}
          </h2>
          <p data-anim="lines" className="mt-6 max-w-[46ch] text-lede text-text">
            {PROMISE.lede}
          </p>
          <span aria-hidden data-anim="line-x" className="mt-8 block h-0.5 w-16 bg-teal" />
        </div>

        <ul className="grid gap-4 lg:col-span-7 lg:gap-5">
          {PROMISE.items.map((p) => (
            <li
              key={p.title}
              data-anim="fade-up"
              className="flex gap-4 rounded-2xl border border-white/15 bg-white/[0.04] p-6 transition-colors duration-500 ease-(--ease-out) lg:p-7 lg:pointer-fine:hover:border-teal/60"
            >
              <CircleCheck aria-hidden className="mt-0.5 size-6 shrink-0 text-teal" strokeWidth={1.75} />
              <div>
                <h3 className="text-h3 text-white">{p.title}</h3>
                <p className="mt-2 text-body text-on-navy-2">{p.description}</p>
              </div>
            </li>
          ))}
        </ul>
      </Container>
    </Choreo>
  );
}
