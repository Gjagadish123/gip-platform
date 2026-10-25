"use client";

import { ArrowRight, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Dialog as DialogPrimitive } from "radix-ui";
import { useEffect, useLayoutEffect, useRef, useState } from "react";

import { Arrow, Button } from "@/components/ui/button";
import { COMPANY } from "@/lib/constants";
import { WHATSAPP_TEXT, whatsappUrl } from "@/lib/enquiry";
import { COPYRIGHT_YEAR, OFFICE } from "@/lib/site";
import { cn } from "@/lib/utils";

import { Container } from "./container";
import { useEnquiry } from "./enquiry-provider";
import { FacebookIcon, InstagramIcon, WhatsAppIcon } from "./icons";
import { Logo } from "./logo";
import { StatusChip } from "./typography";

/** The whole menu, in order. Projects carries the selling layout and the delivered register. */
const LINKS: { href: string; label: string; sub?: { href: string; label: string; selling?: boolean }[] }[] = [
  { href: "/", label: "Home" },
  {
    href: "/projects",
    label: "Projects",
    sub: [
      { href: "/projects/global-city-vi", label: "Global City VI", selling: true },
      { href: "/projects#delivered", label: "Delivered layouts" },
    ],
  },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
];

const inSection = (pathname: string, href: string) => (href === "/" ? pathname === "/" : pathname.startsWith(href));

// Same query as MOTION_OK in motion/gsap, inlined so the header does not carry GSAP onto every page.
const MOTION_OK = "(prefers-reduced-motion: no-preference)";
const WIPE = "cubic-bezier(0.87, 0, 0.13, 1)"; // expo.inOut
const EASE = "cubic-bezier(0.16, 1, 0.3, 1)"; // the site ease (expo.out)
const SHUT = "inset(0% 0% 100% 0%)";
const SHOWN = "inset(0% 0% 0% 0%)";

/** One entrance on every match inside the menu, each `step` ms after the one before. */
const stagger = (root: HTMLElement, sel: string, frames: PropertyIndexedKeyframes, delay: number, step: number, duration: number, easing = EASE) =>
  Array.from(root.querySelectorAll(sel)).map((el, i) => el.animate(frames, { duration, easing, delay: delay + i * step, fill: "backwards" }));

/** Menu and Close share one shape and sit at the same spot, so Close lands exactly where Menu was. */
const barButton = "inline-flex h-11 items-center gap-2.5 rounded-md border pr-3.5 pl-3 text-ui font-medium transition-colors sm:h-10";
const onNavy = "border-white/30 bg-white/8 text-white hover:bg-white/15";
const contact = "inline-flex min-h-11 items-center font-medium text-white transition-colors duration-300 hover:text-teal";
const social =
  "inline-flex size-11 items-center justify-center rounded-md border border-white/20 text-white transition-colors duration-300 hover:border-teal hover:text-teal";

