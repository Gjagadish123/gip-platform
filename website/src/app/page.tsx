import type { Metadata } from "next";

import { About } from "@/components/home/about";
import { Hero } from "@/components/home/hero";
import { IntroBoot } from "@/components/home/intro-boot";
import { IntroLoader } from "@/components/home/intro-loader";
import { Legacy } from "@/components/home/legacy";
import { Principles } from "@/components/home/principles";
import { OurPromise } from "@/components/home/promise";
import { RecentProjects } from "@/components/home/recent-projects";
import { Stats } from "@/components/home/stats";
import { Testimonials } from "@/components/home/testimonials";
import { ThankYou } from "@/components/home/thank-you";
import { Touch } from "@/components/home/touch";
import { Values } from "@/components/home/values";
import { Why } from "@/components/home/why";
import { ContextCursor } from "@/components/motion/context-cursor";
import { SmoothScroll } from "@/components/motion/smooth-scroll";

// Title, description and OG come from the root default; only the canonical is restated.
export const metadata: Metadata = { alternates: { canonical: "/" } };

/**
 * Home: the live greaterinfraprojects.in home, section for section and word for word (src/lib/home.ts), told through
 * GIP's own components: the logo loader (first visit), the full-bleed film hero with About sliding over it, the brand
 * story, the record in large figures, the principles, the legacy pictures, our promise, our values, the recent
 * projects, get in touch, why choose us, client feedback and the thank-you close.
 */
export default function Home() {
  return (
    <>
      <IntroLoader />
      <IntroBoot />
      <SmoothScroll />
      <ContextCursor />
      <Hero />
      <About />
      <Stats />
      <Principles />
      <Legacy />
      <OurPromise />
      <Values />
      <RecentProjects />
      <Touch />
      <Why />
      <Testimonials />
      <ThankYou />
    </>
  );
}
