import { BadgeCheck, Check, Download, FileCheck2, FileText } from "lucide-react";

import { Container } from "@/components/site/container";
import { Reveal } from "@/components/site/reveal";
import { Section } from "@/components/site/section";
import { TextLink } from "@/components/site/text-link";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/lib/format";
import { RERA_PORTAL } from "@/lib/site";
import type { Approval, LegalDocument } from "@/lib/types";

import { BROCHURE_LP } from "./content";
import { CopyButton } from "./parts";

/** Approvals as three document cards with copyable references, then the documents on hand and the downloads. */
export function Approvals({
  hmda,
  rera,
  documents,
  brochure,
  layout,
}: {
  hmda?: Approval;
  rera?: Approval;
  documents: LegalDocument[];
  brochure?: string;
  layout?: string;
}) {
  const cards = [
    hmda && {
      authority: "HMDA",
      icon: FileCheck2,
      title: "HMDA final layout permit",
      reference: hmda.reference,
      note: [hmda.date ? `Issued ${formatDate(hmda.date)}` : null, hmda.description].filter(Boolean).join(" · "),
    },
    {
      authority: "HMDA",
      icon: FileText,
      title: "HMDA layout approval",
      reference: `LP ${BROCHURE_LP.reference}`,
      note: `Dated ${BROCHURE_LP.date}, as printed on the brochure layout copy.`,
    },
    rera && {
      authority: "TS RERA",
      icon: BadgeCheck,
      title: "TS RERA registration",
      reference: rera.reference,
      note: "Registered with the Telangana State Real Estate Regulatory Authority.",
      verify: true,
    },
  ].filter((c) => !!c);

  return (
    <Section id="approvals" tone="mist" aria-labelledby="approvals-title">
      <Container>
        <div className="grid gap-5 lg:grid-cols-12 lg:items-end lg:gap-x-10">
          <h2 id="approvals-title" className="max-w-[16ch] text-h2 lg:col-span-6">
            Approvals you can check yourself.
          </h2>
          <p className="max-w-[52ch] text-body text-text lg:col-span-5 lg:col-start-8">
            Every number here is on the layout copy or on the authority&rsquo;s record. Check the RERA registration on the
            Telangana RERA portal before you book.
          </p>
        </div>

        <Reveal className="mt-10 lg:mt-14">
          <ul className="grid gap-4 md:grid-cols-3">
            {cards.map(({ authority, icon: Icon, title, reference, note, verify }) => (
              <li key={title} className="flex flex-col rounded-lg border border-line bg-white p-7">
                <div className="flex items-center justify-between gap-4">
                  <span className="rounded-md bg-mist px-2.5 py-1 text-label text-navy">{authority}</span>
                  <Icon aria-hidden className="size-6 text-navy-soft" />
                </div>
                <h3 className="mt-8 text-h3">{title}</h3>
                {reference ? (
                  <div className="mt-2 flex items-start gap-2">
                    <p className="min-w-0 flex-1 text-body font-medium [overflow-wrap:anywhere] text-navy tabular-nums lg:text-lede">{reference}</p>
                    <CopyButton value={reference} label={`${title} number`} />
                  </div>
                ) : null}
                {note ? <p className="mt-3 text-small text-muted">{note}</p> : null}
                {verify ? (
                  <div className="mt-auto pt-6">
                    <TextLink href={RERA_PORTAL} external>
                      Verify on rera.telangana.gov.in
                    </TextLink>
                  </div>
                ) : null}
              </li>
            ))}
          </ul>
        </Reveal>

        <div className="mt-16 grid gap-10 lg:mt-20 lg:grid-cols-12 lg:gap-x-10">
          <div className="lg:col-span-7">
            <h3 className="text-h3">Documents</h3>
            <ul className="mt-5 border-t border-line">
              {documents.map((d) => (
                <li key={d.id} className="flex items-center justify-between gap-6 border-b border-line py-4">
                  <span className="text-body text-navy">{d.name}</span>
                  {d.available ? (
                    <span className="inline-flex shrink-0 items-center gap-1.5 text-small font-medium text-go">
                      <Check aria-hidden className="size-4" /> Available
                    </span>
                  ) : null}
                </li>
              ))}
            </ul>
            <p className="mt-4 text-small text-muted">Ask us for copies before you book.</p>
          </div>
          {brochure || layout ? (
            <div className="flex flex-wrap gap-3 lg:col-span-4 lg:col-start-9 lg:flex-col lg:items-start lg:self-end">
              {brochure ? (
                <Button asChild>
                  <a href={brochure} target="_blank" rel="noreferrer" download>
                    <Download aria-hidden /> Download brochure
                  </a>
                </Button>
              ) : null}
              {layout ? (
                <Button asChild variant="secondary">
                  <a href={layout} target="_blank" rel="noreferrer" download>
                    <Download aria-hidden /> Download layout (PDF)
                  </a>
                </Button>
              ) : null}
            </div>
          ) : null}
        </div>
      </Container>
    </Section>
  );
}