/** The open menu: navy-deep overlay (grain) and the scrolling content above it, wiped in and out together. */
function MenuPanel({ onClosed }: { onClosed: () => void }) {
  const pathname = usePathname();
  const [openedOn] = useState(pathname);
  const { page, openEnquiry } = useEnquiry();
  const overlay = useRef<HTMLDivElement>(null);
  const content = useRef<HTMLDivElement>(null);
  const closing = useRef(false);
  const enquire = useRef(false);

  // Opening, before first paint: the sheet wipes down, the four links rise out of their masks, the rest settles.
  useLayoutEffect(() => {
    const root = content.current!;
    const sheet = [overlay.current!, root];
    const anims = window.matchMedia(MOTION_OK).matches
      ? [
          ...sheet.map((el) => el.animate({ clipPath: [SHUT, SHOWN] }, { duration: 800, easing: WIPE })),
          ...stagger(root, "[data-menu-rise]", { transform: ["translateY(130%)", "none"] }, 420, 60, 1000),
          ...stagger(root, "[data-menu-fade]", { opacity: [0, 1], transform: ["translateY(18px)", "none"] }, 560, 50, 900),
          ...stagger(root, "[data-menu-line]", { transform: ["scaleY(0)", "none"] }, 300, 0, 1100, WIPE),
        ]
      : sheet.map((el) => el.animate({ opacity: [0, 1] }, { duration: 250 }));
    return () => anims.forEach((a) => a.cancel());
  }, []);

  // Closing: the sheet wipes back up (a fade under reduced motion), then the dialog unmounts.
  const close = () => {
    if (closing.current) return;
    closing.current = true;
    const motion = window.matchMedia(MOTION_OK).matches;
    const sheet = [overlay.current!, content.current!];
    Promise.all(
      sheet.map(
        (el) => el.animate(motion ? { clipPath: [SHOWN, SHUT] } : { opacity: [1, 0] }, { duration: motion ? 600 : 200, easing: WIPE, fill: "forwards" }).finished,
      ),
    ).then(onClosed, () => {});
  };

  // Back / forward while open: the page changed underneath, so the menu steps aside (checked after every render;
  // close() only ever runs once).
  useEffect(() => {
    if (pathname !== openedOn) close();
  });

  return (
    <>
      <DialogPrimitive.Overlay ref={overlay} className="grain fixed inset-0 z-[80] bg-navy-deep" />
      <DialogPrimitive.Content
        ref={content}
        data-lenis-prevent
        aria-describedby={undefined}
        onEscapeKeyDown={(e) => {
          e.preventDefault();
          close();
        }}
        // Book a site visit: open the drawer once focus is back on Menu, so closing the drawer returns there.
        onCloseAutoFocus={() => {
          if (enquire.current) setTimeout(() => openEnquiry({ interest: page.interest }));
        }}
        // The right padding matches the scrollbar the scroll lock removed, so this row lines up with the header's.
        className="on-navy fixed inset-0 z-[80] flex flex-col overflow-y-auto overscroll-contain pr-[var(--removed-body-scroll-bar-size,0px)] outline-none"
      >
        <DialogPrimitive.Title className="sr-only">Menu</DialogPrimitive.Title>
        <Container className="flex h-16 shrink-0 items-center justify-between gap-6 lg:h-20">
          <Link href="/" onClick={close} aria-label={`${COMPANY.name} — home`} className="shrink-0">
            <Logo variant="white" width={120} className="w-[96px] lg:w-[116px]" />
          </Link>
          <button type="button" onClick={close} className={cn(barButton, onNavy)}>
            <X aria-hidden className="size-4" />
            Close
          </button>
        </Container>

        <Container className="grid flex-1 content-center gap-y-12 py-8 lg:grid-cols-12 lg:gap-x-10 lg:py-12">
          <nav aria-label="Menu" className="lg:col-span-7 lg:self-center">
            {/* Hovering or focusing one link dims the others. */}
            <ul className="flex flex-col lg:gap-1 [&:has([data-primary]:is(:hover,:focus-visible))_[data-primary]:not(:hover,:focus-visible)]:opacity-40">
              {LINKS.map((l, i) => {
                const on = inSection(pathname, l.href);
                return (
                  <li key={l.href}>
                    {/* The mask the link rises out of; its padding leaves room for the focus ring. */}
                    <div className="-mx-2 overflow-hidden p-2 text-title">
                      <div data-menu-rise>
                        <Link
                          href={l.href}
                          onClick={close}
                          data-primary
                          aria-current={pathname === l.href ? "page" : on ? "true" : undefined}
                          className="group/link inline-flex items-center gap-4 rounded-md py-1.5 text-white transition-[translate,opacity] duration-500 ease-(--ease-out) hover:translate-x-3 focus-visible:translate-x-3 lg:gap-6"
                        >
                          <span aria-hidden className="w-7 text-label text-teal tabular-nums">{String(i + 1).padStart(2, "0")}</span>
                          {l.label}
                          {on ? <span aria-hidden className="size-2 rounded-full bg-teal lg:size-2.5" /> : null}
                          <ArrowRight
                            aria-hidden
                            className="size-[0.5em] -translate-x-3 text-teal opacity-0 transition-[translate,opacity] duration-500 ease-(--ease-out) group-hover/link:translate-x-0 group-hover/link:opacity-100 group-focus-visible/link:translate-x-0 group-focus-visible/link:opacity-100"
                          />
                        </Link>
                      </div>
                    </div>
                    {l.sub ? (
                      // Indented to the label: the index column (w-7) plus the gap.
                      <ul className="mb-2 flex flex-col pl-11 lg:mb-3 lg:pl-13">
                        {l.sub.map((s) => (
                          <li key={s.href} data-menu-fade>
                            <Link
                              href={s.href}
                              onClick={close}
                              aria-current={pathname === s.href ? "page" : undefined}
                              className="group/sub inline-flex min-h-11 items-center gap-3 rounded-md text-ui font-medium text-on-navy-2 transition-colors duration-300 hover:text-white aria-[current=page]:text-white"
                            >
                              <span
                                aria-hidden
                                className="h-px w-5 bg-white/30 transition-[width,background-color] duration-500 ease-(--ease-out) group-hover/sub:w-8 group-hover/sub:bg-teal group-aria-[current=page]/sub:bg-teal"
                              />
                              {s.label}
                              {s.selling ? (
                                <StatusChip tone="go-navy" className="h-6">
                                  Selling now
                                </StatusChip>
                              ) : null}
                            </Link>
                          </li>
                        ))}
                      </ul>
                    ) : null}
                  </li>
                );
              })}
            </ul>
          </nav>

          <div className="relative flex flex-col gap-10 border-t border-white/12 pt-10 lg:col-span-5 lg:justify-between lg:border-t-0 lg:pt-0 lg:pl-12 xl:pl-16">
            <span data-menu-line aria-hidden className="absolute inset-y-0 left-0 hidden w-px origin-top bg-white/12 lg:block" />
            <dl className="grid gap-6">
              <div data-menu-fade>
                <dt className="text-label text-on-navy-2">Call</dt>
                <dd>
                  <a href={`tel:${COMPANY.phoneE164}`} className={cn(contact, "text-h3 tabular-nums")}>
                    {COMPANY.phone}
                  </a>
                </dd>
              </div>
              <div data-menu-fade>
                <dt className="text-label text-on-navy-2">Email</dt>
                <dd>
                  <a href={`mailto:${COMPANY.email}`} className={cn(contact, "text-ui break-all")}>
                    {COMPANY.email}
                  </a>
                </dd>
              </div>
              <div data-menu-fade>
                <dt className="text-label text-on-navy-2">Office</dt>
                <dd className="mt-2">
                  <address className="text-ui text-white not-italic">
                    {OFFICE.line1}
                    <br />
                    {OFFICE.line2}
                  </address>
                  <p className="mt-1.5 text-small text-on-navy-2">{OFFICE.hours}</p>
                </dd>
              </div>
            </dl>

            <div data-menu-fade className="flex flex-col-reverse gap-6 max-lg:order-first lg:flex-col">
              <ul className="flex gap-2">
                <li>
                  <a href={COMPANY.social.facebook} target="_blank" rel="noreferrer" aria-label="Facebook" className={social}>
                    <FacebookIcon />
                  </a>
                </li>
                <li>
                  <a href={COMPANY.social.instagram} target="_blank" rel="noreferrer" aria-label="Instagram" className={social}>
                    <InstagramIcon />
                  </a>
                </li>
                <li>
                  <a href={whatsappUrl(WHATSAPP_TEXT.home)} target="_blank" rel="noreferrer" aria-label="WhatsApp" className={social}>
                    <WhatsAppIcon className="size-4" />
                  </a>
                </li>
              </ul>
              <Button
                variant="teal"
                size="lg"
                aria-haspopup="dialog"
                onClick={() => {
                  enquire.current = true;
                  close();
                }}
                className="w-full sm:w-auto sm:self-start"
              >
                Book a site visit
                <Arrow />
              </Button>
            </div>
          </div>
        </Container>

        <Container className="shrink-0 pb-[calc(1.25rem+env(safe-area-inset-bottom))]">
          <p data-menu-fade className="border-t border-white/12 pt-5 text-small text-on-navy-2">
            © {COPYRIGHT_YEAR} {COMPANY.name}
          </p>
        </Container>
      </DialogPrimitive.Content>
    </>
  );
}

