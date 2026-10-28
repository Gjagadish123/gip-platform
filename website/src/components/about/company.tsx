"use client";

import { ChevronDown, Quote } from "lucide-react";
import { useId, useState, type KeyboardEvent } from "react";

import { Container } from "@/components/site/container";
import { Plate } from "@/components/site/plate";
import { Section } from "@/components/site/section";
import { Lede } from "@/components/site/typography";
import { LEADERSHIP, MISSION, VISION } from "@/lib/site";
import { cn } from "@/lib/utils";

const TABS = [
  { id: "mission", label: "Our mission", ...MISSION },
  { id: "vision", label: "Our vision", ...VISION },
] as const;
type TabId = (typeof TABS)[number]["id"];

/**
 * Mission and vision on mist: a segmented control (white segment on a mist-2 track) crossfades two panels stacked in
 * one grid cell, so the section never changes height. Each panel: the statement large, the paragraph, the quote.
 */
export function MissionVision() {
  const uid = useId();
  const [active, setActive] = useState<TabId>("mission");
  const tabId = (id: TabId) => `${uid}-tab-${id}`;
  const panelId = (id: TabId) => `${uid}-panel-${id}`;

  function onKey(e: KeyboardEvent) {
    const i = TABS.findIndex((t) => t.id === active);
    const n = TABS.length;
    const next =
      e.key === "ArrowRight" ? TABS[(i + 1) % n]
      : e.key === "ArrowLeft" ? TABS[(i - 1 + n) % n]
      : e.key === "Home" ? TABS[0]
      : e.key === "End" ? TABS[n - 1]
      : null;
    if (!next) return;
    e.preventDefault();
    setActive(next.id);
    document.getElementById(tabId(next.id))?.focus();
  }

  return (
    <Section tone="mist" aria-labelledby={`${uid}-title`}>
      <Container>
        <h2 id={`${uid}-title`} className="sr-only">
          Mission and vision
        </h2>
        <div role="tablist" aria-label="Mission and vision" className="inline-flex gap-1 rounded-md bg-mist-2 p-1">
          {TABS.map((t) => {
            const on = t.id === active;
            return (
              <button
                key={t.id}
                id={tabId(t.id)}
                type="button"
                role="tab"
                aria-selected={on}
                aria-controls={panelId(t.id)}
                tabIndex={on ? 0 : -1}
                onClick={() => setActive(t.id)}
                onKeyDown={onKey}
                className={cn(
                  "h-10 rounded-sm px-5 text-ui font-medium transition-colors duration-300 ease-(--ease-out)",
                  on ? "bg-white text-navy" : "text-muted hover:text-navy",
                )}
              >
                {t.label}
              </button>
            );
          })}
        </div>

        <div className="mt-10 grid lg:mt-14">
          {TABS.map((t) => {
            const on = t.id === active;
            return (
              <div
                key={t.id}
                id={panelId(t.id)}
                role="tabpanel"
                aria-labelledby={tabId(t.id)}
                tabIndex={on ? 0 : -1}
                className={cn(
                  "col-start-1 row-start-1 grid gap-8 transition-[opacity,visibility] duration-500 ease-(--ease-out) lg:grid-cols-12 lg:gap-8",
                  on ? "visible opacity-100" : "invisible opacity-0",
                )}
              >
                <p className="text-h2 text-balance text-navy lg:col-span-7">{t.p1}</p>
                <div className="max-w-[60ch] lg:col-span-4 lg:col-start-9">
                  <p className="text-body text-text">{t.p2}</p>
                  <blockquote className="mt-8 border-t border-line pt-6">
                    <Quote aria-hidden className="size-6 text-navy-soft" />
                    <p className="mt-4 text-lede font-medium text-navy">{t.quote}</p>
                  </blockquote>
                </div>
              </div>
            );
          })}
        </div>
      </Container>
    </Section>
  );
}

type Person = (typeof LEADERSHIP.people)[number];

/** A leader: portrait, name, role, and the bio held to three lines until "Read more". */
function Leader({ person }: { person: Person }) {
  const bioId = useId();
  const [open, setOpen] = useState(false);
  return (
    <article>
      <Plate
        src={person.photo}
        alt={`${person.name}, ${person.role}`}
        sizes="(min-width: 1024px) 500px, (min-width: 640px) 50vw, 100vw"
        className="aspect-[4/5]"
        imgClassName="object-top"
      />
      <h3 className="mt-6 text-h3">{person.name}</h3>
      <p className="mt-1 text-small text-muted">{person.role}</p>
      <p id={bioId} className={cn("mt-4 max-w-[60ch] text-body text-text", !open && "line-clamp-3")}>
        {person.bio}
      </p>
      <button
        type="button"
        aria-expanded={open}
        aria-controls={bioId}
        onClick={() => setOpen((o) => !o)}
        className="group/link mt-3 inline-flex items-center gap-1.5 text-ui font-medium text-navy-soft transition-colors hover:text-navy"
      >
        <span className="link-draw">{open ? "Show less" : "Read more"}</span>
        <ChevronDown aria-hidden className={cn("size-4 transition-transform duration-300 ease-(--ease-out)", open && "rotate-180")} />
      </button>
    </article>
  );
}

/** The two leaders side by side under the heading and lede. */
export function Leadership() {
  return (
    <Section aria-labelledby="leadership-title">
      <Container>
        <div className="grid gap-6 lg:grid-cols-12 lg:items-end lg:gap-8">
          {/* LEADERSHIP.heading in sentence case. */}
          <h2 id="leadership-title" className="max-w-[18ch] text-h2 lg:col-span-6">
            Visionary leadership. Disciplined execution.
          </h2>
          <Lede className="max-w-[52ch] lg:col-span-5 lg:col-start-8">{LEADERSHIP.lede}</Lede>
        </div>
        <ul className="mt-14 grid gap-14 sm:grid-cols-2 sm:gap-8 lg:mt-20 lg:max-w-[1064px] lg:gap-16">
          {LEADERSHIP.people.map((p) => (
            <li key={p.name}>
              <Leader person={p} />
            </li>
          ))}
        </ul>
      </Container>
    </Section>
  );
}
