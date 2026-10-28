// The enquiry hand-off. No backend yet: a valid form opens WhatsApp with the message prefilled (the channel plot
// buyers in Telangana already use) and offers the same body as a mailto link.
// ponytail: add the Supabase insert here when the backend ships; keep the WhatsApp hand-off as the visible confirmation.
import { COMPANY } from "./constants";
import { formatArea } from "./format";
import type { Unit } from "./types";

// The four layouts in the live layouts app (LIVE_LAYOUT_IDS) by project id, so an enquiry names its project.
export const INTERESTS = [
  { id: "global-city-vi", label: "Global City VI" },
  { id: "global-city-v", label: "Global City V" },
  { id: "global-city-rrr", label: "Global City RRR" },
  { id: "western-county", label: "Western County – Shankarpalli" },
  { id: "other", label: "Another GIP layout" },
  { id: "general", label: "General enquiry" },
] as const;
export type InterestId = (typeof INTERESTS)[number]["id"];

export interface EnquiryPlot {
  /** The layout the plot is on: plot numbers repeat across projects, so a plot picked on a map names it. */
  project?: string;
  /** The plot isn't available: the visitor is asking for plots like it. */
  similar?: boolean;
  number: string;
  area: number;
  facing?: string;
  roadWidthFt?: number;
}

/** Country codes offered beside the phone field; "other" means the number field carries its own code. */
export const DIAL_CODES = [
  { code: "+91", label: "India" },
  { code: "+971", label: "UAE" },
  { code: "+1", label: "USA / Canada" },
  { code: "+44", label: "UK" },
  { code: "+65", label: "Singapore" },
  { code: "+966", label: "Saudi Arabia" },
  { code: "+974", label: "Qatar" },
  { code: "other", label: "Other" },
] as const;
export type DialCode = (typeof DIAL_CODES)[number]["code"];

/**
 * Keeps only what the field may hold: digits, plus a leading + when the code is "other". No truncation to the exact
 * length: a pasted "+91 98765 43210" must fail validation, not silently become a different 10-digit number.
 */
export function cleanPhone(dial: DialCode, raw: string): string {
  if (dial !== "other") return raw.replace(/\D/g, "").slice(0, 15);
  return raw.replace(/[^\d+]/g, "").replace(/(?!^)\+/g, "").slice(0, 16);
}

/** The problem and the fix, or null when the number is valid for its code. */
export function phoneError(dial: DialCode, phone: string): string | null {
  if (dial === "+91")
    return /^[6-9]\d{9}$/.test(phone)
      ? null
      : "Enter your 10-digit mobile number without the country code or a leading 0.";
  if (dial === "other")
    return /^\+?\d{7,15}$/.test(phone) ? null : "Enter the full number with country code, 7 to 15 digits.";
  return /^\d{6,14}$/.test(phone) ? null : "Enter your mobile number without the country code.";
}

/** The number as the office will dial it: "+91 9876…" or, for "other", the typed number with its + restored. */
export const fullPhone = (dial: DialCode, phone: string) =>
  dial === "other" ? (phone.startsWith("+") ? phone : `+${phone}`) : `${dial} ${phone}`;

export interface Enquiry {
  name: string;
  dial: DialCode;
  phone: string; // national number, or the full international number when dial is "other"
  email?: string;
  interest: InterestId;
  plot?: EnquiryPlot;
  message?: string;
}

export const plotFromUnit = (u: Unit): EnquiryPlot => ({
  number: u.number,
  area: u.area,
  facing: u.facing,
  roadWidthFt: u.roadWidthFt,
});

export const describePlot = (p: EnquiryPlot) =>
  [`Plot ${p.number}`, formatArea(p.area, "sq_yd"), p.facing, p.roadWidthFt ? `${p.roadWidthFt} ft road` : undefined]
    .filter(Boolean)
    .join(" · ");

export const interestLabel = (id: InterestId) => INTERESTS.find((i) => i.id === id)?.label ?? "General enquiry";

export function enquiryBody(e: Enquiry): string {
  const about = e.plot?.project ?? interestLabel(e.interest);
  const interest = e.plot ? `${about}, ${e.plot.similar ? "plots similar to " : ""}${describePlot(e.plot)}` : about;
  return [
    "Hi Greater Infra Projects,",
    `Name: ${e.name.trim()}`,
    `Phone: ${fullPhone(e.dial, e.phone)}`,
    e.email?.trim() ? `Email: ${e.email.trim()}` : null,
    `Interested in: ${interest}`,
    e.message?.trim() ? `Message: ${e.message.trim()}` : null,
    "— sent from greaterinfraprojects.in",
  ]
    .filter(Boolean)
    .join("\n");
}

export const whatsappUrl = (text: string) => `https://wa.me/${COMPANY.whatsappE164}?text=${encodeURIComponent(text)}`;

export const buildWhatsAppUrl = (e: Enquiry) => whatsappUrl(enquiryBody(e));

export function buildMailto(e: Enquiry): string {
  const about = e.plot?.project ?? interestLabel(e.interest);
  const subject = e.plot
    ? `Enquiry — ${about}, ${e.plot.similar ? "plots similar to " : ""}Plot ${e.plot.number}`
    : `Enquiry — ${about}`;
  return `mailto:${COMPANY.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(enquiryBody(e))}`;
}

/** Quick WhatsApp messages for the tray and buttons (page-aware). */
export const WHATSAPP_TEXT = {
  home: "Hi GIP, I'd like to know about your current plots.",
  contact: "Hi GIP, I'd like to talk about a plot.",
  project: (name: string, location: string) =>
    `Hi GIP, I'm interested in ${name} at ${location}. Please share availability and price.`,
  plot: (name: string, p: EnquiryPlot) =>
    p.similar
      ? `Hi GIP, I'm looking for plots similar to ${describePlot(p)} at ${name}. What do you have available?`
      : `Hi GIP, I'm interested in ${describePlot(p)} at ${name}. Is it available?`,
} as const;

