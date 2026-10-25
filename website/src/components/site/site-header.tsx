"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";

import { COMPANY } from "@/lib/constants";
import { cn } from "@/lib/utils";

import { Container } from "./container";
import { EnquireButton } from "./enquire-button";
import { useEnquiry, type ProjectNav } from "./enquiry-provider";
import { Logo } from "./logo";
import { SiteMenu } from "./site-menu";

// Over the home hero while #hero still covers the header's band.
const readOverHero = () => {
  const hero = document.getElementById("hero");
  return hero ? hero.getBoundingClientRect().bottom > 80 : false;
};
const subscribeScrollResize = (cb: () => void) => {
  window.addEventListener("scroll", cb, { passive: true });
  window.addEventListener("resize", cb);
  return () => {
    window.removeEventListener("scroll", cb);
    window.removeEventListener("resize", cb);
  };
};

/** The project page's own bar: name, registration, and its sections with the one in view marked. */
function ProjectBar({ nav }: { nav: ProjectNav }) {
  const ids = nav.links.map((l) => l.href.slice(1));
  const [active, setActive] = useState(ids[0]);
  const idsKey = ids.join(",");
  const strip = useRef<HTMLUListElement>(null);

  // On phones the strip scrolls sideways: keep the section in view centred in it (the strip only, never the page).
  useEffect(() => {
    const ul = strip.current;
    const a = ul?.querySelector<HTMLElement>("[aria-current=location]");
    if (!ul || !a || ul.scrollWidth <= ul.clientWidth) return;
    ul.scrollTo({ left: a.offsetLeft - (ul.clientWidth - a.offsetWidth) / 2, behavior: "smooth" });
  }, [active]);

  useEffect(() => {
    const els = idsKey
      .split(",")
      .map((id) => document.getElementById(id))
      .filter((el): el is HTMLElement => !!el);
    const io = new IntersectionObserver(
      (entries) => {
        const hit = entries.filter((e) => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];
        if (hit) setActive(hit.target.id);
      },
      { rootMargin: "-30% 0px -60% 0px" },
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, [idsKey]);

  return (
    <div className="border-b border-line bg-white/92 backdrop-blur-md">
      <Container className="flex h-12 items-center gap-6">
        <p className="hidden shrink-0 items-baseline gap-3 lg:flex">
          <span className="text-ui font-semibold tracking-[-0.015em] text-navy">{nav.name}</span>
          {nav.reg ? <span className="text-label font-medium text-muted">{nav.reg.split(" · ")[0]}</span> : null}
        </p>
        <nav aria-label={`${nav.name} sections`} className="-mx-5 min-w-0 flex-1 sm:-mx-8 lg:mx-0">
          <ul ref={strip} className="relative flex h-12 items-stretch gap-1 overflow-x-auto px-3 [scrollbar-width:none] sm:px-6 lg:justify-end lg:px-0 [&::-webkit-scrollbar]:hidden">
            {nav.links.map((l) => {
              const on = l.href.slice(1) === active;
              return (
                <li key={l.href} className="shrink-0">
                  <a
                    href={l.href}
                    aria-current={on ? "location" : undefined}
                    className={cn(
                      "relative flex h-full items-center px-2.5 text-small font-medium transition-colors duration-300",
                      on ? "text-navy" : "text-muted hover:text-navy",
                    )}
                  >
                    {l.label}
                    <span
                      aria-hidden
                      className={cn(
                        "absolute inset-x-2.5 bottom-0 h-0.5 origin-left rounded-full bg-navy transition-transform duration-500 ease-(--ease-out)",
                        on ? "scale-x-100" : "scale-x-0",
                      )}
                    />
                  </a>
                </li>
              );
            })}
          </ul>
        </nav>
      </Container>
    </div>
  );
}

/**
 * Fixed bar, 64 px on phones and 80 on desktop, carrying only the logo, Book a site visit (from 640 px) and Menu, which
 * opens the full-screen menu. Over the home hero it is transparent with the white logo and a white hairline button (the
 * hero keeps the one teal action); elsewhere a white blurred bar on a hairline. It slides away while the page scrolls down past 120 px and returns on any scroll up
 * or when focus enters it (it never moves under reduced motion). Project pages add their section bar, which stays.
 */
export function SiteHeader() {
  const pathname = usePathname();
  const { page } = useEnquiry();
  // Server render assumes the hero on Home (its first paint), so the logo never flashes navy on navy. The reader is tied
  // to the route, so arriving on Home by a client navigation re-reads #hero after the new page commits.
  const readDark = useCallback(() => pathname === "/" && readOverHero(), [pathname]);
  const dark = useSyncExternalStore(subscribeScrollResize, readDark, () => pathname === "/");
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    let last = window.scrollY;
    const onScroll = () => {
      const y = window.scrollY;
      if (Math.abs(y - last) < 6) return; // trackpad jitter
      setHidden(y > 120 && y > last);
      last = y;
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      onFocus={() => setHidden(false)}
      className={cn(
        // right-scroll-bar-position: while a dialog locks the page scroll, Radix keeps this bar clear of the removed
        // scrollbar, so it does not jump sideways as the menu or the enquiry drawer opens and closes.
        "right-scroll-bar-position fixed inset-x-0 top-0 z-40 transition-transform duration-500 ease-(--ease-out)",
        // A project page keeps its section bar on screen: only the main bar slides away.
        hidden && (page.nav ? "motion-safe:-translate-y-16 motion-safe:lg:-translate-y-20" : "motion-safe:-translate-y-full"),
      )}
    >
      <div
        className={cn(
          "border-b transition-[border-color,background-color] duration-500",
          // on-navy over the film: focus rings turn white instead of navy on navy.
          dark ? "on-navy border-transparent bg-linear-to-b bg-no-repeat from-navy-deep/50 to-transparent" : "border-line bg-white/92 backdrop-blur-md",
        )}
      >
        <Container className="flex h-16 items-center justify-between gap-6 lg:h-20">
          <Link href="/" aria-label={`${COMPANY.name} — home`} className="shrink-0">
            <Logo variant={dark ? "white" : "navy"} width={120} className="w-[96px] lg:w-[116px]" />
          </Link>

          <div className="flex items-center gap-3">
            <EnquireButton size="sm" variant={dark ? "outline-light" : "primary"} interest={page.interest} className="hidden sm:inline-flex">
              Book a site visit
            </EnquireButton>
            <SiteMenu dark={dark} />
          </div>
        </Container>
      </div>
      {page.nav ? <ProjectBar nav={page.nav} /> : null}
    </header>
  );
}
