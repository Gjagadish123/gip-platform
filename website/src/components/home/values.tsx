import { Choreo } from "@/components/motion/choreo";
import { Aurora } from "@/components/site/aurora";
import { Container } from "@/components/site/container";
import { LineArt } from "@/components/site/line-art";
import { SectionChip } from "@/components/site/typography";
import { HOME_VALUES } from "@/lib/home";
import { cn } from "@/lib/utils";

import { ValuesSwitch } from "./values-switch";

/**
 * Our Values on a soft teal band, as a sticky split. Desktop: on the left, held under the header, the chip, "Our
 * Values" (its letters rise), a short teal rule, the line (rising line by line) and one large drawing on the band; on
 * the right the three values as tall rows on drawn hairlines, each with its teal-deep number, title and text. The row
 * crossing the middle of the screen is at full strength while the others dim, and the drawing (navy and teal on the
 * band) crossfades to that value's (ValuesSwitch).
 * Phones and tablets: the header, then compact rows on hairlines, each with its small drawing above (phones) or beside
 * (tablets) its number, title and text, rising in; no dimming. Reduced motion: no switch and no large drawing; every
 * row at full strength with its own small drawing, nothing moves.
 */
export function Values() {
  return (
    <Choreo as="section" aria-labelledby="values-title" className="relative isolate py-28 lg:py-44">
      <Aurora scene="d" />
      <Container>
        <ValuesSwitch className="grid gap-12 lg:grid-cols-12 lg:gap-14">
          {/* Capped to the screen under the header so on short laptops the well shrinks instead of hanging below the fold. */}
          <div className="lg:sticky lg:top-28 lg:col-span-5 lg:flex lg:max-h-[calc(100svh-8.5rem)] lg:flex-col lg:self-start">
            <div data-anim="fade-up">
              <SectionChip>{HOME_VALUES.label}</SectionChip>
            </div>
            <h2 id="values-title" data-anim="chars" className="mt-7 text-title">
              {HOME_VALUES.title}
            </h2>
            <span aria-hidden data-anim="line-x" className="mt-8 block h-0.5 w-16 bg-teal" />
            <p data-anim="lines" className="mt-8 max-w-[44ch] text-lede text-text">
              {HOME_VALUES.lede}
            </p>
            {/* The drawing on a white tile, in its own live colours. */}
            <div aria-hidden data-anim="fade-up" data-delay="0.2" className="relative mt-10 hidden aspect-[4/3] max-h-[38svh] min-h-0 rounded-2xl bg-white shadow-raise motion-safe:lg:block">
              {HOME_VALUES.items.map((v, i) => (
                <span key={v.art} data-art className={cn("absolute inset-6 mix-blend-multiply", i > 0 && "opacity-0")}>
                  <LineArt name={v.art} className="size-full object-contain object-left" />
                </span>
              ))}
            </div>
          </div>

          <div className="lg:col-span-7">
            <ol>
              {HOME_VALUES.items.map((v, i) => (
                <li
                  key={v.title}
                  data-row
                  className="relative grid gap-5 py-10 md:grid-cols-[9rem_1fr] md:gap-x-10 lg:py-14 motion-safe:lg:flex motion-safe:lg:min-h-[65svh] motion-safe:lg:flex-col motion-safe:lg:justify-center"
                >
                  <span aria-hidden data-anim="line-x" className="absolute inset-x-0 top-0 h-px bg-line-strong" />
                  <div aria-hidden data-anim="fade-up" className="h-24 w-32 rounded-lg bg-white p-2 shadow-raise md:h-28 md:w-36 motion-safe:lg:hidden">
                    <LineArt name={v.art} className="size-full object-contain object-left mix-blend-multiply" />
                  </div>
                  <div data-anim="fade-up" data-delay="0.1">
                    <span aria-hidden className="block text-label text-teal-deep tabular-nums">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <h3 className="mt-4 text-h3 text-navy lg:mt-5 lg:text-h2">{v.title}</h3>
                    <p className="mt-3 max-w-[48ch] text-body text-text lg:mt-5 lg:text-lede">{v.text}</p>
                  </div>
                </li>
              ))}
            </ol>
            <span aria-hidden data-anim="line-x" className="block h-px bg-line-strong" />
          </div>
        </ValuesSwitch>
      </Container>
    </Choreo>
  );
}
