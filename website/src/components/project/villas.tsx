"use client";

import Image from "next/image";
import { useId, useState } from "react";

import { villaEast, villaWest } from "@/assets/images";
import { Container } from "@/components/site/container";
import { EnquireButton } from "@/components/site/enquire-button";
import { ImpressionChip } from "@/components/site/plate";
import { Section } from "@/components/site/section";
import type { InterestId } from "@/lib/enquiry";
import { cn } from "@/lib/utils";

import { FeatureRows, Segmented } from "./parts";

const DESIGNS = [
  { id: "east", label: "East-facing", src: villaEast, alt: "Artist's impression of the east-facing villa design from the Global City VI brochure" },
  { id: "west", label: "West-facing", src: villaWest, alt: "Artist's impression of the west-facing villa design from the Global City VI brochure" },
] as const;
type DesignId = (typeof DESIGNS)[number]["id"];

/** Villa designs: a segmented control crossfades the brochure's two elevations; the features and the ask beside them. */
export function VillaDesigns({ interest }: { interest: InterestId }) {
  const uid = useId();
  const [active, setActive] = useState<DesignId>("east");
  const tabId = (id: DesignId) => `${uid}-tab-${id}`;
  const panelId = `${uid}-panel`;

  return (
    <Section id="villas" rhythm="secondary" aria-labelledby="villas-title">
      <Container>
        <div className="grid gap-5 lg:grid-cols-12 lg:items-end lg:gap-x-10">
          <h2 id="villas-title" className="text-h2 lg:col-span-6">
            Villa designs
          </h2>
          <p className="max-w-[52ch] text-body text-text lg:col-span-5 lg:col-start-8">
            We undertake villa construction on request. The brochure carries two elevations drawn for this layout, one for
            east-facing plots and one for west-facing plots.
          </p>
        </div>

        <div className="mt-10 grid gap-10 lg:mt-14 lg:grid-cols-12 lg:gap-x-10">
          <div className="lg:col-span-7">
            <Segmented label="Villa design" options={DESIGNS} value={active} onChange={setActive} idOf={tabId} panelId={panelId} />
            <div
              id={panelId}
              role="tabpanel"
              aria-labelledby={tabId(active)}
              className="relative mt-5 aspect-[9/10] overflow-hidden rounded-lg bg-mist lg:aspect-square"
            >
              {DESIGNS.map((d) => (
                <Image
                  key={d.id}
                  src={d.src}
                  alt={d.alt}
                  aria-hidden={d.id !== active}
                  fill
                  sizes="(min-width: 1024px) 700px, 100vw"
                  className={cn(
                    "object-cover object-[center_30%] transition-opacity duration-500 ease-(--ease-out)",
                    d.id === active ? "opacity-100" : "opacity-0",
                  )}
                />
              ))}
              <ImpressionChip />
            </div>
          </div>
          <div className="lg:col-span-4 lg:col-start-9 lg:self-start lg:pt-16">
            <FeatureRows
              items={[
                { title: "Construction on request", text: "Choose your plot, and we can build the villa on it for you." },
                { title: "East-facing elevation", text: "A villa design drawn for the layout's east-facing plots." },
                { title: "West-facing elevation", text: "A matching design for the west-facing plots, from the same brochure." },
                { title: "Vaastu compliant", text: "The layout is planned to Vaastu, as the brochure states." },
              ]}
            />
            <EnquireButton variant="secondary" arrow interest={interest} className="mt-8">
              Ask about villa construction
            </EnquireButton>
          </div>
        </div>
      </Container>
    </Section>
  );
}
