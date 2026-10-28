import { Choreo } from "@/components/motion/choreo";
import { Container } from "@/components/site/container";
import { SectionChip } from "@/components/site/typography";
import { PROMISE } from "@/lib/home";

import { PromiseLight } from "./promise-light";

// Desktop pointer hover only: a row's hairline turns teal and its description brightens; nothing expands, nothing links.
const HOVER = "transition-colors duration-500 ease-(--ease-out)";

/**
 * Our Promise as a navy index on a grained GIP-navy band. "Why Choose Greater Infra Projects" at title size on the left
 * (its letters rise), the line on the right set to the heading's foot, then the four promises as full-width rows on
 * drawn hairlines: teal number, title and description. Desktop: a soft teal glow trails the pointer across the band;
 * on hover a row's hairline turns teal and its description brightens. Rows rise as they come into view. Phones: stacked
 * rows (number and title, the description under the title), no glow. Reduced motion: no glow, nothing moves.
 */
export function OurPromise() {
  return (
    <Choreo as="section" aria-labelledby="promise-title" className="on-navy grain relative overflow-clip bg-brand py-28 lg:py-44">
      <PromiseLight />
      <Container className="relative">
        <div className="grid gap-8 lg:grid-cols-12 lg:items-end lg:gap-14">
          <div className="lg:col-span-7">
            <div data-anim="fade-up">
              <SectionChip tone="dark">{PROMISE.label}</SectionChip>
            </div>
            <h2 id="promise-title" data-anim="chars" className="mt-7 text-title text-white">
              {PROMISE.title}
            </h2>
          </div>
          <p data-anim="lines" className="max-w-[46ch] text-lede text-text lg:col-span-5 lg:pb-1.5">
            {PROMISE.lede}
          </p>
        </div>

        <ol className="mt-16 lg:mt-28">
          {PROMISE.items.map((p, i) => (
            <li key={p.title} data-anim="fade-up" className="group relative">
              <span
                aria-hidden
                data-anim="line-x"
                className={`absolute inset-x-0 top-0 h-px bg-white/15 ${HOVER} lg:pointer-fine:group-hover:bg-teal/60`}
              />
              <div className="grid grid-cols-[2.25rem_1fr] gap-x-4 gap-y-3 py-9 lg:grid-cols-12 lg:items-baseline lg:gap-x-8 lg:py-12">
                <span aria-hidden className="text-label text-teal tabular-nums">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <h3 className="text-h2 text-white lg:col-span-5">{p.title}</h3>
                <p
                  className={`col-start-2 max-w-[52ch] text-lede text-on-navy-2 ${HOVER} lg:col-span-6 lg:col-start-auto lg:pointer-fine:group-hover:text-white/90`}
                >
                  {p.description}
                </p>
              </div>
            </li>
          ))}
        </ol>
        <span aria-hidden data-anim="line-x" className="block h-px bg-white/15" />
      </Container>
    </Choreo>
  );
}