/**
 * The Menu button (two-line glyph) and the full-screen menu it opens on every page: navy-deep with grain, wiping down
 * from the top. The four pages are set large with their 01–04 index, Projects with its two sub-links, the current one
 * marked in teal; beside them (below on phones) the phone, email, office, social links and a teal Book a site visit.
 * Escape, Close, a link or a route change wipes it back up; under reduced motion it fades. Modal and focus-trapped
 * (Radix Dialog); animated with the Web Animations API.
 */
export function SiteMenu({ dark }: { dark: boolean }) {
  const [open, setOpen] = useState(false);

  return (
    <DialogPrimitive.Root open={open} onOpenChange={setOpen}>
      <DialogPrimitive.Trigger
        className={cn(barButton, "group/menu", dark ? onNavy : "border-line-strong bg-white text-navy hover:bg-mist")}
      >
        <span aria-hidden className="flex w-4 flex-col gap-[5px]">
          <span className="h-[1.5px] w-full rounded-full bg-current" />
          <span className="h-[1.5px] w-2/3 rounded-full bg-current transition-[width] duration-500 ease-(--ease-out) group-hover/menu:w-full" />
        </span>
        Menu
      </DialogPrimitive.Trigger>
      <DialogPrimitive.Portal>
        <MenuPanel onClosed={() => setOpen(false)} />
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
