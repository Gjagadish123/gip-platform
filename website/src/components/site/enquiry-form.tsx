"use client";

import { ArrowUpRight, ChevronDown, Mail, Phone } from "lucide-react";
import { useId, useState, type FormEvent, type ReactNode } from "react";

import { Button } from "@/components/ui/button";
import { COMPANY } from "@/lib/constants";
import {
  buildMailto,
  buildWhatsAppUrl,
  cleanPhone,
  DIAL_CODES,
  INTERESTS,
  phoneError,
  type DialCode,
  type Enquiry,
  type EnquiryPlot,
  type InterestId,
} from "@/lib/enquiry";
import { formatArea } from "@/lib/format";
import { cn } from "@/lib/utils";

import { WhatsAppIcon } from "./icons";

// Boxed controls: 48 px, 10 px radius, a hairline that turns navy with a soft navy halo on focus.
const control =
  "h-12 w-full min-w-0 rounded-md border border-line-strong bg-white px-4 text-base text-navy transition-[border-color,box-shadow] duration-300 ease-(--ease-out) placeholder:text-muted/80 hover:border-navy/35 focus:border-navy focus:shadow-[0_0_0_4px_rgb(3_57_103/0.1)] focus-visible:outline-none aria-[invalid=true]:border-destructive aria-[invalid=true]:shadow-[0_0_0_4px_rgb(198_40_40/0.1)]";
const link = "inline-flex items-center gap-1 font-medium text-navy underline decoration-navy/30 underline-offset-4 hover:decoration-navy";

type Errors = Partial<Record<"name" | "phone" | "email", string>>;

/** One field: the 13 px label, the control, the error under it. */
function Field({
  label,
  htmlFor,
  optional,
  error,
  errorId,
  className,
  children,
}: {
  label: string;
  htmlFor: string;
  optional?: boolean;
  error?: string;
  errorId?: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div className={cn("flex min-w-0 flex-col gap-2", className)}>
      <label htmlFor={htmlFor} className={cn("text-label", error ? "text-destructive" : "text-navy")}>
        {label}
        {optional ? <span className="ml-1.5 font-normal text-muted">(optional)</span> : null}
      </label>
      {children}
      {error ? (
        <p id={errorId} className="text-small text-destructive">
          {error}
        </p>
      ) : null}
    </div>
  );
}

/**
 * The one enquiry form (Contact page, the enquiry drawer, the project page): two columns (one in the drawer), labels
 * over boxed controls, the country code joined to the phone field, a navy submit. A valid submit opens WhatsApp with
 * the message prefilled, then offers call and a mailto with the same body.
 * ponytail: add the Supabase insert here when the backend ships.
 */
