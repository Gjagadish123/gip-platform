"use client";

import { ChevronDown, House, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { NavigationMenu } from "radix-ui";
import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";

import { COMPANY } from "@/lib/constants";
import type { NavLink, SiteNav } from "@/lib/nav";
import { cn } from "@/lib/utils";

import { Container } from "./container";
import { EnquireButton } from "./enquire-button";
import { useEnquiry, type ProjectNav } from "./enquiry-provider";
import { Logo } from "./logo";

// Over the home hero while #hero still covers the header's band.
// Pages that open on a navy #hero: the header sits on it transparent, in its light version.
const DARK_HERO = new Set(["/", "/projects"]);
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

const PAGES = { home: { href: "/", label: "Home" }, after: [{ href: "/about", label: "About" }, { href: "/contact", label: "Contact" }] };

// Live layouts are another app on the same domain: a plain link, not a client-side route.
function NavA({ l, className, onClick }: { l: NavLink; className?: string; onClick?: () => void }) {
  const note = l.note ? <span className="ml-auto pl-4 text-small font-normal text-muted">{l.note}</span> : null;
  return l.href.startsWith("/") ? (
    <Link href={l.href} prefetch={false} className={className} onClick={onClick}>
      {l.label}
      {note}
    </Link>
  ) : (
    <a href={l.href} className={className} onClick={onClick}>
      {l.label}
      {note}
    </a>
  );
}

const item = "flex min-h-11 w-full items-center rounded-md px-3 text-left text-ui font-medium text-navy transition-colors hover:bg-mist focus-visible:bg-mist";
const allLink = "mt-1 flex min-h-11 items-center border-t border-line px-3 pt-1 text-small font-semibold text-navy-soft hover:text-navy";

/** Desktop (lg+): the pages and the three project dropdowns in the bar itself. Hover or click opens a dropdown. */
function DesktopNav({ nav, dark, value, setValue }: { nav: SiteNav; dark: boolean; value: string; setValue: (v: string) => void }) {
  const pathname = usePathname();
  const top = cn(
    "inline-flex h-10 items-center gap-1 rounded-md px-2.5 text-ui font-medium whitespace-nowrap transition-colors xl:px-3.5",
    dark ? "text-white hover:bg-white/12 data-[state=open]:bg-white/12" : "text-navy hover:bg-mist data-[state=open]:bg-mist",
  );
  const page = (l: NavLink) => (
    <NavigationMenu.Item key={l.href}>
      <NavigationMenu.Link asChild active={pathname === l.href}>
        <Link href={l.href} prefetch={false} className={cn(top, "data-[active]:underline data-[active]:decoration-2 data-[active]:underline-offset-8")}>
          {l.label}
        </Link>
      </NavigationMenu.Link>
    </NavigationMenu.Item>
  );
  return (
    <NavigationMenu.Root value={value} onValueChange={setValue} delayDuration={60} aria-label="Main" className="hidden lg:block">
      <NavigationMenu.List className="flex items-center">
        {page(PAGES.home)}
        {nav.groups.map((g) => (
          <NavigationMenu.Item key={g.key} value={g.key} className="relative">
            <NavigationMenu.Trigger className={cn(top, "group/trigger")}>
              {g.label}
              <ChevronDown aria-hidden className="size-4 transition-transform duration-300 group-data-[state=open]/trigger:rotate-180" />
            </NavigationMenu.Trigger>
            <NavigationMenu.Content className="absolute top-full left-1/2 z-50 -translate-x-1/2 pt-2">
              <div className={cn("on-light rounded-xl border border-line bg-white p-2 shadow-overlay", g.wide ? "w-[34rem]" : "w-[22rem]")}>
                <ul className={cn(g.wide && "grid grid-cols-2 gap-x-2")}>
                  {g.items.map((l) => (
                    <li key={l.label}>
                      <NavigationMenu.Link asChild>
                        <NavA l={l} className={item} />
                      </NavigationMenu.Link>
                    </li>
                  ))}
                </ul>
                <NavigationMenu.Link asChild>
                  <NavA l={{ ...g.all, label: `${g.all.label} →` }} className={allLink} />
                </NavigationMenu.Link>
              </div>
            </NavigationMenu.Content>
          </NavigationMenu.Item>
        ))}
        {PAGES.after.map(page)}
      </NavigationMenu.List>
    </NavigationMenu.Root>
  );
}

/** Phones and tablets: Menu opens the same menu as a panel dropping from the bar (no separate menu page). */
function MobileNav({ nav, open, setOpen, dark }: { nav: SiteNav; open: boolean; setOpen: (v: boolean) => void; dark: boolean }) {
  const [group, setGroup] = useState<string | null>(null);
  const close = () => setOpen(false);
  const { page } = useEnquiry();
  return (
    <>
      <button
        type="button"
        aria-expanded={open}
        aria-controls="site-menu"
        onClick={() => setOpen(!open)}
        className={cn(
          "inline-flex h-11 items-center gap-2.5 rounded-md border pr-3.5 pl-3 text-ui font-medium transition-colors sm:h-10 lg:hidden",
          dark ? "border-white/30 bg-white/8 text-white hover:bg-white/15" : "border-line-strong bg-white text-navy hover:bg-mist",
        )}
      >
        {open ? (
          <X aria-hidden className="size-4" />
        ) : (
          <span aria-hidden className="flex w-4 flex-col gap-[5px]">
            <span className="h-[1.5px] w-full rounded-full bg-current" />
            <span className="h-[1.5px] w-2/3 rounded-full bg-current" />
          </span>
        )}
        {open ? "Close" : "Menu"}
      </button>
      {open ? (
        <>
          <nav
            id="site-menu"
            aria-label="Main"
            data-lenis-prevent
            className="absolute inset-x-0 top-full max-h-[calc(100dvh-4rem)] overflow-y-auto overscroll-contain border-b border-line bg-white shadow-overlay lg:hidden"
          >
            <Container className="py-3">
              <ul>
                <li>
                  <NavA l={PAGES.home} className={item} onClick={close} />
                </li>
                {nav.groups.map((g) => {
                  const on = group === g.key;
                  return (
                    <li key={g.key}>
                      <button type="button" aria-expanded={on} onClick={() => setGroup(on ? null : g.key)} className={cn(item, "justify-between")}>
                        {g.label}
                        <ChevronDown aria-hidden className={cn("size-4 transition-transform duration-300", on && "rotate-180")} />
                      </button>
                      {on ? (
                        <ul className="mb-2 ml-3 border-l border-line pl-2">
                          {g.items.map((l) => (
                            <li key={l.label}>
                              <NavA l={l} className={cn(item, "font-normal")} onClick={close} />
                            </li>
                          ))}
                          <li>
                            <NavA l={{ ...g.all, label: `${g.all.label} →` }} className={cn(item, "text-small font-semibold text-navy-soft")} onClick={close} />
                          </li>
                        </ul>
                      ) : null}
                    </li>
                  );
                })}
                {PAGES.after.map((l) => (
                  <li key={l.href}>
                    <NavA l={l} className={item} onClick={close} />
                  </li>
                ))}
              </ul>
              <div className="mt-3 border-t border-line pt-4 pb-1" onClickCapture={close}>
                <EnquireButton size="lg" interest={page.interest} className="w-full" arrow>
                  Book a site visit
                </EnquireButton>
              </div>
            </Container>
          </nav>
        </>
      ) : null}
    </>
  );
}

/**
 * The bar, 64 px on phones and 80 on desktop: the logo, the menus (desktop: in the bar; phones and tablets: Menu drops
 * them down from the bar), Home on project pages (phones), and Book a site visit. Not sticky (client, 12 Nov 2026): it
 * slides away while the page is scrolling and comes back once scrolling stops; an open menu closes when the page
 * scrolls. Over a navy hero it is transparent with the white logo; elsewhere a white blurred bar on a hairline. Project
 * pages add their section bar under it.
 */
export function SiteHeader({ nav }: { nav: SiteNav }) {
  const pathname = usePathname();
  const { page } = useEnquiry();
  // Server render assumes the hero on Home (its first paint), so the logo never flashes navy on navy. The reader is tied
  // to the route, so arriving on Home by a client navigation re-reads #hero after the new page commits.
  const readDark = useCallback(() => DARK_HERO.has(pathname) && readOverHero(), [pathname]);
  const heroDark = useSyncExternalStore(subscribeScrollResize, readDark, () => DARK_HERO.has(pathname));
  const onProject = pathname.startsWith("/projects/");
  const [menu, setMenu] = useState(false); // the phone / tablet panel
  const [drop, setDrop] = useState(""); // the open desktop dropdown
  const [scrolling, setScrolling] = useState(false);
  const dark = heroDark && !menu; // the open panel is white: the bar above it turns white too

  // Hidden while the page scrolls, back 250 ms after it stops; open menus close on scroll.
  useEffect(() => {
    let t = 0;
    const onScroll = () => {
      setMenu(false);
      setDrop("");
      setScrolling(true);
      window.clearTimeout(t);
      t = window.setTimeout(() => setScrolling(false), 250);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.clearTimeout(t);
    };
  }, []);

  // A new page closes the menus.
  const [seen, setSeen] = useState(pathname);
  if (seen !== pathname) {
    setSeen(pathname);
    setMenu(false);
    setDrop("");
  }

  useEffect(() => {
    if (!menu) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setMenu(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [menu]);

  return (
    // right-scroll-bar-position: while a dialog locks the page scroll, Radix keeps this bar clear of the removed
    // scrollbar, so it does not jump sideways as the enquiry drawer opens and closes.
    <header
      className={cn(
        "right-scroll-bar-position fixed inset-x-0 top-0 z-40 transition-transform duration-300 ease-(--ease-out)",
        scrolling && "-translate-y-full",
      )}
    >
      <div
        className={cn(
          "relative z-10 border-b transition-[border-color,background-color] duration-500", // z-10: dropdowns over the project bar
          // on-navy over the film: focus rings turn white instead of navy on navy.
          dark ? "on-navy border-transparent bg-linear-to-b bg-no-repeat from-navy-deep/50 to-transparent" : "border-line bg-white/92 backdrop-blur-md",
        )}
      >
        <Container className="flex h-16 items-center justify-between gap-4 lg:h-20">
          {/* Not prefetched: it's on every page, and the home route's animation code would compete with each page's own
              loading. */}
          <Link href="/" prefetch={false} aria-label={`${COMPANY.name} — home`} className="shrink-0">
            <Logo variant={dark ? "white" : "navy"} width={120} className="w-[96px] lg:w-[116px]" />
          </Link>

          <DesktopNav nav={nav} dark={dark} value={drop} setValue={setDrop} />

          <div className="flex items-center gap-3">
            {onProject ? (
              <Link
                href="/"
                prefetch={false}
                aria-label="Home"
                title="Home"
                className="inline-flex size-11 items-center justify-center rounded-md border border-line-strong bg-white text-navy transition-colors hover:bg-mist sm:size-10 lg:hidden"
              >
                <House aria-hidden className="size-[18px]" />
              </Link>
            ) : null}
            <EnquireButton size="sm" variant={dark ? "outline-light" : "primary"} interest={page.interest} className="hidden sm:inline-flex">
              Book a site visit
            </EnquireButton>
            <MobileNav nav={nav} open={menu} setOpen={setMenu} dark={dark} />
          </div>
        </Container>
      </div>
      {page.nav ? <ProjectBar nav={page.nav} /> : null}
      {/* behind the bar and the phone panel (outside the blurred bar, whose backdrop-filter would trap a fixed child) */}
      {menu ? <div aria-hidden onClick={() => setMenu(false)} className="fixed inset-0 -z-10 bg-navy-deep/40 lg:hidden" /> : null}
    </header>
  );
}
