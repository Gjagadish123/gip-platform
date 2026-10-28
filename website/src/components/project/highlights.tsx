import type { LucideIcon } from "lucide-react";

import { Container } from "@/components/site/container";
import { Reveal } from "@/components/site/reveal";
import { Section } from "@/components/site/section";

/** Key highlights: the heading holds on the left while the facts run as a two-column ledger on hairlines. */
export function Highlights({ items }: { items: { icon: LucideIcon; value: string; label: string }[] }) {
  return (
    <Section id="highlights" aria-labelledby="highlights-title">
      <Container className="lg:grid lg:grid-cols-12 lg:gap-x-10">
        <div className="lg:col-span-4">
          <h2 id="highlights-title" className="max-w-[14ch] text-h2 lg:sticky lg:top-40">
            Land that&rsquo;s ready to build on.
          </h2>
        </div>
        <Reveal className="mt-10 lg:col-span-8 lg:mt-0">
          <ul className="grid border-t border-line sm:grid-cols-2">
            {items.map(({ icon: Icon, value, label }) => (
              <li key={value} className="flex gap-4 border-b border-line py-6 sm:odd:pr-8 sm:even:pl-8 lg:py-7">
                <Icon aria-hidden className="mt-1 size-5 shrink-0 text-navy-soft" />
                <div className="min-w-0">
                  <p className="text-h3 break-words text-navy">{value}</p>
                  <p className="mt-1 text-small break-words text-muted">{label}</p>
                </div>
              </li>
            ))}
          </ul>
        </Reveal>
      </Container>
    </Section>
  );
}
