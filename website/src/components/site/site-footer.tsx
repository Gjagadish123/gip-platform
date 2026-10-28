import Link from "next/link";

import { COMPANY } from "@/lib/constants";
import { COPYRIGHT_YEAR, OFFICE } from "@/lib/site";
import { cn } from "@/lib/utils";

import { Aurora } from "./aurora";
import { Container } from "./container";
import { DisclaimerDialog } from "./disclaimer-dialog";
import { FacebookIcon, InstagramIcon, WhatsAppIcon } from "./icons";
import { Logo } from "./logo";
import { TextLink } from "./text-link";

const EXPLORE = [
  { href: "/", label: "Home" },
  { href: "/projects", label: "Projects" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
];
const PROJECTS = [
  { href: "/projects/global-city-vi", label: "Global City VI" },
  { href: "/layouts", label: "Live layouts" },
  { href: "/projects#delivered", label: "Delivered layouts" },
];

const link = "text-ui text-text transition-colors hover:text-navy";
const social =
  "inline-flex size-10 items-center justify-center rounded-md border border-line-strong bg-white text-navy transition-colors hover:border-navy/35 hover:bg-mist";

/**
 * Footer on the teal-white mist: the lockup and GIP's own line "Doing business the right way." over a short teal rule, the
 * link columns (teal-deep headings) and the office, then the imprint. Bottom padding on phones clears the action bar.
 */
export function SiteFooter() {
  return (
    <footer className="relative isolate border-t border-line pb-[calc(3.75rem+env(safe-area-inset-bottom))] lg:pb-0">
      <Aurora scene="a" />
      <Container className="grid gap-14 py-16 lg:grid-cols-12 lg:gap-10 lg:py-20">
        <div className="lg:col-span-4">
          <Logo variant="navy" width={150} className="w-[132px] lg:w-[150px]" />
          <p className="mt-8 max-w-[18ch] text-h3 font-medium text-navy">Doing business the right way.</p>
          <span aria-hidden className="mt-6 block h-0.5 w-12 bg-teal" />
          <ul className="mt-8 flex gap-2">
            <li>
              <a href={COMPANY.social.facebook} target="_blank" rel="noreferrer" aria-label="Facebook" className={social}>
                <FacebookIcon className="size-4" />
              </a>
            </li>
            <li>
              <a href={COMPANY.social.instagram} target="_blank" rel="noreferrer" aria-label="Instagram" className={social}>
                <InstagramIcon className="size-4" />
              </a>
            </li>
            <li>
              <a href={`https://wa.me/${COMPANY.whatsappE164}`} target="_blank" rel="noreferrer" aria-label="WhatsApp" className={social}>
                <WhatsAppIcon className="size-4" />
              </a>
            </li>
          </ul>
        </div>

        <nav aria-label="Footer" className="grid grid-cols-2 gap-10 sm:grid-cols-3 lg:col-span-8">
          <div>
            <h2 className="text-label text-teal-deep">Explore</h2>
            <ul className="mt-5 flex flex-col gap-3">
              {EXPLORE.map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className={link}>
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h2 className="text-label text-teal-deep">Projects</h2>
            <ul className="mt-5 flex flex-col gap-3">
              {PROJECTS.map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className={link}>
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <div className="col-span-2 sm:col-span-1">
            <h2 className="text-label text-teal-deep">Office</h2>
            <address className="mt-5 text-ui text-text not-italic">
              {OFFICE.line1}
              <br />
              {OFFICE.line2}
            </address>
            <p className="mt-3 text-small text-muted">{OFFICE.hours}</p>
            <ul className="mt-4 flex flex-col gap-2">
              <li>
                <a href={`tel:${COMPANY.phoneE164}`} className={cn(link, "font-medium text-navy tabular-nums")}>
                  {COMPANY.phone}
                </a>
              </li>
              <li>
                <a href={`mailto:${COMPANY.email}`} className={cn(link, "break-all")}>
                  {COMPANY.email}
                </a>
              </li>
            </ul>
            <TextLink href={OFFICE.directionsUrl} external className="mt-4 text-ui">
              Directions
            </TextLink>
          </div>
        </nav>
      </Container>

      <div className="border-t border-line">
        <Container className="flex flex-col gap-3 py-6 text-small text-muted sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {COPYRIGHT_YEAR} {COMPANY.name}. All rights reserved.
          </p>
          <p className="flex flex-wrap items-center gap-x-5 gap-y-2">
            <DisclaimerDialog />
            <span>TS RERA P01100009270 · Global City VI</span>
          </p>
        </Container>
      </div>
    </footer>
  );
}
