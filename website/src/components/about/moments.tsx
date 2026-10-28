import { gcviLaunchCollage, gcviLaunchCollageWide } from "@/assets/images";
import gcviLaunchBoard from "@/assets/images/gcvi-launch-1.webp";
import { Container } from "@/components/site/container";
import { Plate } from "@/components/site/plate";
import { Reveal } from "@/components/site/reveal";
import { Section } from "@/components/site/section";
import { cn } from "@/lib/utils";

// Real photographs only. No dates: none are confirmed.
const MOMENTS = [
  {
    src: gcviLaunchCollageWide,
    alt: "Collage from the Global City VI launch on site: guests, the project board and the layout roads",
    title: "Global City VI launch",
    caption: "Launch day on site at Rudraram.",
  },
  {
    src: gcviLaunchBoard,
    alt: "The Global City VI board on site, showing the HMDA layout approval number",
    title: "On site",
    caption: "The project board with its HMDA layout approval number, at the launch.",
  },
  {
    src: gcviLaunchCollage,
    alt: "Guests on stage at the Greater Infra Projects 9th-anniversary celebration",
    title: "Our 9th anniversary",
    caption: "The 9th-anniversary celebration.",
  },
] as const;

/**
 * GIP's own event photographs, asymmetric: the launch large on the left, the other two stacked on the right. The right
 * pictures are 9:4 so the two stacks end level with the 4:3 picture beside them.
 */
export function Moments() {
  return (
    <Section rhythm="secondary" aria-labelledby="moments-title">
      <Container>
        <h2 id="moments-title" className="text-h2">
          Moments from our events
        </h2>
        <Reveal as="div" className="mt-10 lg:mt-14">
          <ul className="grid gap-10 lg:grid-cols-12 lg:gap-8">
            {MOMENTS.map((m, i) => (
              <li key={m.title} className={cn(i === 0 ? "lg:col-span-7 lg:row-span-2" : "lg:col-span-5 lg:col-start-8")}>
                <Plate
                  src={m.src}
                  alt={m.alt}
                  sizes={i === 0 ? "(min-width: 1024px) 740px, 100vw" : "(min-width: 1024px) 520px, 100vw"}
                  className={i === 0 ? "aspect-[4/3]" : "aspect-[4/3] lg:aspect-[9/4]"}
                />
                <h3 className="mt-4 text-ui font-semibold text-navy">{m.title}</h3>
                <p className="mt-1 text-small text-muted">{m.caption}</p>
              </li>
            ))}
          </ul>
        </Reveal>
      </Container>
    </Section>
  );
}
