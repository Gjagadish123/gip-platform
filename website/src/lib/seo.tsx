import type { Metadata } from "next";

import { COMPANY } from "./constants";
import { OFFICE } from "./site";

export const SITE_URL = COMPANY.website;
export const SITE_NAME = COMPANY.name;
export const IS_PREVIEW = process.env.GITHUB_PAGES === "true";

/** Shared OG/twitter defaults; spread into every page's openGraph so the shallow merge never drops siteName/locale. */
export const OG_DEFAULTS = {
  type: "website",
  siteName: SITE_NAME,
  locale: "en_IN",
} as const;

/** The root's file-based OG image; a page-level `openGraph` object replaces the root's, so every page restates it. */
export const OG_IMAGE = {
  url: "/opengraph-image.jpg",
  width: 1200,
  height: 630,
  alt: "Artist's impression of a Greater Infra Projects plotted layout at golden hour",
} as const;

/** Per-route metadata with canonical + OG in one call. `title` goes through the root template. */
export function pageMeta({
  title,
  description,
  path,
  ogTitle,
}: {
  title: string;
  description: string;
  path: string;
  ogTitle?: string;
}): Metadata {
  return {
    title,
    description,
    alternates: { canonical: path },
    openGraph: { ...OG_DEFAULTS, url: path, title: ogTitle ?? title, description, images: [OG_IMAGE] },
    twitter: { card: "summary_large_image", title: ogTitle ?? title, description, images: [OG_IMAGE.url] },
  };
}

// Native <script>: JSON-LD is data, not code. JSON.stringify does not escape "<", so a string could close the tag.
export function JsonLd({ data }: { data: object }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }}
    />
  );
}

export const ORGANIZATION_ID = `${SITE_URL}/#organization`;

export function organizationJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": ["Organization", "RealEstateAgent"],
    "@id": ORGANIZATION_ID,
    name: COMPANY.name,
    alternateName: COMPANY.shortName,
    url: SITE_URL,
    logo: `${SITE_URL}/brand/gip-lockup-navy.svg`,
    telephone: COMPANY.phoneE164,
    email: COMPANY.email,
    address: {
      "@type": "PostalAddress",
      streetAddress: OFFICE.line1,
      addressLocality: "Ameerpet, Hyderabad",
      addressRegion: "Telangana",
      postalCode: "500016",
      addressCountry: "IN",
    },
    geo: { "@type": "GeoCoordinates", latitude: OFFICE.pin.lat, longitude: OFFICE.pin.lng },
    openingHoursSpecification: [
      {
        "@type": "OpeningHoursSpecification",
        dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
        opens: "10:00",
        closes: "19:00",
      },
    ],
    contactPoint: [
      {
        "@type": "ContactPoint",
        telephone: COMPANY.phoneE164,
        contactType: "sales",
        areaServed: "IN",
        availableLanguage: ["en", "te"],
      },
    ],
    sameAs: [COMPANY.social.facebook, COMPANY.social.instagram],
  };
}

export function breadcrumbJsonLd(items: { name: string; path: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((it, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: it.name,
      item: `${SITE_URL}${it.path}`,
    })),
  };
}