export function EnquiryForm({
  interest: initialInterest = "general",
  plot,
  compact,
  onDone,
  className,
}: {
  interest?: InterestId;
  plot?: EnquiryPlot;
  compact?: boolean;
  onDone?: () => void;
  className?: string;
}) {
  const id = useId();
  const [name, setName] = useState("");
  const [dial, setDial] = useState<DialCode>("+91");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [interest, setInterest] = useState<InterestId>(initialInterest);
  const [message, setMessage] = useState("");
  const [errors, setErrors] = useState<Errors>({});
  const [state, setState] = useState<"idle" | "opening" | "done">("idle");
  const [last, setLast] = useState<Enquiry | null>(null);

  function validate(): Errors {
    const e: Errors = {};
    const n = name.trim();
    if (n.length < 2 || n.length > 60) e.name = "Please enter your name (2–60 characters).";
    const phoneErr = phoneError(dial, phone);
    if (phoneErr) e.phone = phoneErr;
    if (email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) e.email = "That email doesn't look right.";
    return e;
  }

  function onSubmit(ev: FormEvent) {
    ev.preventDefault();
    const e = validate();
    setErrors(e);
    const first = Object.keys(e)[0];
    if (first) {
      document.getElementById(`${id}-${first}`)?.focus();
      return;
    }
    const enquiry: Enquiry = { name, dial, phone, email, interest, plot, message };
    setLast(enquiry);
    setState("opening");
    window.open(buildWhatsAppUrl(enquiry), "_blank", "noopener");
    window.setTimeout(() => {
      setState("done");
      onDone?.();
    }, 800);
  }

  return (
    <form onSubmit={onSubmit} noValidate className={cn("flex flex-col", className)}>
      <div className={cn("grid gap-y-6", compact ? "grid-cols-1" : "sm:grid-cols-2 sm:gap-x-5 lg:gap-y-7")}>
        {plot ? (
          <dl className={cn("grid grid-cols-2 gap-x-6 gap-y-4 rounded-lg border border-line bg-mist p-5 sm:grid-cols-4", !compact && "sm:col-span-2")}>
            {[
              ["Plot", plot.number],
              ["Area", formatArea(plot.area, "sq_yd")],
              ["Facing", plot.facing],
              ["Road", plot.roadWidthFt ? `${plot.roadWidthFt} ft` : undefined],
            ]
              .filter((p): p is [string, string] => !!p[1])
              .map(([k, v]) => (
                <div key={k} className="flex flex-col gap-1">
                  <dt className="text-label font-medium text-muted">{k}</dt>
                  <dd className={k === "Plot" ? "text-h3 text-navy tabular-nums" : "text-body font-medium text-navy"}>{v}</dd>
                </div>
              ))}
          </dl>
        ) : null}

        <Field label="Full name" htmlFor={`${id}-name`} error={errors.name} errorId={`${id}-name-err`}>
          <input
            id={`${id}-name`}
            name="name"
            autoComplete="name"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            aria-invalid={!!errors.name}
            aria-describedby={errors.name ? `${id}-name-err` : undefined}
            className={control}
            placeholder="Enter your name"
          />
        </Field>

        <Field label="Phone number" htmlFor={`${id}-phone`} error={errors.phone} errorId={`${id}-phone-err`}>
          <div className="flex">
            {/* Native select under a visible "+91 ⌄" box: the closed control shows only the code, the open list names the country. */}
            <span className="relative inline-flex h-12 shrink-0 items-center gap-1 rounded-l-md border border-r-0 border-line-strong bg-mist px-3 text-base font-medium text-navy transition-colors hover:bg-mist-2 has-[select:focus-visible]:outline-2 has-[select:focus-visible]:outline-offset-2 has-[select:focus-visible]:outline-navy">
              <span aria-hidden className="tabular-nums">
                {dial === "other" ? "Other" : dial}
              </span>
              <ChevronDown aria-hidden className="size-4 text-muted" />
              <select
                name="dial"
                aria-label="Country code"
                value={dial}
                onChange={(e) => {
                  const next = e.target.value as DialCode;
                  setDial(next);
                  setPhone((p) => cleanPhone(next, p));
                }}
                className="absolute inset-0 cursor-pointer appearance-none opacity-0"
              >
                {DIAL_CODES.map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.code === "other" ? "Other: type the full number" : `${c.label} (${c.code})`}
                  </option>
                ))}
              </select>
            </span>
            <input
              id={`${id}-phone`}
              name="phone"
              type="tel"
              inputMode={dial === "other" ? "tel" : "numeric"}
              autoComplete={dial === "other" ? "tel" : "tel-national"}
              required
              value={phone}
              onChange={(e) => setPhone(cleanPhone(dial, e.target.value))}
              aria-invalid={!!errors.phone}
              aria-describedby={errors.phone ? `${id}-phone-err` : undefined}
              className={cn(control, "rounded-l-none tabular-nums")}
              placeholder={dial === "+91" ? "98XXX XXXXX" : dial === "other" ? "+ country code and number" : "Mobile number"}
            />
          </div>
        </Field>

        <Field label="Email address" optional htmlFor={`${id}-email`} error={errors.email} errorId={`${id}-email-err`}>
          <input
            id={`${id}-email`}
            name="email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            aria-invalid={!!errors.email}
            aria-describedby={errors.email ? `${id}-email-err` : undefined}
            className={control}
            placeholder="you@example.com"
          />
        </Field>

        <Field label="Project interested in" htmlFor={`${id}-interest`}>
          <div className="relative">
            <select
              id={`${id}-interest`}
              name="interest"
              value={interest}
              onChange={(e) => setInterest(e.target.value as InterestId)}
              className={cn(control, "cursor-pointer appearance-none pr-10")}
            >
              {INTERESTS.map((i) => (
                <option key={i.id} value={i.id}>
                  {i.label}
                </option>
              ))}
            </select>
            <ChevronDown aria-hidden className="pointer-events-none absolute top-1/2 right-4 size-4 -translate-y-1/2 text-navy" />
          </div>
        </Field>

        <Field label="Message" optional htmlFor={`${id}-message`} className={compact ? undefined : "sm:col-span-2"}>
          <textarea
            id={`${id}-message`}
            name="message"
            rows={compact ? 3 : 4}
            maxLength={500}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            className={cn(control, "h-auto resize-y py-3")}
            placeholder="Plot size, budget, or when you'd like to visit"
          />
        </Field>
      </div>

      <div className={cn("mt-8 flex flex-col gap-4", !compact && "sm:flex-row sm:items-center sm:gap-6 lg:mt-10")}>
        <Button type="submit" size="lg" className="w-full sm:w-auto" disabled={state === "opening"}>
          <WhatsAppIcon className="size-4" />
          {state === "opening" ? "Opening WhatsApp…" : state === "done" ? "Send again on WhatsApp" : "Send on WhatsApp"}
        </Button>
        <p className="max-w-[46ch] text-small text-muted">
          Opens WhatsApp with your message to {COMPANY.phone}. By sending, you agree that {COMPANY.name} may contact you
          about this enquiry.
        </p>
      </div>
      {/* Always mounted so the confirmation is announced when it fills. */}
      <p role="status" className="mt-4 max-w-[62ch] text-small text-text empty:mt-0">
        {state === "done" && last ? (
          <>
            If WhatsApp didn&rsquo;t open,{" "}
            <a href={`tel:${COMPANY.phoneE164}`} className={link}>
              <Phone className="size-3.5" aria-hidden /> call {COMPANY.phone}
            </a>{" "}
            or{" "}
            <a href={buildMailto(last)} className={link}>
              <Mail className="size-3.5" aria-hidden /> email us <ArrowUpRight className="size-3.5" aria-hidden />
            </a>
            .
          </>
        ) : null}
      </p>
    </form>
  );
}
