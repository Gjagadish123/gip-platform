import { Clock, Mail, Phone } from "lucide-react";
import type { Metadata } from "next";
import type { ComponentType } from "react";

import { SiteLocations } from "@/components/contact/site-locations";
import { Container } from "@/components/site/container";
import { EnquiryForm } from "@/components/site/enquiry-form";
import { WhatsAppIcon } from "@/components/site/icons";
import { Lede } from "@/components/site/typography";
import { Arrow } from "@/components/ui/button";
import { COMPANY } from "@/lib/constants";
import { WHATSAPP_TEXT, whatsappUrl } from "@/lib/enquiry";
import { getProject } from "@/lib/projects";
import { JsonLd, ORGANIZATION_ID, pageMeta, SITE_URL } from "@/lib/seo";
import { CLOSING_CTA, OFFICE } from "@/lib/site";
import { cn } from "@/lib/utils";

const TITLE = "Contact — Ameerpet, Hyderabad";
const DESCRIPTION =
  "Call +91 97001 23900, WhatsApp, or visit Vasavi MPM Grand, Metro Junction, Ameerpet. Mon–Sat 10:00–19:00 IST.";
const PATH = "/contact";

export const metadata: Metadata = pageMeta({ title: TITLE, description: DESCRIPTION, path: PATH });

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "ContactPage",
  "@id": `${SITE_URL}${PATH}`,
  url: `${SITE_URL}${PATH}`,
  name: TITLE,
  description: DESCRIPTION,
  mainEntity: { "@id": ORGANIZATION_ID },
};

type Method = { icon: ComponentType<{ className?: string }>; title: string; detail: string; href?: string; external?: boolean };

const METHODS: Method[] = [
  { icon: Phone, title: "Call us", detail: COMPANY.phone, href: `tel:${COMPANY.phoneE164}` },
  {
    icon: WhatsAppIcon,
    title: "Message us on WhatsApp",
    detail: "Send a plot size, a facing or a question",
    href: whatsappUrl(WHATSAPP_TEXT.home),
    external: true,
  },
  { icon: Mail, title: "Email", detail: COMPANY.email, href: `mailto:${COMPANY.email}` },
  { icon: Clock, title: "Office hours", detail: OFFICE.hours },
];

/** One way to reach GIP: a mist icon square, the title and detail, the arrow when it is a link. */
function MethodRow({ icon: Icon, title, detail, href }: Method) {
  return (
    <>
      <span
        className={cn(
          "inline-flex size-11 shrink-0 items-center justify-center rounded-md bg-mist text-navy-soft",
          href && "transition-colors duration-300 group-hover/link:bg-brand group-hover/link:text-white",
        )}
      >
        <Icon className="size-5" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-ui font-medium text-navy">{title}</span>
        <span className="mt-0.5 block text-small break-words text-muted">{detail}</span>
      </span>
      {href ? <Arrow className="text-navy-soft" /> : null}
    </>
  );
}

const row = "flex items-center gap-4 py-4";

// An intro split: the invitation and the ways to reach a person on the left, the enquiry form in a white panel on the
// right. Then where to find the office and the site. No closing band: this page is the conversation.
export default async function ContactPage() {
  const project = await getProject("global-city-vi");

  return (
    <>
      <JsonLd data={jsonLd} />
      <section aria-labelledby="contact-title" className="pt-32 pb-24 lg:pt-44 lg:pb-36">
        <Container className="grid gap-14 lg:grid-cols-12 lg:gap-8">
          <div className="lg:col-span-5">
            <h1 id="contact-title" className="text-display">
              {CLOSING_CTA.heading} {CLOSING_CTA.accent}.
            </h1>
            <Lede className="mt-6 max-w-[42ch]">{CLOSING_CTA.lede}</Lede>
            <ul className="mt-10 border-t border-line lg:mt-14">
              {METHODS.map((m) => (
                <li key={m.title} className="border-b border-line">
                  {m.href ? (
                    <a
                      href={m.href}
                      target={m.external ? "_blank" : undefined}
                      rel={m.external ? "noreferrer" : undefined}
                      className={cn("group/link", row)}
                    >
                      <MethodRow {...m} />
                    </a>
                  ) : (
                    <div className={row}>
                      <MethodRow {...m} />
                    </div>
                  )}
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-lg border border-line bg-white p-6 shadow-raise lg:col-span-6 lg:col-start-7 lg:self-start lg:p-10">
            <h2 className="text-h3">Send an enquiry</h2>
            <p className="mt-2 text-small text-muted">Opens WhatsApp with your message ready to send.</p>
            <EnquiryForm interest="general" className="mt-8" />
          </div>
        </Container>
      </section>

      <SiteLocations project={project} />
    </>
  );
}
