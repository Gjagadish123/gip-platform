import { Container } from "@/components/site/container";
import { LineArt } from "@/components/site/line-art";
import { Section } from "@/components/site/section";
import { Lede } from "@/components/site/typography";
import { VALUES } from "@/lib/site";

// The old site's own line drawings, one per value.
const ART: Record<string, string> = {
  Integrity: "integrity-transparency",
  Quality: "quality-craftsmanship",
  "Customer Focus": "customer-first-focus",
};

/** Three values as full-width rows on hairlines: the value large, its sentence, the drawing (desktop). Rows wash mist on hover. */
export function Values() {
  return (
    <Section rhythm="secondary" aria-labelledby="values-title">
      <Container>
        <div className="grid gap-6 lg:grid-cols-12 lg:items-end lg:gap-8">
          <h2 id="values-title" className="max-w-[18ch] text-h2 lg:col-span-7">
            Values that guide every decision
          </h2>
          <Lede className="max-w-[44ch] lg:col-span-4 lg:col-start-9">{VALUES.lede}</Lede>
        </div>
        <ul className="mt-14 border-t border-line lg:-mx-6 lg:mt-20">
          {VALUES.items.map((v) => (
            <li
              key={v.title}
              className="grid gap-4 border-b border-line py-8 transition-colors duration-300 ease-(--ease-out) hover:bg-mist lg:grid-cols-12 lg:items-center lg:gap-8 lg:px-6 lg:py-6"
            >
              <h3 className="text-h2 lg:col-span-4">{v.title}</h3>
              <p className="max-w-[52ch] text-body text-text lg:col-span-5">{v.description}</p>
              <div className="hidden lg:col-span-3 lg:flex lg:justify-end">
                <LineArt name={ART[v.title]} className="size-35 mix-blend-multiply" />
              </div>
            </li>
          ))}
        </ul>
      </Container>
    </Section>
  );
}
