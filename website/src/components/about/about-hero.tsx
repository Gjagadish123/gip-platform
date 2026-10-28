import { anniversaryCollage, avenueRoad, hillsDusk } from "@/assets/images";
import { Container } from "@/components/site/container";
import { Plate } from "@/components/site/plate";
import { Section } from "@/components/site/section";
import { Lede } from "@/components/site/typography";
import { formatNumber } from "@/lib/format";
import { BRAND_STORY, PROMISES, STATS } from "@/lib/site";

const [years, projects, acres, customers] = STATS;

/**
 * The H1 with the company in two short paragraphs beside it, then a layered pair: the wide avenue render, with the
 * anniversary photograph lifted over its bottom-right corner on a white mat (stacked on phones).
 */
export function AboutHero() {
  return (
    <section aria-labelledby="about-title" className="pt-32 lg:pt-44">
      <Container>
        <div className="grid gap-8 lg:grid-cols-12 lg:items-end lg:gap-8">
          <h1 id="about-title" className="max-w-[20ch] text-display lg:col-span-8">
            Building trust plot by plot, with clarity and care.
          </h1>
          <div className="max-w-[48ch] space-y-4 text-lede text-text lg:col-span-4">
            <p>
              In {years.value}
              {years.suffix} years we have developed {projects.value}
              {projects.suffix} projects across {acres.value}
              {acres.suffix} acres, for more than {formatNumber(customers.value)} customers who chose land with clear
              titles and approved layouts.
            </p>
          </div>
        </div>

        <div className="mt-12 lg:mt-20">
          <Plate
            src={avenueRoad}
            alt="Artist's impression: a tree-lined CC avenue with LED street lights through a plotted layout"
            impression
            preload
            sizes="(min-width: 1344px) 1280px, 100vw"
            position="50% 60%"
            className="aspect-[4/3] sm:aspect-[16/9] lg:aspect-[21/9]"
          />
          {/* -mt in %: relative to the row's width, so the overlap scales with the wide picture. */}
          <div className="relative mt-6 sm:w-2/3 lg:-mt-[12%] lg:mr-10 lg:ml-auto lg:w-[34%]">
            <Plate
              src={anniversaryCollage}
              alt="Photographs from the Greater Infra Projects 9th-anniversary celebration"
              caption="Our 9th-anniversary celebration"
              sizes="(min-width: 1024px) 440px, (min-width: 640px) 66vw, 100vw"
              className="aspect-[2/1] lg:border-6 lg:border-white lg:shadow-raise"
            />
          </div>
        </div>
      </Container>
    </section>
  );
}

/** Sticky split: the dusk render holds on the left while the philosophy and the way GIP does business read on the right. */
export function Philosophy() {
  return (
    <Section aria-labelledby="philosophy-title">
      <Container className="grid gap-12 lg:grid-cols-12 lg:gap-8">
        <div className="lg:sticky lg:top-32 lg:col-span-5 lg:self-start">
          <Plate
            src={hillsDusk}
            alt="Artist's impression: a lit plotted layout below the hills at dusk"
            impression
            sizes="(min-width: 1344px) 520px, (min-width: 1024px) 40vw, 100vw"
            position="60% 50%"
            className="aspect-[4/5]"
          />
        </div>
        <div className="lg:col-span-6 lg:col-start-7 lg:pt-10">
          <h2 id="philosophy-title" className="text-h2">
            Our philosophy
          </h2>
          <Lede className="mt-6 max-w-[56ch]">{BRAND_STORY.p1}</Lede>
          <h3 className="mt-14 text-h3">Doing business the right way</h3>
          <div className="mt-4 max-w-[62ch] space-y-4 text-body text-text">
            <p>{BRAND_STORY.p2}</p>
            <p>{PROMISES.lede}</p>
          </div>
        </div>
      </Container>
    </Section>
  );
}
