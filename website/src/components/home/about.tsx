import Image from "next/image";
import Link from "next/link";

import { villaWest } from "@/assets/images";
import { Choreo } from "@/components/motion/choreo";
import { Magnetic } from "@/components/motion/magnetic";
import { Backdrop } from "@/components/site/backdrop";
import { Container } from "@/components/site/container";
import { ImpressionChip } from "@/components/site/plate";
import { SectionChip } from "@/components/site/typography";
import { Arrow, Button } from "@/components/ui/button";
import { ABOUT } from "@/lib/home";

import { Film } from "./film";

/**
 * About us, as on the live home, set as an editorial spread: the company name large, a drawn rule, the first paragraph
 * as a statement whose words brighten as it is read, then the villa picture (wipes open, drifts) beside the second
 * paragraph and Read More. The live home's film follows in a wide frame that wipes open from the left, then Our Brand
 * Story with its heading held while the two paragraphs pass. With motion, the section slides up over the hero like a
 * sheet (rounded top, a shadow cast upward), pulled up by the last screen of the hero's runway.
 */
export function About() {
  return (
    <Choreo
      as="section"
      aria-labelledby="about-title"
      className="relative isolate z-10 rounded-t-[28px] bg-white py-28 shadow-[0_-40px_80px_-40px_rgb(1_20_38/0.55)] motion-safe:-mt-[100svh] lg:rounded-t-[44px] lg:py-44"
    >
      <Backdrop className="rounded-t-[28px] lg:rounded-t-[44px]" />
      <Container>
        <div data-anim="fade-up">
          <SectionChip>{ABOUT.label}</SectionChip>
        </div>
        <h2 id="about-title" data-anim="chars" className="mt-7 text-title">
          {ABOUT.title}
        </h2>
        <span aria-hidden data-anim="line-x" className="mt-10 block h-px bg-line-strong lg:mt-14" />

        <p data-anim="scrub-words" className="mt-10 max-w-[30ch] text-h2 text-navy lg:mt-14">
          {ABOUT.p1}
        </p>

        <div className="mt-16 grid gap-12 lg:mt-24 lg:grid-cols-12 lg:items-end lg:gap-14">
          <div data-anim="reveal" className="relative aspect-[4/5] overflow-hidden rounded-2xl bg-mist sm:aspect-[4/3] lg:col-span-6 lg:aspect-[5/6]">
            <div data-anim="parallax" data-speed="7" className="absolute inset-x-0 -inset-y-[10%]">
              <Image
                src={villaWest}
                alt="Artist's impression of a villa at Global City VI"
                fill
                sizes="(min-width: 1024px) 45vw, 100vw"
                className="object-cover"
                style={{ objectPosition: "50% 35%" }}
              />
            </div>
            <ImpressionChip />
          </div>
          <div className="lg:col-span-5 lg:col-start-8 lg:pb-4">
            <p data-anim="lines" className="text-lede text-text">
              {ABOUT.p2}
            </p>
            <div data-anim="fade-up" data-delay="0.2" className="mt-10">
              <Magnetic>
                <Button asChild size="lg">
                  <Link href="/about">
                    Read More <Arrow />
                  </Link>
                </Button>
              </Magnetic>
            </div>
          </div>
        </div>

        <div data-anim="reveal" data-from="left" className="relative mt-24 aspect-[4/3] overflow-hidden rounded-2xl bg-navy-deep sm:aspect-[16/9] lg:mt-36 lg:aspect-[21/9]">
          {/* A phone cut and a desktop cut; each has a poster, so the copy CSS hides never downloads. */}
          <div className="absolute inset-0 lg:hidden">
            <Film src={ABOUT.videoMobile.src} poster={ABOUT.videoMobile.poster} control="right-5 bottom-5" />
          </div>
          <div className="absolute inset-0 hidden lg:block">
            <Film src={ABOUT.video.src} poster={ABOUT.video.poster} control="right-5 bottom-5" />
          </div>
          <ImpressionChip />
        </div>

        <div className="mt-20 grid gap-8 lg:mt-32 lg:grid-cols-12 lg:gap-14">
          <div className="lg:sticky lg:top-32 lg:col-span-4 lg:self-start">
            <h2 data-anim="lines" className="text-title">
              {ABOUT.story.title}
            </h2>
            <span aria-hidden data-anim="line-x" className="mt-8 block h-0.5 w-16 bg-teal" />
          </div>
          <div className="space-y-8 lg:col-span-7 lg:col-start-6">
            <p data-anim="lines" className="text-h3 font-medium text-navy">
              {ABOUT.story.p1}
            </p>
            <p data-anim="lines" className="text-lede text-text">
              {ABOUT.story.p2}
            </p>
          </div>
        </div>
      </Container>
    </Choreo>
  );
}
