import { Container } from "@/components/site/container";
import { FaqList } from "@/components/site/faq-list";
import { Section } from "@/components/site/section";
import { TextLink } from "@/components/site/text-link";
import { WHATSAPP_TEXT, whatsappUrl } from "@/lib/enquiry";
import { OFFICE } from "@/lib/site";

// Answers only from known facts: the approvals in the project data and the client's brochure (PRODUCT.md).
export const FAQ = [
  {
    q: "Are Greater Infra Projects layouts approved?",
    a: "Yes. Global City VI has the HMDA final layout permit 2046/HMDA/SWFL/2026 (23 Apr 2026) and is registered with TS RERA as P01100009270. You can verify the registration on rera.telangana.gov.in and ask us for copies of the approvals.",
  },
  {
    q: "What plot sizes are available at Global City VI?",
    a: "The layout has 288 plots from 147 to 731 sq yd on 40 ft and 30 ft CC roads, in an HMDA gated township abutting a 100 ft road. Most plots face east or west; the project page shows what is still available.",
  },
  {
    q: "Is a bank loan available?",
    a: "Yes. Global City VI has a clear title and bank loans are available. Ask us which documents your bank needs.",
  },
  {
    q: "Is the layout Vaastu compliant?",
    a: "Yes. The Global City VI layout is Vaastu compliant, with plots facing east, west, north and south.",
  },
  {
    q: "Do you build villas on the plots?",
    a: "Yes. Villa construction is undertaken on request; east- and west-facing villa designs are shown on the project page.",
  },
  {
    q: "How do I arrange a site visit?",
    a: `Message us on WhatsApp (${OFFICE.hours}) or use Schedule site visit, and we'll arrange a time to walk the plots with you. If you live abroad, a family member can visit for you while we share the layout copy and site photos on WhatsApp.`,
  },
] as const;

/** Sticky split: the heading and a way to ask a person stay on the left while the questions run on the right. */
export function ProjectsFaq() {
  return (
    <Section rhythm="secondary" aria-labelledby="faq-title">
      <Container className="grid gap-10 lg:grid-cols-12 lg:gap-8">
        <div className="lg:sticky lg:top-32 lg:col-span-4 lg:self-start">
          <h2 id="faq-title" className="text-h2">
            Frequently asked questions
          </h2>
          <p className="mt-5 max-w-[34ch] text-body text-text">Your question isn&rsquo;t here? Ask us directly.</p>
          <div className="mt-5 flex flex-wrap gap-x-6 gap-y-3">
            <TextLink href={whatsappUrl(WHATSAPP_TEXT.home)} external>
              WhatsApp us
            </TextLink>
          </div>
        </div>
        <FaqList items={FAQ} className="lg:col-span-7 lg:col-start-6" />
      </Container>
    </Section>
  );
}
