"use client";

import { Phone } from "lucide-react";
import Link from "next/link";
import { useEffect } from "react";

import { WhatsAppIcon } from "@/components/site/icons";
import { Button } from "@/components/ui/button";
import { COMPANY } from "@/lib/constants";
import { WHATSAPP_TEXT, whatsappUrl } from "@/lib/enquiry";

/** The availability read failed (the database didn't answer in time): say so, retry, and offer the direct routes. */
export default function LayoutsError({ error, retry }: { error: Error & { digest?: string }; retry: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);
  return (
    <section className="grid min-h-[70svh] place-items-center px-5 pt-24 pb-16 text-center">
      <div className="max-w-md">
        <h1 className="text-h2">Live layouts</h1>
        <p className="mt-3 text-body text-text">
          Today&rsquo;s availability didn&rsquo;t load just now. Try again in a moment, or call or WhatsApp us and we&rsquo;ll tell you
          which plots are open.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <Button onClick={() => retry()}>Try again</Button>
          <Button asChild variant="secondary">
            <a href={`tel:${COMPANY.phoneE164}`}>
              <Phone aria-hidden />
              Call {COMPANY.phone}
            </a>
          </Button>
          <Button asChild variant="secondary">
            <a href={whatsappUrl(WHATSAPP_TEXT.contact)} target="_blank" rel="noreferrer">
              <WhatsAppIcon className="size-4 text-whatsapp" />
              WhatsApp
            </a>
          </Button>
        </div>
        <p className="mt-6 text-small text-muted">
          <Link href="/projects" className="underline underline-offset-2 hover:text-navy">
            See all projects
          </Link>
          {error.digest ? ` · Reference ${error.digest}` : null}
        </p>
      </div>
    </section>
  );
}
