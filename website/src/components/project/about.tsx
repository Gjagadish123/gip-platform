import { Container } from "@/components/site/container";
import { Section } from "@/components/site/section";
import { TextLink } from "@/components/site/text-link";

import { ArchPicture } from "./arch";

/** About: the heading and a link hold on the left while the long copy reads on the right; then the arch design, wide. */
export function About({ intro, more }: { intro: string[]; more: string[] }) {
  const [lead, ...rest] = intro;
  return (
    <Section id="about" aria-labelledby="about-title" className="border-t border-line">
      <Container className="lg:grid lg:grid-cols-12 lg:gap-x-10">
        <div className="lg:col-span-4">
          <div className="lg:sticky lg:top-40">
            <h2 id="about-title" className="max-w-[14ch] text-h2">
              Plotted land on the Mumbai Highway
            </h2>
            <TextLink href="#plan" className="mt-6">
              See the master plan
            </TextLink>
          </div>
        </div>
        <div className="mt-10 max-w-[68ch] lg:col-span-7 lg:col-start-6 lg:mt-0">
          <p className="text-lede font-medium text-navy">{lead}</p>
          <div className="mt-6 space-y-6 text-body text-text">
            {rest.map((p) => (
              <p key={p}>{p}</p>
            ))}
          </div>
          <h3 className="mt-14 text-h3 lg:mt-16">Plan your weekend home, close to the city.</h3>
          <div className="mt-5 space-y-6 text-body text-text">
            {more.map((p) => (
              <p key={p}>{p}</p>
            ))}
          </div>
        </div>
      </Container>
      <Container className="mt-16 lg:mt-24">
        <ArchPicture />
      </Container>
    </Section>
  );
}
