"use client";

import { Accordion as AccordionPrimitive } from "radix-ui";

import { cn } from "@/lib/utils";

/**
 * Questions as rows on hairlines: the question in navy at 20 → 24 px, a plus that turns into a minus, the answer in
 * body text. One open at a time; the content height animates.
 */
export function FaqList({ items, className }: { items: readonly { q: string; a: string }[]; className?: string }) {
  return (
    <AccordionPrimitive.Root type="single" collapsible className={cn("border-t border-line", className)}>
      {items.map((f, i) => (
        <AccordionPrimitive.Item key={f.q} value={`q${i}`} className="border-b border-line">
          <AccordionPrimitive.Header>
            <AccordionPrimitive.Trigger className="group/q flex w-full items-start justify-between gap-6 py-6 text-left outline-hidden focus-visible:outline-2 focus-visible:outline-solid focus-visible:outline-offset-4 focus-visible:outline-navy lg:py-7">
              <span className="text-h3 font-medium text-navy transition-colors group-hover/q:text-navy-soft">{f.q}</span>
              <span
                aria-hidden
                className="relative mt-1 inline-flex size-8 shrink-0 items-center justify-center rounded-md border border-line-strong transition-colors duration-300 group-hover/q:border-navy/40 group-data-[state=open]/q:border-brand group-data-[state=open]/q:bg-brand"
              >
                <span className="absolute h-[1.5px] w-3 rounded-full bg-navy transition-colors group-data-[state=open]/q:bg-white" />
                <span className="absolute h-3 w-[1.5px] rounded-full bg-navy transition-[transform,background-color] duration-400 ease-(--ease-out) group-data-[state=open]/q:rotate-90 group-data-[state=open]/q:bg-white" />
              </span>
            </AccordionPrimitive.Trigger>
          </AccordionPrimitive.Header>
          <AccordionPrimitive.Content className="overflow-hidden data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down">
            <p className="max-w-[68ch] pr-14 pb-7 text-body text-text">{f.a}</p>
          </AccordionPrimitive.Content>
        </AccordionPrimitive.Item>
      ))}
    </AccordionPrimitive.Root>
  );
}
