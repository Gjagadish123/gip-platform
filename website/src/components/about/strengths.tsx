import { Headset, Landmark, MapPin, Route, ScrollText, Telescope, TrendingUp, Wallet, type LucideIcon } from "lucide-react";

import { Container } from "@/components/site/container";
import { Reveal } from "@/components/site/reveal";
import { Section } from "@/components/site/section";
import { Lede } from "@/components/site/typography";
import { STRENGTHS } from "@/lib/site";

// One icon per STRENGTHS item, in order.
const ICONS: LucideIcon[] = [TrendingUp, MapPin, Route, Headset, ScrollText, Landmark, Wallet, Telescope];

/** Sticky split on mist: "How we work" holds on the left while the eight strengths run as rows on the right. */
export function Strengths() {
  return (
    <Section tone="mist" aria-labelledby="strengths-title">
      <Container className="grid gap-12 lg:grid-cols-12 lg:gap-8">
        <div className="lg:sticky lg:top-32 lg:col-span-4 lg:self-start">
          <h2 id="strengths-title" className="text-h2">
            How we work
          </h2>
          <Lede className="mt-6 max-w-[38ch]">{STRENGTHS.lede}</Lede>
        </div>
        <Reveal as="div" className="lg:col-span-7 lg:col-start-6">
          <ul className="border-t border-line">
            {STRENGTHS.items.map((s, i) => {
              const Icon = ICONS[i] ?? TrendingUp;
              return (
                <li key={s.title} className="grid grid-cols-[auto_1fr] gap-x-5 border-b border-line py-7 lg:gap-x-8 lg:py-8">
                  <Icon aria-hidden className="mt-1 size-5.5 text-navy-soft" />
                  <div>
                    <h3 className="text-lede font-medium text-navy">{s.title}</h3>
                    <p className="mt-2 max-w-[60ch] text-body text-text">{s.description}</p>
                  </div>
                </li>
              );
            })}
          </ul>
        </Reveal>
      </Container>
    </Section>
  );
}
