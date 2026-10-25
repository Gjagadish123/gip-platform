"use client";

import Image from "next/image";
import { useRef } from "react";

import { Choreo } from "@/components/motion/choreo";
import { DESKTOP, gsap, MOTION_OK, PHONE, useGSAP } from "@/components/motion/gsap";
import { Magnetic } from "@/components/motion/magnetic";
import { EnquireButton } from "@/components/site/enquire-button";
import { ImpressionChip } from "@/components/site/plate";
import { SectionChip } from "@/components/site/typography";
import { TOUCH } from "@/lib/home";

/**
 * Get in touch, as on the live home: "Explore your dream home today", its line and the Get in touch button (teal, the
 * one primary action on navy) with the live section's own picture, a contemporary villa at night. Desktop: a
 * full-screen panel that arrives as a rounded window inset in the white page and opens to the full bleed as it rises
 * to the top of the screen, the picture settling from a zoom and drifting slower than the page. The copy sits left over a navy shade, vertically centred, lined up with the
 * page container but never closer than 3rem inside the window; the impression note sits bottom-left under it, clear of
 * the header and the call dock. Below lg: the picture in its own full-bleed frame (4:3, 16:9 from sm, the impression
 * note bottom-left) that opens from a rounded inset as it rises while the picture drifts, then the copy on navy beneath
 * it. Reduced motion: still at every width.
 */
export function Touch() {
  const ref = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add(`${MOTION_OK} and ${DESKTOP}`, () => {
        gsap
          .timeline({ defaults: { ease: "none" }, scrollTrigger: { trigger: ref.current, start: "top bottom", end: "top top", scrub: 0.8 } })
          .fromTo(ref.current, { clipPath: "inset(6% 5% 6% 5% round 28px)" }, { clipPath: "inset(0% 0% 0% 0% round 0px)" }, 0)
          .fromTo("[data-layer]", { yPercent: -10, scale: 1.15 }, { yPercent: 0, scale: 1 }, 0);
      });
      mm.add(`${MOTION_OK} and ${PHONE}`, () => {
        const frame = ref.current?.querySelector("[data-frame]");
        if (!frame) return;
        gsap.fromTo(
          frame,
          { clipPath: "inset(3% 4% 3% 4% round 24px)" },
          { clipPath: "inset(0% 0% 0% 0% round 0px)", ease: "none", scrollTrigger: { trigger: frame, start: "top bottom", end: "top 35%", scrub: 0.8 } },
        );
        // ±8 % of a layer 120 % tall moves it 9.6 % of the frame, inside its 10 % overhang, so no edge shows.
        gsap.fromTo(
          "[data-layer]",
          { yPercent: -8 },
          { yPercent: 8, ease: "none", scrollTrigger: { trigger: frame, start: "top bottom", end: "bottom top", scrub: true } },
        );
      });
    },
    { scope: ref },
  );

  return (
    <section
      ref={ref}
      aria-labelledby="touch-title"
      // The window's opening frame is in CSS too, so desktop never flashes full bleed before the script runs.
      className="on-navy relative overflow-hidden bg-navy-deep lg:flex lg:min-h-svh lg:items-center lg:[clip-path:inset(6%_5%_6%_5%_round_28px)] motion-reduce:lg:[clip-path:none]"
    >
      {/* Below lg the picture's own frame above the copy (its opening inset in CSS too); on desktop it fills the panel. */}
      <div
        data-frame
        className="relative aspect-[4/3] overflow-hidden sm:aspect-[16/9] max-lg:motion-safe:[clip-path:inset(3%_4%_3%_4%_round_24px)] lg:absolute lg:inset-0 lg:aspect-auto"
      >
        <div data-layer className="absolute inset-x-0 -inset-y-[10%] motion-reduce:inset-y-0">
          <Image src={TOUCH.image} alt="Artist's impression of a contemporary villa at night" fill sizes="100vw" placeholder="blur" className="object-cover" />
        </div>
        <span
          aria-hidden
          className="absolute inset-0 hidden bg-linear-to-r from-navy-deep/95 via-navy-deep/60 to-navy-deep/0 lg:block"
        />
        <ImpressionChip className="bottom-5! left-5! sm:left-8! lg:bottom-[calc(6%_+_1.5rem)]! lg:left-[max(calc(5%_+_3rem),calc(50%_-_640px))]!" />
      </div>

      <Choreo className="relative w-full px-5 pt-12 pb-14 sm:px-8 sm:pt-14 sm:pb-16 lg:py-32 lg:pr-8 lg:pl-[max(calc(5%_+_3rem),calc(50%_-_640px))]">
        <div data-anim="fade-up">
          <SectionChip tone="dark">{TOUCH.label}</SectionChip>
        </div>
        {/* Padded line masks keep the descenders of "your" and "today" clear of the clip. */}
        <h2 id="touch-title" data-anim="lines" className="mt-7 text-hero text-white [&>div]:-mb-[0.14em] [&>div]:pb-[0.14em]">
          {TOUCH.title[0]}
          <br />
          {TOUCH.title[1]}
        </h2>
        <p data-anim="lines" data-delay="0.15" className="mt-7 max-w-[40ch] text-lede text-on-navy-2">
          {TOUCH.text}
        </p>
        <div data-anim="fade-up" data-delay="0.3" className="mt-10">
          <Magnetic>
            <EnquireButton variant="teal" size="lg" arrow interest="other">
              Get in touch
            </EnquireButton>
          </Magnetic>
        </div>
      </Choreo>
    </section>
  );
}
