"use client";

import Link from "next/link";
import { Fragment, useRef } from "react";

import { DESKTOP, gsap, MOTION_OK, useGSAP } from "@/components/motion/gsap";
import { Magnetic } from "@/components/motion/magnetic";
import { Container } from "@/components/site/container";
import { EnquireButton } from "@/components/site/enquire-button";
import { ImpressionChip } from "@/components/site/plate";
import { Arrow, Button } from "@/components/ui/button";
import { HERO } from "@/lib/home";

import { Film } from "./film";

/** A headline line, each word rising out of its own mask on load (pure CSS, so it runs before hydration). */
function Words({ text, from }: { text: string; from: number }) {
  return text.split(" ").map((word, i) => (
    <Fragment key={i}>
      {i > 0 ? " " : null}
      <span className="-mb-[0.12em] inline-block overflow-hidden pb-[0.12em] align-bottom">
        <span
          className="inline-block motion-safe:animate-[word-rise_1.4s_var(--ease-out)_both]"
          style={{ animationDelay: `${160 + (from + i) * 75}ms` }}
        >
          {word}
        </span>
      </span>
    </Fragment>
  ));
}

/**
 * Home hero, the live copy over the hero film (a 15 s seamless loop: through the entrance arch, down the avenue, the
 * layout at dusk; renders animated with kie.ai), which fills the first screen from the start (after the logo loader on
 * a first visit, whose push-through is the arrival; on repeat visits the film settles from a push-in). The headline is
 * set at editorial size along the foot, a light first line over a medium second line set against the right edge, its
 * words rising out of masks; above it on the right a teal rule, the line and the two actions (teal primary) on a local
 * navy ground. Desktop also gets a foot bar: a scroll cue and the film's progress as a teal hairline beside its pause
 * button. The impression note sits on the stage, so it stays through the scroll.
 * Scroll: a 250svh runway under a sticky screen. First the two headline lines part to the sides and fade, the copy
 * steps away (out of the tab order), the pause button fades and the film pushes in; then About slides up over the hero
 * like a sheet while the hero recedes and darkens behind it (About carries the matching negative margin). Reduced
 * motion: one screen, still.
 */
