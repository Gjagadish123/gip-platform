import { Container } from "@/components/site/container";
import { FaqList } from "@/components/site/faq-list";
import { Section } from "@/components/site/section";
import { TextLink } from "@/components/site/text-link";
import { COMPANY } from "@/lib/constants";
import { WHATSAPP_TEXT, whatsappUrl } from "@/lib/enquiry";

/** FAQ: the heading and a way to reach a person hold on the left; the questions open on the right. */
export function Faq({ items, whatsapp = WHATSAPP_TEXT.home }: { items: { q: string; a: string }[]; whatsapp?: string }) {
  return (
    <Section id="faq" aria-labelledby="faq-title">
      <Container className="grid gap-10 lg:grid-cols-12 lg:gap-x-10">
        <div className="lg:col-span-4">
          <div className="lg:sticky lg:top-40">
            <h2 id="faq-title" className="max-w-[12ch] text-h2">
              Frequently asked questions
            </h2>
            <p className="mt-6 max-w-[32ch] text-body text-text">
              Still deciding? Call{" "}
              <TextLink href={`tel:${COMPANY.phoneE164}`} arrow={false} className="tabular-nums">
                {COMPANY.phone}
              </TextLink>{" "}
              or{" "}
              <TextLink href={whatsappUrl(whatsapp)} external arrow={false}>
                message us on WhatsApp
              </TextLink>
              .
            </p>
          </div>
        </div>
        <FaqList items={items} className="lg:col-span-8" />
      </Container>
    </Section>
  );
}
