"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode, type RefObject } from "react";

import type { EnquiryPlot, InterestId } from "@/lib/enquiry";

export interface ProjectNav {
  /** Shown beside the logo: "Global City VI". */
  name: string;
  /** Registration line under the name: "TS RERA P01100009270". */
  reg?: string;
  /** In-page anchors shown in the header pill instead of the site links. */
  links: { href: string; label: string }[];
  /** Brochure for the action bar's Download brochure pill. */
  brochure?: string;
}

export interface PageContext {
  /** Project shown on the current page, used to prefill the action bar and the sheet. */
  projectName?: string;
  projectLocation?: string;
  interest?: InterestId;
  nav?: ProjectNav;
}

export interface OpenOptions {
  interest?: InterestId;
  plot?: EnquiryPlot;
}

interface EnquiryState {
  open: boolean;
  options: OpenOptions;
  page: PageContext;
  /** The element that opened the sheet; focus returns to it on close (Radix cannot know it for a controlled sheet). */
  opener: RefObject<HTMLElement | null>;
  openEnquiry: (o?: OpenOptions) => void;
  closeEnquiry: () => void;
  setPage: (p: PageContext) => void;
}

const Ctx = createContext<EnquiryState | null>(null);

export function EnquiryProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const [options, setOptions] = useState<OpenOptions>({});
  const [page, setPage] = useState<PageContext>({});
  const opener = useRef<HTMLElement | null>(null);

  const openEnquiry = useCallback((o: OpenOptions = {}) => {
    opener.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    setOptions(o);
    setOpen(true);
  }, []);
  const closeEnquiry = useCallback(() => setOpen(false), []);

  const value = useMemo(
    () => ({ open, options, page, opener, openEnquiry, closeEnquiry, setPage }),
    [open, options, page, openEnquiry, closeEnquiry],
  );
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useEnquiry() {
  const v = useContext(Ctx);
  if (!v) throw new Error("useEnquiry must be used inside <EnquiryProvider>");
  return v;
}

/** Pages render this to tell the header, the action bar and the sheet which project they are about. */
export function PageEnquiryContext(props: PageContext) {
  const { setPage } = useEnquiry();
  const { projectName, projectLocation, interest, nav } = props;
  // The nav is plain data from a server component; compare it by value so a re-render does not loop.
  const navKey = JSON.stringify(nav ?? null);
  useEffect(() => {
    setPage({ projectName, projectLocation, interest, nav: JSON.parse(navKey) ?? undefined });
    return () => setPage({});
  }, [projectName, projectLocation, interest, navKey, setPage]);
  return null;
}
