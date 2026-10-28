import { clubhousePool } from "@/assets/images";
import { Container } from "@/components/site/container";
import { Plate } from "@/components/site/plate";
import { Reveal } from "@/components/site/reveal";
import { Section } from "@/components/site/section";

import { FeatureRows } from "./parts";

/** The clubhouse: heading and one paragraph, the pool render large, and its four features on a panel over its corner. */
export function Clubhouse({ parkArea }: { parkArea?: string }) {
  return (
    <Section id="clubhouse" rhythm="secondary" aria-labelledby="clubhouse-title">
      <Container>
        <div className="grid gap-5 lg:grid-cols-12 lg:items-end lg:gap-x-10">
          <h2 id="clubhouse-title" className="text-h2 lg:col-span-6">
            The clubhouse
          </h2>
          <p className="max-w-[52ch] text-body text-text lg:col-span-5 lg:col-start-8">
            A clubhouse with a swimming pool and a community hall sits inside the layout, beside its parks, the children&rsquo;s
            play area and the cycle track.
          </p>
        </div>
        <Reveal className="relative mt-10 lg:mt-14 lg:pb-16">
          <Plate
            src={clubhousePool}
            alt="Artist's impression of a clubhouse with a swimming pool and lawns"
            impression
            sizes="(min-width: 1024px) 1070px, 100vw"
            className="aspect-[4/3] lg:aspect-[16/9] lg:w-5/6"
          />
          <div className="mt-8 lg:absolute lg:right-0 lg:bottom-0 lg:mt-0 lg:w-[400px] lg:rounded-lg lg:border lg:border-line lg:bg-white lg:p-8 lg:shadow-raise">
            <FeatureRows
              items={[
                { title: "Swimming pool", text: "Part of the clubhouse block in the approved master plan." },
                { title: "Community hall", text: "Room for family functions and residents' gatherings." },
                { title: "Children's park & cycle track", text: "Play space and a cycle track within the layout's green areas." },
                {
                  title: "Landscaped parks",
                  text: parkArea
                    ? `${parkArea} of park area in the approved land use, with avenue plantation on the roads.`
                    : "Parks and avenue plantation across the layout.",
                },
              ]}
            />
          </div>
        </Reveal>
      </Container>
    </Section>
  );
}
