"use client";

import { motion, useMotionTemplate, useReducedMotion, useScroll, useTransform } from "motion/react";
import Image from "next/image";
import { useId, useRef, useState, type CSSProperties, type ReactNode } from "react";

import { Container } from "@/components/site/container";
import { EnquireButton } from "@/components/site/enquire-button";
import { ImpressionChip, Plate } from "@/components/site/plate";
import { Reveal } from "@/components/site/reveal";
import { Section } from "@/components/site/section";
import type { InterestId } from "@/lib/enquiry";
import type { PageSection } from "@/lib/types";
import { cn } from "@/lib/utils";

import { FeatureRows, Segmented } from "./parts";

type Pic = PageSection["images"][number];
const altOf = (p: Pic, title: string) => p.image.alt || [title, p.caption].filter(Boolean).join(", ") || "Project picture";

/**
 * A block the admin writes (entrance arch, clubhouse, villa designs…). A lone picture with no words: shown wide, its
 * frame opening as it scrolls in. Words with one picture: the picture large with the points on a panel over its corner.
 * Two or more pictures: tabs named by their captions, the points beside them. No picture: the words and points.
 */
export function PageSectionBlock({ section, interest }: { section: PageSection; interest: InterestId }) {
  const { id, title, text, images, points, enquireLabel } = section;
  const rows = points.filter((p) => p.title || p.text);
  const words = !!(title || text || rows.length || enquireLabel);
  const titleId = `${id}-title`;

  if (images.length === 1 && !words) {
    return (
      <Section id={id} aria-label={images[0].caption || "Project picture"} className="border-t border-line">
        <Container>
          <WidePicture pic={images[0]} />
        </Container>
      </Section>
    );
  }

  const heading = title || text ? (
    <div className="grid gap-5 lg:grid-cols-12 lg:items-end lg:gap-x-10">
      {title ? (
        <h2 id={titleId} className="text-h2 lg:col-span-6">
          {title}
        </h2>
      ) : null}
      {text ? <p className="max-w-[52ch] text-body whitespace-pre-line text-text lg:col-span-5 lg:col-start-8">{text}</p> : null}
    </div>
  ) : null;
  const ask = enquireLabel ? (
    <EnquireButton variant="secondary" arrow interest={interest} className="mt-8">
      {enquireLabel}
    </EnquireButton>
  ) : null;

  return (
    <Section id={id} rhythm="secondary" aria-labelledby={title ? titleId : undefined} aria-label={title ? undefined : "Project details"}>
      <Container>
        {heading}
        {images.length >= 2 ? (
          <Tabs images={images} title={title} side={rows.length || ask ? <>{rows.length ? <FeatureRows items={rows} /> : null}{ask}</> : null} />
        ) : images.length === 1 ? (
          <Reveal className={cn("relative lg:pb-16", heading && "mt-10 lg:mt-14")}>
            <Plate
              src={images[0].image.url}
              alt={altOf(images[0], title)}
              impression={images[0].image.impression}
              sizes="(min-width: 1024px) 1070px, 100vw"
              className={cn("aspect-[4/3] lg:aspect-[16/9]", rows.length && "lg:w-5/6")}
            />
            {rows.length || ask ? (
              <div className="mt-8 lg:absolute lg:right-0 lg:bottom-0 lg:mt-0 lg:w-[400px] lg:rounded-lg lg:border lg:border-line lg:bg-white lg:p-8 lg:shadow-raise">
                {rows.length ? <FeatureRows items={rows} /> : null}
                {ask}
              </div>
            ) : null}
          </Reveal>
        ) : rows.length || ask ? (
          <div className={cn("lg:grid lg:grid-cols-12 lg:gap-x-10", heading && "mt-10 lg:mt-14")}>
            <div className="lg:col-span-6 lg:col-start-7">
              {rows.length ? <FeatureRows items={rows} /> : null}
              {ask}
            </div>
          </div>
        ) : null}
      </Container>
    </Section>
  );
}

/** One picture, wide at its own proportions (16:9 on phones); its frame opens from a 6 % inset as it scrolls in. */
function WidePicture({ pic }: { pic: Pic }) {
  const ref = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "center center"] });
  const inset = useTransform(scrollYProgress, [0, 1], [6, 0]);
  const clipPath = useMotionTemplate`inset(${inset}% ${inset}% ${inset}% ${inset}% round 14px)`;
  const { width, height } = pic.image;
  return (
    <div style={{ "--ratio": width && height ? `${width} / ${height}` : "16 / 9" } as CSSProperties}>
      <motion.div ref={ref} className="relative" style={reduced ? undefined : { clipPath }}>
        <Plate
          src={pic.image.url}
          alt={altOf(pic, "")}
          impression={pic.image.impression}
          sizes="(min-width: 1344px) 1280px, 100vw"
          className="aspect-[16/9] sm:aspect-(--ratio)"
        />
      </motion.div>
    </div>
  );
}

/** Pictures under tabs named by their captions, crossfading; the points (and the ask) beside them. */
function Tabs({ images, title, side }: { images: Pic[]; title: string; side: ReactNode }) {
  const uid = useId();
  const [active, setActive] = useState(images[0].id);
  const tabId = (id: string) => `${uid}-tab-${id}`;
  const panelId = `${uid}-panel`;
  const current = images.find((p) => p.id === active) ?? images[0];
  return (
    <div className={cn("mt-10 grid gap-10 lg:mt-14 lg:gap-x-10", side && "lg:grid-cols-12")}>
      <div className={side ? "lg:col-span-7" : undefined}>
        <Segmented
          label={title || "Pictures"}
          options={images.map((p, i) => ({ id: p.id, label: p.caption || `Picture ${i + 1}` }))}
          value={current.id}
          onChange={setActive}
          idOf={tabId}
          panelId={panelId}
        />
        <div
          id={panelId}
          role="tabpanel"
          aria-labelledby={tabId(current.id)}
          className="relative mt-5 aspect-[9/10] overflow-hidden rounded-lg bg-mist lg:aspect-square"
        >
          {images.map((p) => (
            <Image
              key={p.id}
              src={p.image.url}
              alt={altOf(p, title)}
              aria-hidden={p.id !== current.id}
              fill
              sizes="(min-width: 1024px) 700px, 100vw"
              className={cn(
                "object-cover object-[center_30%] transition-opacity duration-500 ease-(--ease-out)",
                p.id === current.id ? "opacity-100" : "opacity-0",
              )}
            />
          ))}
          {current.image.impression ? <ImpressionChip /> : null}
        </div>
      </div>
      {side ? <div className="lg:col-span-4 lg:col-start-9 lg:self-start lg:pt-16">{side}</div> : null}
    </div>
  );
}
