"use client";

import Link from "next/link";
import { useEffect } from "react";

import { Container } from "@/components/site/container";
import { Logo } from "@/components/site/logo";
import { TextLink } from "@/components/site/text-link";
import { Lede } from "@/components/site/typography";
import { Button } from "@/components/ui/button";
import { WHATSAPP_TEXT, whatsappUrl } from "@/lib/enquiry";

/** The 404's sibling: retry re-renders the segment; home and the phone are the ways round it. */
export default function Error({ error, retry }: { error: Error & { digest?: string }; retry: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);
  return (
    <section className="relative overflow-hidden pt-32 pb-24 lg:pt-44 lg:pb-36">
      <Container className="grid items-center gap-12 lg:grid-cols-12 lg:gap-8">
        <div className="lg:col-span-7">
          <h1 className="text-display">Something went wrong.</h1>
          <Lede className="mt-6 max-w-[46ch]">
            The page didn&rsquo;t load. Try again, or message us on WhatsApp and we&rsquo;ll answer your question directly.
          </Lede>
          <div className="mt-10 flex flex-wrap gap-3">
            <Button size="lg" onClick={() => retry()}>
              Try again
            </Button>
            <Button asChild variant="secondary" size="lg">
              <Link href="/">Back to home</Link>
            </Button>
          </div>
          <p className="mt-8">
            <TextLink href={whatsappUrl(WHATSAPP_TEXT.home)} external>Message us on WhatsApp</TextLink>
          </p>
          {error.digest ? <p className="mt-3 text-small text-muted">Reference {error.digest}</p> : null}
        </div>
        <Logo mark variant="navy" width={420} className="hidden w-[420px] justify-self-end opacity-8 lg:col-span-5 lg:block" />
      </Container>
    </section>
  );
}
