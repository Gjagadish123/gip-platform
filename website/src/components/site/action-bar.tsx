"use client";

import { CalendarDays, Download, Phone } from "lucide-react";
import { useSyncExternalStore } from "react";

import { COMPANY } from "@/lib/constants";
import { WHATSAPP_TEXT, whatsappUrl } from "@/lib/enquiry";
import { cn } from "@/lib/utils";

import { useEnquiry } from "./enquiry-provider";
import { WhatsAppIcon } from "./icons";

const subscribeScroll = (cb: () => void) => {
  window.addEventListener("scroll", cb, { passive: true });
  return () => window.removeEventListener("scroll", cb);
};
// Past the first screen (on Home, past the hero film, whose impression note sits in that corner), and not yet at the
// footer (the dock would cover the imprint).
const readPast = () => {
  const hero = document.getElementById("hero");
  const past = hero ? hero.getBoundingClientRect().bottom < window.innerHeight - 80 : window.scrollY > 560;
  return past && window.scrollY + window.innerHeight < document.documentElement.scrollHeight - 420;
};

const cell = "flex h-15 flex-col items-center justify-center gap-1 text-label font-medium text-white transition-colors active:bg-white/8";
const dock = "inline-flex h-10 items-center gap-2 rounded-md px-3.5 text-small font-medium text-navy transition-colors duration-300 hover:bg-mist";

/**
 * One tap to a person, everywhere. Phones: a navy bar fixed to the foot with Call, WhatsApp and Site visit. Desktop: a
 * small white dock in the bottom-right corner (the brochure on project pages, WhatsApp, the phone number) that appears
 * once the first screen has scrolled away; the minimal header carries Book a site visit and the menu. Both hide while
 * the enquiry drawer is open.
 */
export function ActionBar() {
  const { open, openEnquiry, page } = useEnquiry();
  const past = useSyncExternalStore(subscribeScroll, readPast, () => false);
  const text = page.projectName ? WHATSAPP_TEXT.project(page.projectName, page.projectLocation ?? "Hyderabad") : WHATSAPP_TEXT.home;
  const brochure = page.nav?.brochure;

  return (
    <>
      <div
        className={cn(
          "on-navy fixed inset-x-0 bottom-0 z-30 bg-navy-deep shadow-[0_-8px_24px_-12px_rgb(1_20_38/0.5)] transition-transform duration-500 ease-(--ease-out) lg:hidden",
          open && "translate-y-full",
        )}
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      >
        <div className="grid grid-cols-3 divide-x divide-white/12">
          <a href={`tel:${COMPANY.phoneE164}`} className={cell}>
            <Phone aria-hidden className="size-[18px]" />
            Call
          </a>
          <a href={whatsappUrl(text)} target="_blank" rel="noreferrer" className={cell}>
            <WhatsAppIcon className="size-[18px]" />
            WhatsApp
          </a>
          <button type="button" onClick={() => openEnquiry({ interest: page.interest })} className={cell}>
            <CalendarDays aria-hidden className="size-[18px]" />
            Site visit
          </button>
        </div>
      </div>

      <div
        className={cn(
          "fixed right-6 bottom-6 z-30 hidden transition-[opacity,translate] duration-500 ease-(--ease-out) lg:block",
          past && !open ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-3 opacity-0",
        )}
        inert={!past || open}
      >
        <div className="flex items-center gap-1 rounded-lg border border-line bg-white/95 p-1.5 shadow-overlay backdrop-blur-md">
          {brochure ? (
            <a href={brochure} target="_blank" rel="noreferrer" download className={dock}>
              <Download aria-hidden className="size-4 text-navy-soft" />
              Brochure
            </a>
          ) : null}
          <a href={whatsappUrl(text)} target="_blank" rel="noreferrer" className={dock}>
            <WhatsAppIcon className="size-4 text-whatsapp" />
            WhatsApp
          </a>
          <a href={`tel:${COMPANY.phoneE164}`} className={cn(dock, "bg-brand text-white hover:bg-navy-deep")}>
            <Phone aria-hidden className="size-4" />
            <span className="tabular-nums">{COMPANY.phone}</span>
          </a>
        </div>
      </div>
    </>
  );
}
