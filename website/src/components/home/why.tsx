import { Choreo } from "@/components/motion/choreo";
import { Aurora } from "@/components/site/aurora";
import { Container } from "@/components/site/container";
import { LineArt } from "@/components/site/line-art";
import { SectionChip } from "@/components/site/typography";
import { WHY } from "@/lib/home";

import { WhyFilm } from "./why-film";

/**
 * Why Choose Us, as on the live home. The heading's letters rise, the line under it rises line by line, then the three
 * reasons stand in columns: a rule draws across their top, hairlines draw down between them, and each column (teal-deep
 * index, line drawing, title, text) rises in turn; a drawing lifts when its column is hovered. The live home's aerial film
 * follows in a frame that morphs with the scroll from a pill to the full frame, centred and capped on desktop
 * (WhyFilm). Phones and tablets (below lg): the reasons stack between drawn rules with smaller drawings. Reduced
 * motion: everything as written, the film frame open.
 */
export function Why() {
  return (
    <Choreo as="section" aria-labelledby="why-title" className="relative isolate py-28 lg:py-44">
      <Aurora scene="f" />
      <Container>
        <div data-anim="fade-up">
          <SectionChip>{WHY.label}</SectionChip>
        </div>
        <h2 id="why-title" data-anim="chars" className="mt-7 max-w-[18ch] text-title">
          {WHY.title}
        </h2>
        <p data-anim="lines" data-delay="0.15" className="mt-6 max-w-[44ch] text-lede text-text lg:mt-8">
          {WHY.sub}
        </p>

        <div className="relative mt-16 lg:mt-24">
          <span aria-hidden data-anim="line-x" className="absolute inset-x-0 top-0 h-px bg-line-strong" />
          <ul className="grid lg:grid-cols-3">
            {WHY.items.map((w, i) => (
              <li key={w.title} className="group/w relative py-10 lg:px-12 lg:py-14 lg:first:pl-0 lg:last:pr-0">
                {i > 0 ? (
                  <>
                    <span aria-hidden data-anim="line-x" className="absolute inset-x-0 top-0 h-px bg-line lg:hidden" />
                    <span aria-hidden data-anim="line-y" data-delay={0.25 * i} className="absolute inset-y-0 left-0 hidden w-px bg-line lg:block" />
                  </>
                ) : null}
                <div data-anim="stagger" data-delay={0.12 * i}>
                  <span aria-hidden className="block text-label text-teal-deep tabular-nums">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <div className="mt-6 flex h-24 items-center lg:h-48">
                    <LineArt
                      name={w.art}
                      className="h-full w-auto mix-blend-multiply transition-transform duration-700 ease-(--ease-out) group-hover/w:-translate-y-2"
                    />
                  </div>
                  <h3 className="mt-8 text-h3">{w.title}</h3>
                  <p className="mt-3 max-w-[36ch] text-body text-text">{w.description}</p>
                </div>
              </li>
            ))}
          </ul>
          <span aria-hidden data-anim="line-x" data-from="right" className="absolute inset-x-0 bottom-0 h-px bg-line-strong" />
        </div>

        <WhyFilm />
      </Container>
    </Choreo>
  );
}
