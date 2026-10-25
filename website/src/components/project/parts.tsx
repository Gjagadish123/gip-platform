"use client";

import { Check, Copy } from "lucide-react";
import { useEffect, useRef, useState, type KeyboardEvent, type ReactNode } from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/**
 * Arrow keys (either axis), Home and End move between tabs or radios and select the one reached (WAI-ARIA automatic
 * activation). Both axes so the same handler serves the vertical amenity tabs and the horizontal controls.
 */
export function rovingTabKey<T extends string>(e: KeyboardEvent, ids: readonly T[], current: T, select: (id: T) => void, idOf: (id: T) => string) {
  const i = ids.indexOf(current);
  const next =
    e.key === "ArrowRight" || e.key === "ArrowDown" ? ids[(i + 1) % ids.length]
    : e.key === "ArrowLeft" || e.key === "ArrowUp" ? ids[(i - 1 + ids.length) % ids.length]
    : e.key === "Home" ? ids[0]
    : e.key === "End" ? ids[ids.length - 1]
    : null;
  if (!next) return;
  e.preventDefault();
  select(next);
  document.getElementById(idOf(next))?.focus();
}

/**
 * GIP's segmented control: a mist track, the active segment white with a soft raise. It is a tablist that drives one
 * tabpanel (`panelId`). Segments grow to fill when the track is given a width (`className="flex w-full"`), and the
 * track scrolls sideways if a phone is too narrow for it.
 */
export function Segmented<T extends string>({
  label,
  options,
  value,
  onChange,
  idOf,
  panelId,
  className,
}: {
  label: string;
  options: readonly { id: T; label: ReactNode }[];
  value: T;
  onChange: (id: T) => void;
  idOf: (id: T) => string;
  panelId: string;
  className?: string;
}) {
  const ids = options.map((o) => o.id);
  return (
    <div
      role="tablist"
      aria-label={label}
      className={cn("inline-flex max-w-full gap-1 overflow-x-auto rounded-md bg-mist p-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden", className)}
    >
      {options.map((o) => {
        const on = o.id === value;
        return (
          <button
            key={o.id}
            id={idOf(o.id)}
            type="button"
            role="tab"
            aria-selected={on}
            aria-controls={panelId}
            tabIndex={on ? 0 : -1}
            onClick={() => onChange(o.id)}
            onKeyDown={(e) => rovingTabKey(e, ids, value, onChange, idOf)}
            className={cn(
              "inline-flex h-10 shrink-0 grow items-center justify-center gap-2 rounded-sm px-3 text-ui font-medium whitespace-nowrap transition-[background-color,color,box-shadow] duration-300 ease-(--ease-out) sm:px-4",
              on ? "bg-white text-navy shadow-raise" : "text-muted hover:text-navy",
            )}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

/** Copies a reference number; the icon turns to a check and "Copied" is announced for two seconds. */
export function CopyButton({ value, label }: { value: string; label: string }) {
  const [copied, setCopied] = useState(false);
  const timer = useRef<number>(undefined);
  useEffect(() => () => window.clearTimeout(timer.current), []);

  const copy = () => {
    navigator.clipboard
      .writeText(value)
      .then(() => {
        setCopied(true);
        window.clearTimeout(timer.current);
        timer.current = window.setTimeout(() => setCopied(false), 2000);
      })
      .catch(() => {});
  };

  return (
    <span className="inline-flex items-center gap-1.5">
      <Button variant="ghost" size="icon-sm" onClick={copy} aria-label={`Copy ${label}`} className="text-navy-soft">
        {copied ? <Check /> : <Copy />}
      </Button>
      <span aria-live="polite" className="text-small text-muted">
        {copied ? "Copied" : ""}
      </span>
    </span>
  );
}

/** Feature rows: a navy title and a muted line each, on hairlines. */
export function FeatureRows({ items, className }: { items: { title: string; text: string }[]; className?: string }) {
  return (
    <ul className={cn("divide-y divide-line", className)}>
      {items.map(({ title, text }) => (
        <li key={title} className="py-4 first:pt-0 last:pb-0">
          <p className="text-ui font-semibold text-navy">{title}</p>
          <p className="mt-1 text-small text-muted">{text}</p>
        </li>
      ))}
    </ul>
  );
}
