import { Clock, Mail, Phone, type LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

import { Container } from "@/components/site/container";
import { EnquiryForm } from "@/components/site/enquiry-form";
import { Reveal } from "@/components/site/reveal";
import { Section } from "@/components/site/section";
import { COMPANY } from "@/lib/constants";
import type { InterestId } from "@/lib/enquiry";
import { OFFICE } from "@/lib/site";

function Row({ icon: Icon, label, children }: { icon: LucideIcon; label: string; children: ReactNode }) {
  return (
    <li className="flex items-center gap-4">
      <span aria-hidden className="inline-flex size-10 shrink-0 items-center justify-center rounded-md bg-mist text-navy-soft">
        <Icon className="size-5" />
      </span>
      <span className="min-w-0">
        <span className="block text-small text-muted">{label}</span>
        <span className="block text-ui font-medium break-words text-navy">{children}</span>
      </span>
    </li>
  );
}

/** The enquiry close: the invitation and the ways to reach us on the left, the shared form in a raised panel on the right. */
export function Enquire({ name, interest }: { name: string; interest: InterestId }) {
  return (
    <Section id="enquire" aria-labelledby="enquire-title" className="border-t border-line">
      <Container className="grid gap-12 lg:grid-cols-12 lg:gap-x-10">
        <div className="lg:col-span-5">
          <h2 id="enquire-title" className="max-w-[14ch] text-h2">
            Enquire about {name}
          </h2>
          <p className="mt-5 max-w-[44ch] text-body text-text">
            Tell us what you are looking for at {name}: a plot size, a facing, a site visit. We reply on WhatsApp or by
            phone, and there is no obligation to book.
          </p>
          <ul className="mt-10 space-y-5">
            <Row icon={Phone} label="Call">
              <a href={`tel:${COMPANY.phoneE164}`} className="tabular-nums transition-colors hover:text-navy-soft">
                {COMPANY.phone}
              </a>
            </Row>
            <Row icon={Mail} label="Email">
              <a href={`mailto:${COMPANY.email}`} className="break-all transition-colors hover:text-navy-soft">
                {COMPANY.email}
              </a>
            </Row>
            <Row icon={Clock} label="Hours">
              {OFFICE.hours}
            </Row>
          </ul>
        </div>
        <Reveal className="lg:col-span-7">
          <div className="rounded-lg border border-line bg-white p-6 shadow-raise lg:p-10">
            <EnquiryForm interest={interest} />
          </div>
        </Reveal>
      </Container>
    </Section>
  );
}