export function Hero() {
  const ref = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const root = ref.current;
      if (!root) return;
      const q = gsap.utils.selector(root);
      const mm = gsap.matchMedia();

      mm.add(MOTION_OK, () => {
        gsap
          .timeline({
            defaults: { ease: "none" },
            scrollTrigger: { trigger: root, start: "top top", end: "bottom bottom", scrub: 0.6 },
          })
          .to(q("[data-line='a']"), { xPercent: -12, opacity: 0, duration: 0.34 }, 0)
          .to(q("[data-line='b']"), { xPercent: 9, opacity: 0, duration: 0.34 }, 0)
          .to(q("[data-copy]"), { y: 48, autoAlpha: 0, duration: 0.16 }, 0)
          .to(q("[data-bar]"), { autoAlpha: 0, duration: 0.12 }, 0)
          .to(q("[data-push] button"), { autoAlpha: 0, duration: 0.12 }, 0)
          .to(q("[data-push]"), { scale: 1.14, duration: 0.34 }, 0)
          .to(q("[data-stage]"), { scale: 0.9, borderRadius: 32, duration: 0.66 }, 0.34)
          .to(q("[data-shade]"), { opacity: 0.7, duration: 0.66 }, 0.34);
      });

      // The desktop film's progress, drawn as a teal hairline in the foot bar.
      mm.add(DESKTOP, () => {
        const video = q("video").find((v) => v.getClientRects().length) as HTMLVideoElement | undefined;
        const bar = q("[data-progress]")[0];
        if (!video || !bar) return;
        const setX = gsap.quickSetter(bar, "scaleX");
        const tick = () => {
          if (video.duration) setX(video.currentTime / video.duration);
        };
        gsap.ticker.add(tick);
        return () => gsap.ticker.remove(tick);
      });
    },
    { scope: ref },
  );

  return (
    <section ref={ref} aria-labelledby="hero-title" className="relative h-[250svh] bg-navy-deep motion-reduce:h-svh">
      {/* The header stays clear (white logo) until About has slid over the hero. */}
      <div id="hero" aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-[150svh] motion-reduce:h-svh" />

      <div data-stage className="hero-hold on-navy grain sticky top-0 h-svh overflow-hidden bg-navy-deep">
        <div data-push className="absolute inset-0">
          {/* film-hold: after the loader the push-through is the arrival, so the settle only plays on repeat visits. */}
          <div className="film-hold absolute inset-0 motion-safe:animate-[film-settle_2.8s_var(--ease-out)_backwards]">
            <div className="absolute inset-0 lg:hidden">
              <Film src="/media/hero-film-mobile.mp4" poster="/media/hero-film-poster-mobile.webp" control="right-4 top-20" />
            </div>
            <div className="absolute inset-0 hidden lg:block">
              <Film
                src="/media/hero-film.mp4"
                poster="/media/hero-film-poster.webp"
                control="bottom-5 right-[max(2rem,calc(50vw-640px))]"
              />
            </div>
          </div>
        </div>
        {/* Shades: under the header, and the ground for the copy along the foot. */}
        <span aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-48 bg-linear-to-b from-navy-deep/70 to-transparent" />
        <span
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-linear-to-t from-navy-deep via-navy-deep/60 via-40% to-transparent to-80%"
        />
        {/* Desktop: a local ground under the line and actions, which sit over the brightest part of the film. */}
        <span
          aria-hidden
          className="pointer-events-none absolute inset-0 hidden bg-[radial-gradient(38%_34%_at_82%_52%,rgb(1_20_38/0.6),transparent)] lg:block"
        />
        <span data-shade aria-hidden className="pointer-events-none absolute inset-0 bg-navy-deep opacity-0" />
        {/* On the stage itself, so the render stays labelled through the whole scroll sequence. */}
        <ImpressionChip className="top-20 bottom-auto! left-5! sm:left-8! lg:top-28 lg:left-[max(2rem,calc(50vw-640px))]!" />

        <Container className="relative z-10 flex h-full flex-col justify-end pt-28 pb-[calc(60px+env(safe-area-inset-bottom)+1.5rem)] lg:pb-0">
          <h1 id="hero-title" className="order-1 text-hero text-white lg:order-2">
            <span data-line="a" className="block font-light">
              <Words text={HERO.title[0]} from={0} />
            </span>
            <span data-line="b" className="block lg:text-right">
              <Words text={HERO.title[1]} from={3} />
            </span>
          </h1>

          <div data-copy className="order-2 mt-7 lg:order-1 lg:mt-0 lg:mb-12 lg:ml-auto lg:w-[24rem]">
            <div className="motion-safe:animate-[fade-rise_1.2s_var(--ease-out)_950ms_both]">
              <span aria-hidden className="hidden h-0.5 w-12 bg-teal lg:block" />
              {/* The dash stays with the word before it, so no line starts with it. */}
              <p className="text-lede text-white lg:mt-5">{HERO.lede.replace(" —", " —")}</p>
              {/* One row where it fits; under 400 px an even stack. */}
              <div className="mt-7 grid gap-3 min-[400px]:flex min-[400px]:flex-wrap min-[400px]:items-center">
                <Magnetic>
                  <Button asChild variant="teal" className="max-[399px]:w-full">
                    <Link href="/projects">
                      Start exploring <Arrow />
                    </Link>
                  </Button>
                </Magnetic>
                <Magnetic>
                  <EnquireButton variant="outline-light" interest="general" className="max-[399px]:w-full">
                    Request Callback
                  </EnquireButton>
                </Magnetic>
              </div>
            </div>
          </div>

          <div data-bar className="order-3 mt-10 hidden h-20 border-t border-white/15 lg:block">
            <div className="grid h-full grid-cols-3 items-center motion-safe:animate-[fade-in_1s_ease_1.4s_both]">
              <span aria-hidden className="col-start-2 flex items-center gap-3 justify-self-center text-label text-white/70">
                <span className="relative h-8 w-px overflow-hidden bg-white/20">
                  <span className="absolute inset-0 bg-teal motion-safe:animate-[cue-run_2.4s_var(--ease-in-out)_infinite]" />
                </span>
                Scroll
              </span>
              <span aria-hidden className="mr-14 block h-px w-40 justify-self-end bg-white/20">
                <span data-progress className="block h-full origin-left scale-x-0 bg-teal" />
              </span>
            </div>
          </div>
        </Container>
      </div>
    </section>
  );
}
