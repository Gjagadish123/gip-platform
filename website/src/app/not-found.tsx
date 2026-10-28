import type { Metadata } from "next";
import Link from "next/link";

import { Container } from "@/components/site/container";
import { Logo } from "@/components/site/logo";
import { TextLink } from "@/components/site/text-link";
import { Lede } from "@/components/site/typography";
import { Arrow, Button } from "@/components/ui/button";
import { COMPANY } from "@/lib/constants";

export const metadata: Metadata = {
  title: "Page not found",
  robots: { index: false, follow: false },
  alternates: { canonical: null }, // never point a 404 at the home page
};

/** The H1, one line, home and projects, the phone; the roof mark large and faint on the right (desktop). */
export default function NotFound() {
  return (
    <section className="relative overflow-hidden pt-32 pb-24 lg:pt-44 lg:pb-36">
      <Container className="grid items-center gap-12 lg:grid-cols-12 lg:gap-8">
        <div className="lg:col-span-7">
          <h1 className="text-display">This page is off the plan.</h1>
          <Lede className="mt-6 max-w-[46ch]">
            The address may have changed, or the link was cut short. Start again from the home page or see our projects.
          </Lede>
          <div className="mt-10 flex flex-wrap gap-3">
            <Button asChild size="lg">
              <Link href="/">
                Back to home <Arrow />
              </Link>
            </Button>
            <Button asChild variant="secondary" size="lg">
              <Link href="/projects">View projects</Link>
            </Button>
          </div>
          <p className="mt-8">
            <TextLink href={`tel:${COMPANY.phoneE164}`}>Call {COMPANY.phone}</TextLink>
          </p>
        </div>
        <Logo mark variant="navy" width={420} className="hidden w-[420px] justify-self-end opacity-8 lg:col-span-5 lg:block" />
      </Container>
    </section>
  );
}
