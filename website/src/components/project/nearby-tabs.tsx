"use client";

import { useId, useState } from "react";

import type { NEARBY } from "./content";
import { Segmented } from "./parts";

/** What's nearby: a segmented control over the brochure's groups, places as rows on hairlines with a time chip. */
export function NearbyTabs({ groups, className }: { groups: typeof NEARBY; className?: string }) {
  const uid = useId();
  const [active, setActive] = useState(groups[0].id);
  const group = groups.find((g) => g.id === active) ?? groups[0];
  const tabId = (id: string) => `${uid}-tab-${id}`;
  const panelId = `${uid}-panel`;

  return (
    <div className={className}>
      <Segmented
        label="Nearby places"
        options={groups}
        value={active}
        onChange={setActive}
        idOf={tabId}
        panelId={panelId}
        className="grid w-full grid-cols-2 sm:inline-flex sm:w-auto"
      />
      <ul key={group.id} id={panelId} role="tabpanel" aria-labelledby={tabId(group.id)} className="mt-6 animate-in border-t border-line duration-500 ease-(--ease-out) fade-in">
        {group.places.map((p) => (
          <li key={p.name} className="flex items-center justify-between gap-4 border-b border-line py-4">
            <span className="min-w-0 text-body text-text">{p.name}</span>
            <span className="shrink-0 rounded-md bg-mist px-2 py-1 text-label whitespace-nowrap text-navy">{p.time}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
