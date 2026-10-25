"use client";

import type { ReactNode } from "react";

import { Arrow, Button } from "@/components/ui/button";
import type { InterestId } from "@/lib/enquiry";

import { useEnquiry } from "./enquiry-provider";

/** A button that opens the enquiry drawer ("Book a site visit", "Enquire about these plots"). */
export function EnquireButton({
  children = "Book a site visit",
  interest,
  variant = "primary",
  size = "default",
  arrow,
  className,
}: {
  children?: ReactNode;
  interest?: InterestId;
  variant?: "primary" | "secondary" | "light" | "teal" | "outline-light" | "ghost" | "link";
  size?: "default" | "sm" | "lg";
  arrow?: boolean;
  className?: string;
}) {
  const { openEnquiry, open } = useEnquiry();
  return (
    <Button variant={variant} size={size} className={className} onClick={() => openEnquiry({ interest })} aria-haspopup="dialog" aria-expanded={open}>
      {children}
      {arrow ? <Arrow /> : null}
    </Button>
  );
}
