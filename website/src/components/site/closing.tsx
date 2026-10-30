"use client";

import { CalendarDays } from "lucide-react";
import type { ComponentType, ReactNode } from "react";

import { Arrow } from "@/components/ui/button";
import { WHATSAPP_TEXT, whatsappUrl, type InterestId } from "@/lib/enquiry";
import { CLOSING_CTA, OFFICE } from "@/lib/site";

import { Container } from "./container";
import { useEnquiry } from "./enquiry-provider";
import { WhatsAppIcon } from "./icons";
import { Logo } from "./logo";

function Row({ icon: Icon, title, detail }: { icon: ComponentType<{ className?: string }>; title: string; detail: string }) {
  return (
    <>
      <span className="inline-flex size-12 shrink-0 items-center justify-center rounded-md bg-white/8 text-white transition-colors duration-300 group-hover/link:bg-white group-hover/link:text-brand">
        <Icon className="size-5" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-lede font-medium text-white">{title}</span>
        <span className="mt-0.5 block text-small text-on-navy-2">{detail}</span>
      </span>
      <Arrow className="text-white" />
    </>
  );
}

const row = "group/link flex w-full items-center gap-5 py-5 text-left lg:py-6";

/**
 * The close on every page: a navy panel with GIP's own invitation ("Let's start a conversation.") and three ways to
 * reach a person as rows: call, WhatsApp, a site visit. The roof mark sits large and faint in the corner.
 */
export function Closing({
  title = `${CLOSING_CTA.heading} ${CLOSING_CTA.accent}.`,
  text = CLOSING_CTA.lede,
  interest,
  whatsapp = WHATSAPP_TEXT.home,
}: {
  title?: ReactNode;
  text?: string;
  interest?: InterestId;
  whatsapp?: string;
}) {
  const { openEnquiry } = useEnquiry();
  return (
    <section aria-labelledby="closing-title" className="py-20 lg:py-28">
      <Container>
        <div className="on-navy relative isolate overflow-hidden rounded-2xl bg-navy-deep px-6 py-12 sm:px-10 sm:py-14 lg:grid lg:grid-cols-12 lg:gap-10 lg:px-16 lg:py-20">
          <Logo
            mark
            variant="white"
            width={640}
            className="pointer-events-none absolute -right-24 -bottom-16 -z-10 w-[420px] opacity-[0.06] lg:w-[640px]"
          />
          <div className="lg:col-span-5">
            <h2 id="closing-title" className="text-h2">
              {title}
            </h2>
            <p className="mt-5 max-w-[42ch] text-lede">{text}</p>
          </div>
          <ul className="mt-10 divide-y divide-white/12 border-y border-white/12 lg:col-span-6 lg:col-start-7 lg:mt-0 lg:self-center">
            <li>
              <a href={whatsappUrl(whatsapp)} target="_blank" rel="noreferrer" className={row}>
                <Row icon={WhatsAppIcon} title="Message us on WhatsApp" detail={`Send a plot size, a facing or a question · ${OFFICE.hours}`} />
              </a>
            </li>
            <li>
              <button type="button" onClick={() => openEnquiry({ interest })} className={row}>
                <Row icon={CalendarDays} title="Book a site visit" detail="We walk the plots with you, at a time that suits you" />
              </button>
            </li>
          </ul>
        </div>
      </Container>
    </section>
  );
}
