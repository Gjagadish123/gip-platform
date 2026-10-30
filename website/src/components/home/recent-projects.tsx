"use client";

import { ArrowUpRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRef, type ReactNode } from "react";

import { Choreo } from "@/components/motion/choreo";
import { DESKTOP, gsap, MOTION_OK, useGSAP } from "@/components/motion/gsap";
import { Magnetic } from "@/components/motion/magnetic";
import { Backdrop } from "@/components/site/backdrop";
import { Container } from "@/components/site/container";
import { useEnquiry } from "@/components/site/enquiry-provider";
import { ImpressionChip } from "@/components/site/plate";
import { SectionChip } from "@/components/site/typography";
import { Arrow, Button } from "@/components/ui/button";
import { RECENT_PROJECTS } from "@/lib/home";
import { cn } from "@/lib/utils";

type Item = (typeof RECENT_PROJECTS.items)[number];

// The track finishes travelling at 90 % of the runway; the rest holds the last card in full view.
const TRAVEL = 0.9;

function Card({ item, index }: { item: Item; index: number }) {
  const { openEnquiry } = useEnquiry();
  const href = "href" in item ? item.href : undefined;
  const inner: ReactNode = (
    <>
      <span
        className={cn(
          "relative block aspect-[4/5] overflow-hidden rounded-2xl bg-mist motion-safe:lg:aspect-[4/3]",
          index < 2 ? "motion-reduce:lg:aspect-[16/10]" : "motion-reduce:lg:aspect-[4/3]",
        )}
      >
        {/* Oversized so the desktop drift (GSAP) never shows an edge; the hover zoom lives on the image, not here. */}
        <span data-layer className="absolute inset-0 lg:-inset-x-[10%] motion-reduce:lg:inset-x-0">
          <Image
            src={item.image}
            alt={`${item.name}, ${item.location}`}
            fill
            sizes="(min-width: 1024px) 45vw, (min-width: 768px) 44vw, (min-width: 640px) 58vw, 82vw"
            className={cn(
              "object-cover transition-[scale] duration-[1.6s] ease-(--ease-out)",
              "trimTop" in item ? "origin-bottom scale-[1.05] motion-safe:group-hover/card:scale-[1.1]" : "motion-safe:group-hover/card:scale-[1.05]",
            )}
          />
        </span>
        <span aria-hidden className="absolute inset-0 bg-navy-deep/30 opacity-0 transition-opacity duration-700 ease-(--ease-out) group-hover/card:opacity-100" />
        {"impression" in item ? <ImpressionChip /> : null}
        {/* Keyboard focus, hover without the context cursor and, always, a touch screen name the action. */}
        <span className="absolute right-4 bottom-4 inline-flex h-10 translate-y-2 items-center gap-2 rounded-md bg-white px-3.5 text-small font-medium text-navy opacity-0 shadow-raise transition-[opacity,translate] duration-500 ease-(--ease-out) group-focus-visible/card:translate-y-0 group-focus-visible/card:opacity-100 pointer-coarse:translate-y-0 pointer-coarse:opacity-100 motion-reduce:group-hover/card:translate-y-0 motion-reduce:group-hover/card:opacity-100">
          {href ? "View project" : "Enquire"} <ArrowUpRight aria-hidden className="size-4" />
        </span>
      </span>
      <span className="mt-5 grid grid-cols-[2.5rem_1fr] items-baseline">
        <span aria-hidden className="text-label text-teal-deep tabular-nums">
          {String(index + 1).padStart(2, "0")}
        </span>
        <span className="text-h3 text-navy">{item.name}</span>
        <span className="col-start-2 mt-1 text-small text-muted">{item.location}</span>
      </span>
    </>
  );
  const cls = "group/card flex w-full flex-col text-left outline-offset-4"; // flex: a button would centre a shorter card vertically
  return href ? (
    <Link href={href} data-cursor="View" className={cls}>
      {inner}
    </Link>
  ) : (
    <button
      type="button"
      onClick={() => openEnquiry({ interest: "other" })}
      data-cursor="Enquire"
      className={cls}
      aria-label={`Enquire about ${item.name}`}
    >
      {inner}
    </button>
  );
}

/**
 * Our recent projects, as on the live home: the five layouts with their site photographs; Global City VI opens its
 * page, the others open the enquiry drawer. Desktop: a horizontal gallery. A 300vh runway holds a sticky white stage
 * (kicker, title, Start exploring along the top) and the track of tall cards slides left as the page scrolls, every
 * second card set lower; each photograph lags its frame (it sits centred when its card is mid-screen) and a hairline
 * along the bottom fills teal with the travel. The last card arrives at 90 % of the runway and holds. Tabbing (not
 * clicking) to a card off to the right scrolls the page until it is in view. Phones: a swipe strip of cards that snaps
 * to the gutter. Touch screens always show each card's action label ("View project" / "Enquire"). Reduced motion
 * (desktop): no runway, two large cards over three, as before.
 */
