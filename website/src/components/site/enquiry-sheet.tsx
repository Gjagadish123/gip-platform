"use client";

import { Phone, X } from "lucide-react";

import { Sheet, SheetClose, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { COMPANY } from "@/lib/constants";
import { OFFICE } from "@/lib/site";

import { EnquiryForm } from "./enquiry-form";
import { useEnquiry } from "./enquiry-provider";

/**
 * The global enquiry drawer (header, action bar, plot finder, closing band). Lives once in the root layout: a white
 * panel from the right with a square close, the form in one column and the phone line at the foot. Close sits last in
 * the DOM so focus opens on the first field and returns to the opener on close.
 */
export function EnquirySheet() {
  const { open, closeEnquiry, options, page, opener } = useEnquiry();
  const interest = options.interest ?? page.interest ?? "general";
  return (
    <Sheet open={open} onOpenChange={(o) => (o ? undefined : closeEnquiry())}>
      <SheetContent
        side="right"
        showCloseButton={false}
        className="gap-0 overflow-y-auto bg-white p-0 data-[side=right]:w-full data-[side=right]:border-l-0 data-[side=right]:sm:max-w-[500px]"
        onCloseAutoFocus={(e) => {
          if (opener.current?.isConnected) {
            e.preventDefault();
            opener.current.focus();
          }
        }}
      >
        <SheetHeader className="gap-3 border-b border-line px-6 pt-16 pb-7 sm:px-10 sm:pt-20">
          <SheetTitle className="text-h2 text-navy">{page.projectName ? `Enquire about ${page.projectName}` : "Book a site visit"}</SheetTitle>
          <SheetDescription className="max-w-[42ch] text-body text-text">
            Tell us what you are looking for. We reply on WhatsApp or by phone and arrange a visit at a time that suits you.
          </SheetDescription>
        </SheetHeader>
        <div className="px-6 pt-8 pb-10 sm:px-10">
          <EnquiryForm key={`${interest}-${options.plot?.number ?? ""}`} interest={interest} plot={options.plot} compact />
        </div>
        <p className="mt-auto flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 border-t border-line bg-mist px-6 py-5 text-small text-muted sm:px-10">
          <a href={`tel:${COMPANY.phoneE164}`} className="inline-flex items-center gap-2 text-ui font-medium text-navy tabular-nums">
            <Phone aria-hidden className="size-4 text-navy-soft" /> {COMPANY.phone}
          </a>
          {OFFICE.hours}
        </p>
        <SheetClose className="absolute top-4 right-4 inline-flex size-10 items-center justify-center rounded-md border border-line-strong text-navy transition-colors hover:bg-mist sm:top-6 sm:right-6">
          <X aria-hidden className="size-5" />
          <span className="sr-only">Close</span>
        </SheetClose>
      </SheetContent>
    </Sheet>
  );
}
