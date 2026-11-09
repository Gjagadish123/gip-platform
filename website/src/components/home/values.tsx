import { Choreo } from "@/components/motion/choreo";
import { Container } from "@/components/site/container";
import { LineArt } from "@/components/site/line-art";
import { SectionChip } from "@/components/site/typography";
import { HOME_VALUES } from "@/lib/home";

/**
 * Our Values in the old site's layout on the mist band: the chip, "Our Values" (its letters rise) and the line,
 * centred, then the three values as white cards side by side, each with its drawing (in its own live colours), title
 * and text, centred, rising in turn. Below desktop the cards stack. Reduced motion: still drawings, nothing moves.
 */
export function Values() {
  return (
    <Choreo as="section" aria-labelledby="values-title" className="bg-mist py-24 lg:py-32">
      <Container>
        <div className="mx-auto flex max-w-[56ch] flex-col items-center text-center">
          <div data-anim="fade-up">
            <SectionChip>{HOME_VALUES.label}</SectionChip>
          </div>
          <h2 id="values-title" data-anim="chars" className="mt-7 text-h2 text-navy">
            {HOME_VALUES.title}
          </h2>
          <p data-anim="lines" className="mt-6 text-lede text-text">
            {HOME_VALUES.lede}
          </p>
        </div>

        <ul className="mx-auto mt-14 grid max-w-xl gap-5 lg:mt-16 lg:max-w-none lg:grid-cols-3 lg:gap-6">
          {HOME_VALUES.items.map((v, i) => (
            <li
              key={v.title}
              data-anim="fade-up"
              data-delay={String(i * 0.1)}
              className="flex flex-col items-center rounded-2xl border border-line bg-white px-7 py-10 text-center shadow-raise lg:px-8 lg:py-12"
            >
              {/* brightness lifts the Enduring Excellence drawing's off-white ground (255,255,251) to the card's white. */}
              <LineArt name={v.art} className="h-40 w-auto object-contain mix-blend-multiply brightness-[1.02]" />
              <h3 className="mt-8 text-h3 text-navy">{v.title}</h3>
              <p className="mt-3 max-w-[36ch] text-body text-text">{v.text}</p>
            </li>
          ))}
        </ul>
      </Container>
    </Choreo>
  );
}