export function RecentProjects() {
  const ref = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add(`${MOTION_OK} and ${DESKTOP}`, () => {
        const root = ref.current;
        const track = root?.querySelector<HTMLElement>("[data-track]");
        if (!root || !track) return;
        const cards = gsap.utils.toArray<HTMLElement>(track.children);
        const layers = gsap.utils.toArray<HTMLElement>("[data-layer]", track);
        const setX = layers.map((l) => gsap.quickSetter(l, "xPercent"));
        const span = () => track.scrollWidth - track.clientWidth;

        // A photograph is centred when its card is mid-screen and leans up to 8 % against the travel either side of it.
        const drift = () =>
          cards.forEach((c, i) => {
            const r = c.getBoundingClientRect();
            setX[i](gsap.utils.clamp(-8, 8, (0.5 - (r.left + r.width / 2) / innerWidth) * 16));
          });

        const tl = gsap
          .timeline({
            defaults: { ease: "none" },
            onUpdate: drift,
            scrollTrigger: { trigger: root, start: "top top", end: "bottom bottom", scrub: 0.8, invalidateOnRefresh: true },
          })
          .to(track, { x: () => -span(), duration: TRAVEL }, 0)
          .fromTo("[data-bar]", { scaleX: 0 }, { scaleX: 1, duration: TRAVEL }, 0)
          .to({}, { duration: 1 - TRAVEL });
        drift();

        // The stage clips the track, so a card focused off-screen brings the page to the point where it is centred.
        const focus = (e: FocusEvent) => {
          // Chrome focuses a link or button on mousedown too; only keyboard focus should move the page.
          if (!(e.target as Element).matches(":focus-visible")) return;
          const li = (e.target as HTMLElement).closest("li");
          const st = tl.scrollTrigger;
          const max = span();
          if (!li || !st || max <= 0) return;
          const x = gsap.utils.clamp(0, max, li.offsetLeft - (track.clientWidth - li.offsetWidth) / 2);
          window.scrollTo(0, st.start + (st.end - st.start) * (x / max) * TRAVEL);
        };
        track.addEventListener("focusin", focus);
        return () => {
          track.removeEventListener("focusin", focus);
          gsap.set(layers, { clearProps: "transform" });
        };
      });
    },
    { scope: ref },
  );

  return (
    <section ref={ref} aria-labelledby="recent-title" className="lg:h-[300vh] motion-reduce:lg:h-auto">
      <Choreo className="relative isolate py-24 lg:sticky lg:top-0 lg:flex lg:h-svh lg:flex-col lg:overflow-clip lg:pt-28 lg:pb-12 motion-reduce:lg:static motion-reduce:lg:block motion-reduce:lg:h-auto motion-reduce:lg:overflow-visible motion-reduce:lg:py-36">
        <Backdrop />
        <Container className="lg:flex lg:min-h-0 lg:flex-1 lg:flex-col motion-reduce:lg:block">
          <div className="flex flex-wrap items-end justify-between gap-6">
            <div>
              <div data-anim="fade-up">
                <SectionChip>{RECENT_PROJECTS.kicker}</SectionChip>
              </div>
              {/* Padded word masks keep the descender of "projects" clear of the clip. */}
              <h2 id="recent-title" data-anim="chars" className="mt-6 text-title [&>div]:-mb-[0.14em] [&>div]:pb-[0.14em]">
                {RECENT_PROJECTS.title}
              </h2>
            </div>
            <div data-anim="fade-up" data-delay="0.2">
              <Magnetic>
                <Button asChild variant="secondary">
                  <Link href="/projects">
                    Start exploring <Arrow />
                  </Link>
                </Button>
              </Magnetic>
            </div>
          </div>

          <div className="mt-10 sm:mt-12 lg:mt-8 lg:flex lg:min-h-0 lg:flex-1 lg:items-center motion-reduce:lg:mt-16 motion-reduce:lg:block">
            <ul
              data-track
              data-anim="stagger"
              className={cn(
                // Phones: a full-bleed swipe strip snapping to the gutter (the vertical padding keeps focus rings unclipped).
                "relative -mx-5 -my-3 flex snap-x snap-mandatory scroll-px-5 gap-4 overflow-x-auto overflow-y-hidden px-5 py-3 [scrollbar-width:none] sm:-mx-8 sm:scroll-px-8 sm:gap-6 sm:px-8 [&::-webkit-scrollbar]:hidden",
                // Desktop: pinned to the container width so its overflow is the distance the track travels.
                "lg:m-0 lg:w-full lg:min-w-0 lg:snap-none lg:items-start lg:gap-12 lg:overflow-visible lg:p-0 xl:gap-16",
                "motion-reduce:lg:grid motion-reduce:lg:grid-cols-6 motion-reduce:lg:gap-x-6 motion-reduce:lg:gap-y-14",
              )}
            >
              {RECENT_PROJECTS.items.map((item, i) => (
                <li
                  key={item.name}
                  className={cn(
                    // Desktop width also answers to the screen height so the tallest card fits the stage.
                    "w-[82vw] shrink-0 snap-start sm:w-[58vw] md:w-[44vw] lg:w-[min(38vw,580px,calc((100svh_-_30rem)*1.333))] lg:even:mt-10",
                    "motion-reduce:lg:w-auto motion-reduce:lg:even:mt-0",
                    i < 2 ? "motion-reduce:lg:col-span-3" : "motion-reduce:lg:col-span-2",
                  )}
                >
                  <Card item={item} index={i} />
                </li>
              ))}
            </ul>
          </div>

          <span aria-hidden className="mt-8 hidden h-px shrink-0 bg-line lg:block motion-reduce:lg:hidden">
            <span data-bar className="block h-full origin-left bg-teal" />
          </span>
        </Container>
      </Choreo>
    </section>
  );
}
