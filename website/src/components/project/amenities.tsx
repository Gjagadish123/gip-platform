"use client";

import { Check } from "lucide-react";
import { useId, useState } from "react";

import { Container } from "@/components/site/container";
import { Section } from "@/components/site/section";
import { Lede } from "@/components/site/typography";
import { cn } from "@/lib/utils";

import { AMENITY_GROUPS } from "./content";
import { rovingTabKey } from "./parts";

/**
 * Amenities: the five brochure groups as vertical tabs in a mist well on desktop (a sideways-scrolling row on phones),
 * the chosen group's items as large rows on hairlines beside them, fading in on change.
 */
export function Amenities() {
  const uid = useId();
  const ids = AMENITY_GROUPS.map((g) => g.title);
  const [active, setActive] = useState(ids[0]);
  const group = AMENITY_GROUPS.find((g) => g.title === active) ?? AMENITY_GROUPS[0];
  const tabId = (t: string) => `${uid}-tab-${ids.indexOf(t)}`;
  const panelId = `${uid}-panel`;

  return (
    <Section id="amenities" aria-labelledby="amenities-title" className="border-t border-line">
      <Container>
        <h2 id="amenities-title" className="text-h2">
          What the layout includes
        </h2>
        <Lede className="mt-4">As set out in the project brochure.</Lede>

        <div className="mt-10 lg:mt-16 lg:grid lg:grid-cols-12 lg:gap-x-10">
          <div
            role="tablist"
            aria-label="Amenity groups"
            className="flex gap-1 overflow-x-auto rounded-md bg-mist p-1 [scrollbar-width:none] lg:col-span-4 lg:flex-col lg:self-start lg:rounded-lg lg:p-2 [&::-webkit-scrollbar]:hidden"
          >
            {AMENITY_GROUPS.map(({ icon: Icon, title, items }) => {
              const on = title === active;
              return (
                <button
                  key={title}
                  id={tabId(title)}
                  type="button"
                  role="tab"
                  aria-selected={on}
                  aria-controls={panelId}
                  tabIndex={on ? 0 : -1}
                  onClick={() => setActive(title)}
                  onKeyDown={(e) => rovingTabKey(e, ids, active, setActive, tabId)}
                  className={cn(
                    "flex shrink-0 items-center gap-3 rounded-sm px-3.5 py-2.5 text-left transition-[background-color,color,box-shadow] duration-300 ease-(--ease-out) lg:rounded-md lg:px-4 lg:py-4",
                    on ? "bg-white text-navy shadow-raise" : "text-muted hover:text-navy",
                  )}
                >
                  <Icon aria-hidden className={cn("size-5 shrink-0", on && "text-navy-soft")} />
                  <span className="text-ui font-medium whitespace-nowrap">{title}</span>
                  <span className="ml-auto pl-2 text-small text-muted tabular-nums">
                    {items.length}
                    <span className="sr-only"> items</span>
                  </span>
                </button>
              );
            })}
          </div>

          <div id={panelId} role="tabpanel" aria-labelledby={tabId(group.title)} tabIndex={0} className="mt-8 lg:col-span-7 lg:col-start-6 lg:mt-0">
            <ul key={group.title} className="animate-in border-t border-line duration-500 ease-(--ease-out) fade-in">
              {group.items.map((item) => (
                <li key={item} className="flex items-center gap-4 border-b border-line py-5 lg:py-6">
                  <Check aria-hidden className="size-5 shrink-0 text-navy-soft" />
                  <span className="text-h3 font-medium text-navy">{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </Container>
    </Section>
  );
}
