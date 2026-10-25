"use client";

import { X } from "lucide-react";

import { Dialog, DialogClose, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { DISCLAIMER } from "@/lib/site";

/** The site disclaimer from the footer: a white dialog with a square close. */
export function DisclaimerDialog() {
  return (
    <Dialog>
      <DialogTrigger className="underline decoration-current/40 underline-offset-4 hover:decoration-current">Disclaimer</DialogTrigger>
      <DialogContent showCloseButton={false} className="gap-0 rounded-lg bg-white p-0 text-text ring-0 sm:max-w-lg">
        <DialogHeader className="gap-4 p-7 pr-20 text-left sm:p-10 sm:pr-24">
          <DialogTitle className="text-h3 text-navy">Disclaimer</DialogTitle>
          <DialogDescription className="text-body text-text">{DISCLAIMER}</DialogDescription>
        </DialogHeader>
        <DialogClose className="absolute top-5 right-5 inline-flex size-10 items-center justify-center rounded-md border border-line-strong text-navy transition-colors hover:bg-mist">
          <X aria-hidden className="size-5" />
          <span className="sr-only">Close</span>
        </DialogClose>
      </DialogContent>
    </Dialog>
  );
}
