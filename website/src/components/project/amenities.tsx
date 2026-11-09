"use client";

import { Check } from "lucide-react";
import { useId, useState } from "react";

import { Container } from "@/components/site/container";
import { Section } from "@/components/site/section";
import { Lede } from "@/components/site/typography";
import { ICONS } from "@/lib/constants";
import type { Amenity } from "@/lib/types";
import { cn } from "@/lib/utils";

import { rovingTabKey } from "./parts";

/** The admin's amenity as a tab: its description lines are the list (else its name alone). */
const lines = (a: Amenity) => {
  const l = (a.description ?? "").split("\n").map((s) => s.trim()).filter(Boolean);
  return l.length ? l : [a.name];
};

/**
 * Amenities: the admin's amenities as vertical tabs in a mist well on desktop (a sideways-scrolling row on phones),
 * the chosen one's lines as large rows on hairlines beside them, fading in on change.
 */
export function Amenities({ title, description, items }: { title: string; description: string; items: Amenity[] }) {
  const uid = useId();
  const groups = items
    .filter((a) => a.name.trim())
    .map((a) => ({ id: a.id, icon: (a.icon && ICONS[a.icon]) || Check, title: a.name, items: lines(a) }));
  const ids = groups.map((g) => g.id);
  const [active, setActive] = useState(ids[0]);
  const group = groups.find((g) => g.id === active) ?? groups[0];
  const tabId = (t: string) => `${uid}-tab-${ids.indexOf(t)}`;
  const panelId = `${uid}-panel`;
  if (!group) return null;

  return (
    <Section id="amenities" aria-labelledby="amenities-title" className="border-t border-line">
      <Container>
        <h2 id="amenities-title" className="text-h2">
          {title || "What the layout includes"}
        </h2>
        {description ? <Lede className="mt-4">{description}</Lede> : null}

        <div className="mt-10 lg:mt-16 lg:grid lg:grid-cols-12 lg:gap-x-10">
          <div
            role="tablist"
            aria-label="Amenity groups"
            className="relative flex gap-1 overflow-x-auto rounded-md bg-mist p-1 [scrollbar-width:none] lg:col-span-4 lg:flex-col lg:self-start lg:rounded-lg lg:p-2 [&::-webkit-scrollbar]:hidden"
          >
            {groups.map(({ id, icon: Icon, title, items }) => {
              const on = id === active;
              return (
                <button
                  key={id}
                  id={tabId(id)}
                  type="button"
                  role="tab"
                  aria-selected={on}
                  aria-controls={panelId}
                  tabIndex={on ? 0 : -1}
                  onClick={() => setActive(id)}
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

          <div id={panelId} role="tabpanel" aria-labelledby={tabId(group.id)} tabIndex={0} className="mt-8 lg:col-span-7 lg:col-start-6 lg:mt-0">
            <ul key={group.id} className="animate-in border-t border-line duration-500 ease-(--ease-out) fade-in">
              {group.items.map((item, i) => (
                <li key={`${i}-${item}`} className="flex items-center gap-4 border-b border-line py-5 lg:py-6">
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
