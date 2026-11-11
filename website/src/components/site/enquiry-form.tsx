"use client";

import { ArrowUpRight, Check, ChevronDown, Mail, Send } from "lucide-react";
import { useId, useState, useSyncExternalStore, type FormEvent, type ReactNode } from "react";

import { Button } from "@/components/ui/button";
import { COMPANY } from "@/lib/constants";
import {
  buildMailto,
  cleanPhone,
  DIAL_CODES,
  fullPhone,
  INTERESTS,
  phoneError,
  saveEnquiry,
  type DialCode,
  type Enquiry,
  type EnquiryPlot,
  type InterestId,
} from "@/lib/enquiry";
import { formatArea } from "@/lib/format";
import { OFFICE } from "@/lib/site";
import { cn } from "@/lib/utils";

// Boxed controls: 48 px, 10 px radius, a hairline that turns navy with a soft navy halo on focus.
const control =
  "h-12 w-full min-w-0 rounded-md border border-line-strong bg-white px-4 text-base text-navy transition-[border-color,box-shadow] duration-300 ease-(--ease-out) placeholder:text-muted/80 hover:border-navy/35 focus:border-navy focus:shadow-[0_0_0_4px_rgb(25_66_107/0.1)] focus-visible:outline-none aria-[invalid=true]:border-destructive aria-[invalid=true]:shadow-[0_0_0_4px_rgb(198_40_40/0.1)]";
const link = "inline-flex items-center gap-1 font-medium text-navy underline decoration-navy/30 underline-offset-4 hover:decoration-navy";

type Errors = Partial<Record<"name" | "phone" | "email", string>>;
const noSubscribe = () => () => {};

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
 * over boxed controls, the country code joined to the phone field, a navy submit. A valid submit puts the enquiry in
 * the admin's Common sheet, where sales picks it up, and says so; if it can't be sent, the visitor is told and offered
 * the same message as an email. Editing a field after sending allows another send.
 */
export function EnquiryForm({
  interest: initialInterest = "general",
  projectName,
  plot,
  compact,
  onDone,
  className,
}: {
  interest?: InterestId;
  /** The page's project, offered first when it isn't one of INTERESTS. */
  projectName?: string;
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
  const options: readonly { id: InterestId; label: string }[] =
    projectName && !INTERESTS.some((i) => i.id === initialInterest) ? [{ id: initialInterest, label: projectName }, ...INTERESTS] : INTERESTS;
  const [message, setMessage] = useState("");
  const [errors, setErrors] = useState<Errors>({});
  const [state, setState] = useState<"idle" | "sending" | "done" | "error">("idle");
  const [last, setLast] = useState<Enquiry | null>(null);
  // False in the server HTML until React owns the form: a native submit before then would send the visitor's name
  // and phone to the server. A disabled default button also stops Enter from submitting. The form's
  // autoComplete="off" stops Firefox restoring the button's enabled state on reload (fields keep their own tokens),
  // and method="post" keeps any early submit out of the URL.
  const ready = useSyncExternalStore(noSubscribe, () => true, () => false);

  function validate(): Errors {
    const e: Errors = {};
    const n = name.trim();
    if (n.length < 2 || n.length > 60) e.name = "Please enter your name (2–60 characters).";
    const phoneErr = phoneError(dial, phone);
    if (phoneErr) e.phone = phoneErr;
    if (email.trim() && (email.trim().length > 120 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())))
      e.email = "That email doesn't look right.";
    return e;
  }

  // A changed field after a send (or a failed one) makes the form sendable again.
  const edited = () => {
    if (state === "done" || state === "error") setState("idle");
  };

  async function onSubmit(ev: FormEvent) {
    ev.preventDefault();
    if (state === "sending" || state === "done") return;
    const e = validate();
    setErrors(e);
    const first = Object.keys(e)[0];
    if (first) {
      document.getElementById(`${id}-${first}`)?.focus();
      return;
    }
    const enquiry: Enquiry = { name, dial, phone, email, interest, interestName: options.find((o) => o.id === interest && !INTERESTS.some((i) => i.id === o.id))?.label, plot, message };
    setLast(enquiry);
    setState("sending");
    try {
      // null: a build without the backend, which cannot send anything
      const saved = await saveEnquiry(enquiry, window.location.pathname);
      setState(saved == null ? "error" : "done");
      if (saved != null) onDone?.();
    } catch (err) {
      console.warn("Enquiry not sent", err);
      setState("error");
    }
  }

  return (
    <form method="post" autoComplete="off" onSubmit={onSubmit} noValidate className={cn("flex flex-col", className)}>
      <div className={cn("grid gap-y-6", compact ? "grid-cols-1" : "sm:grid-cols-2 sm:gap-x-5 lg:gap-y-7")}>
        {plot ? (
          <dl className={cn("grid grid-cols-2 gap-x-6 gap-y-4 rounded-lg border border-line bg-mist p-5", !compact && "sm:col-span-2 sm:grid-cols-4")}>
            {plot.similar ? (
              <p className="col-span-full -mb-1 text-label font-medium text-muted">
                Plots similar to{plot.project ? ` this one at ${plot.project}` : " this one"}
              </p>
            ) : null}
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
            onChange={(e) => {
              setName(e.target.value);
              edited();
            }}
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
                  edited();
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
              onChange={(e) => {
                setPhone(cleanPhone(dial, e.target.value));
                edited();
              }}
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
            onChange={(e) => {
              setEmail(e.target.value);
              edited();
            }}
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
              onChange={(e) => {
                setInterest(e.target.value as InterestId);
                edited();
              }}
              className={cn(control, "cursor-pointer appearance-none pr-10")}
            >
              {options.map((i) => (
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
            onChange={(e) => {
              setMessage(e.target.value);
              edited();
            }}
            className={cn(control, "h-auto resize-y py-3")}
            placeholder="Plot size, budget, or when you'd like to visit"
          />
        </Field>
      </div>

      <div className={cn("mt-8 flex flex-col gap-4", !compact && "sm:flex-row sm:items-center sm:gap-6 lg:mt-10")}>
        <Button type="submit" size="lg" className="w-full sm:w-auto" disabled={!ready || state === "sending" || state === "done"}>
          {state === "done" ? <Check className="size-4" /> : <Send className="size-4" />}
          {state === "sending" ? "Sending…" : state === "done" ? "Sent" : "Send enquiry"}
        </Button>
        <p className="max-w-[46ch] text-small text-muted">
          Goes straight to our sales team. By sending, you agree that {COMPANY.name} may contact you about this enquiry.
        </p>
      </div>
      {/* Always mounted so the outcome is announced when it fills. */}
      <p role="status" className="mt-4 max-w-[62ch] text-small text-text empty:mt-0">
        {state === "done" && last ? (
          <>
            Thank you, {last.name.trim().split(/\s+/)[0]}. Our sales team has your enquiry and will call you on{" "}
            <span className="whitespace-nowrap">{fullPhone(last.dial, last.phone)}</span> ({OFFICE.hours}).
          </>
        ) : state === "error" && last ? (
          <span className="text-destructive">
            We couldn&rsquo;t send it just now. Please try again, or{" "}
            <a href={buildMailto(last)} className={link}>
              <Mail className="size-3.5" aria-hidden /> email it to us <ArrowUpRight className="size-3.5" aria-hidden />
            </a>
            .
          </span>
        ) : null}
      </p>
    </form>
  );
}
