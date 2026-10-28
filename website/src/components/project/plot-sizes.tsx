"use client";

import Image from "next/image";
import { useId, useState } from "react";

import { gcviLayoutCopy, villaEast, villaWest } from "@/assets/images";
import { Container } from "@/components/site/container";
import { EnquireButton } from "@/components/site/enquire-button";
import { ImpressionChip } from "@/components/site/plate";
import { Section } from "@/components/site/section";
import type { InterestId } from "@/lib/enquiry";
import { cn } from "@/lib/utils";

import type { FacingStat, MainFacing } from "./content";
import { rovingTabKey, Segmented } from "./parts";

// East and west plots show the brochure's villa elevation for that facing; the rest show the layout copy.
const PICTURE: Partial<Record<MainFacing, { src: typeof villaEast; alt: string }>> = {
  East: { src: villaEast, alt: "Artist's impression of the east-facing villa design from the brochure" },
  West: { src: villaWest, alt: "Artist's impression of the west-facing villa design from the brochure" },
};

/**
 * Plot finder (no prices): a facing control with each facing's count, size bands as a radio group, then the counts as
 * figures, an availability bar and the matching picture in a white frame. Figure changes are announced politely.
 */
export function PlotSizes({ rows, asOf, provisional, interest }: { rows: FacingStat[]; asOf?: string; provisional?: boolean; interest: InterestId }) {
  const uid = useId();
  const [facing, setFacing] = useState<MainFacing>(rows[0].facing);
  const [bandId, setBandId] = useState("all");

  const row = rows.find((r) => r.facing === facing) ?? rows[0];
  const band = row.bands.find((b) => b.id === bandId) ?? row.bands[0];
  const bandIds = row.bands.map((b) => b.id);
  const picture = PICTURE[facing];
  const tabId = (f: MainFacing) => `${uid}-tab-${f}`;
  const bandBtnId = (id: string) => `${uid}-band-${id}`;
  const panelId = `${uid}-panel`;
  const choose = (f: MainFacing) => {
    setFacing(f);
    setBandId("all"); // the next facing may not have the chosen size band
  };
  const share = band.total ? (band.available / band.total) * 100 : 0;

  return (
    <Section id="plots" tone="mist" aria-labelledby={`${uid}-title`}>
      <Container>
        <h2 id={`${uid}-title`} className="text-h2">
          Plot sizes and facing
        </h2>

        <div className="mt-8 lg:mt-10">
          <Segmented
            label="Plot facing"
            options={rows.map((r) => ({
              id: r.facing,
              label: (
                <>
                  {r.facing}
                  <span className="text-small text-muted tabular-nums">
                    {r.bands[0].total}
                    <span className="sr-only"> plots</span>
                  </span>
                </>
              ),
            }))}
            value={facing}
            onChange={choose}
            idOf={tabId}
            panelId={panelId}
            className="grid w-full grid-cols-2 bg-mist-2 sm:inline-flex sm:w-auto"
          />
        </div>

        <div id={panelId} role="tabpanel" aria-labelledby={tabId(facing)} className="mt-4">
          <div role="radiogroup" aria-label="Plot size" className="flex flex-wrap gap-2">
            {row.bands.map((b) => {
              const on = b.id === band.id;
              return (
                <button
                  key={b.id}
                  id={bandBtnId(b.id)}
                  type="button"
                  role="radio"
                  aria-checked={on}
                  tabIndex={on ? 0 : -1}
                  onClick={() => setBandId(b.id)}
                  onKeyDown={(e) => rovingTabKey(e, bandIds, band.id, setBandId, bandBtnId)}
                  className={cn(
                    "h-10 rounded-md border px-4 text-ui font-medium transition-colors duration-300 ease-(--ease-out)",
                    on ? "border-brand bg-brand text-white" : "border-line bg-white text-navy hover:border-line-strong",
                  )}
                >
                  {b.label}
                </button>
              );
            })}
          </div>

          <div className="mt-10 grid gap-10 lg:mt-12 lg:grid-cols-12 lg:gap-x-10">
            <div className="lg:col-span-5">
              <dl aria-live="polite" aria-atomic="true" className="grid grid-cols-2 gap-x-6 gap-y-8">
                <div>
                  <dt className="text-label text-muted">Plots</dt>
                  <dd className="mt-2 text-figure text-navy">{band.total}</dd>
                </div>
                <div>
                  <dt className="text-label text-muted">Available</dt>
                  <dd className="mt-2 text-figure text-navy">{band.available}</dd>
                </div>
                <div className="col-span-2">
                  <dt className="text-label text-muted">Size range</dt>
                  <dd className="mt-2 flex items-baseline gap-2 text-figure text-navy">
                    {band.min === band.max ? band.min : `${band.min}–${band.max}`}
                    <span className="text-ui font-medium text-muted">sq yd</span>
                  </dd>
                </div>
              </dl>

              <div className="mt-10">
                <p className="flex items-baseline justify-between gap-4 text-small">
                  <span className="text-muted">Availability</span>
                  <span className="font-medium text-navy tabular-nums">
                    {band.available} of {band.total} available
                  </span>
                </p>
                <div aria-hidden className="mt-2 h-2 overflow-hidden rounded-sm bg-line">
                  <div className="h-full rounded-sm bg-go transition-[width] duration-700 ease-(--ease-out)" style={{ width: `${share}%` }} />
                </div>
                <p className="mt-4 max-w-[46ch] text-small text-muted">
                  Counted by each plot&rsquo;s main facing.
                  {asOf ? ` As of ${asOf}.` : null}
                  {provisional ? " Some statuses are provisional, so confirm a plot with us before you book." : null}
                </p>
              </div>

              <EnquireButton arrow interest={interest} className="mt-8">
                Enquire about {facing.toLowerCase()}-facing plots
              </EnquireButton>
            </div>

            <div className="relative aspect-[5/4] overflow-hidden rounded-lg border border-line bg-white lg:col-span-7">
              <Image
                key={facing}
                src={picture?.src ?? gcviLayoutCopy}
                alt={picture?.alt ?? "Global City VI layout copy"}
                fill
                sizes="(min-width: 1024px) 740px, 100vw"
                className={cn(
                  "animate-in duration-500 ease-(--ease-out) fade-in",
                  picture ? "object-cover object-[center_30%]" : "object-contain p-4",
                )}
              />
              {picture ? <ImpressionChip /> : null}
            </div>
          </div>
        </div>
      </Container>
    </Section>
  );
}
