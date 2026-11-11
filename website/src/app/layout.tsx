import type { Metadata, Viewport } from "next";

import { ActionBar } from "@/components/site/action-bar";
import { EnquirySheet } from "@/components/site/enquiry-sheet";
import { Providers } from "@/components/site/providers";
import { SiteFooter } from "@/components/site/site-footer";
import { SiteHeader } from "@/components/site/site-header";
import { IS_PREVIEW, JsonLd, OG_DEFAULTS, organizationJsonLd, SITE_NAME, SITE_URL } from "@/lib/seo";

import { sans } from "./fonts";
import "./globals.css";

const DESCRIPTION =
  "Greater Infra Projects develops HMDA, DTCP and RERA approved open plots and villa plots across Hyderabad — 11+ years, 20+ projects, 600+ acres, 6000+ customers.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Greater Infra Projects — HMDA & RERA approved plots in Hyderabad",
    template: `%s · ${SITE_NAME}`,
  },
  description: DESCRIPTION,
  applicationName: SITE_NAME,
  keywords: ["HMDA approved plots Hyderabad", "DTCP plots", "villa plots Hyderabad", "RERA approved layouts", "Greater Infra Projects"],
  authors: [{ name: SITE_NAME, url: SITE_URL }],
  creator: SITE_NAME,
  publisher: SITE_NAME,
  formatDetection: { email: false, address: false, telephone: false },
  manifest: "/manifest.webmanifest",
  alternates: { canonical: "/" },
  openGraph: {
    ...OG_DEFAULTS,
    url: "/",
    title: "Greater Infra Projects — HMDA & RERA approved plots in Hyderabad",
    description: DESCRIPTION,
  },
  twitter: { card: "summary_large_image", title: SITE_NAME, description: DESCRIPTION },
  robots: IS_PREVIEW
    ? { index: false, follow: false }
    : {
        index: true,
        follow: true,
        googleBot: { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1, "max-video-preview": -1 },
      },
};

export const viewport: Viewport = {
  themeColor: "#19426b",
  colorScheme: "light",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en-IN" className={`${sans.variable} h-full antialiased`} data-scroll-behavior="smooth">
      <body className="flex min-h-full flex-col bg-canvas text-text">
        <JsonLd data={organizationJsonLd()} />
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50 focus:rounded-md focus:bg-brand focus:px-4 focus:py-2 focus:text-sm focus:text-white"
        >
          Skip to content
        </a>
        <Providers>
          <SiteHeader />
          <main id="main" className="flex-1">
            {children}
          </main>
          <SiteFooter />
          <ActionBar />
          <EnquirySheet />
        </Providers>
      </body>
    </html>
  );
}
