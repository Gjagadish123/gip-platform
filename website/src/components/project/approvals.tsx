import { BadgeCheck, Check, Download, FileCheck2 } from "lucide-react";

import { Container } from "@/components/site/container";
import { Reveal } from "@/components/site/reveal";
import { Section } from "@/components/site/section";
import { TextLink } from "@/components/site/text-link";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/lib/format";
import { RERA_PORTAL } from "@/lib/site";
import type { Approval, LegalDocument } from "@/lib/types";

import { CopyButton } from "./parts";

/** The admin's layout approvals and registrations as document cards with copyable references, then the documents on
 * hand (those with a file open it) and the downloads. */
export function Approvals({
  title,
  description,
  approvals,
  documents,
  brochure,
  layout,
}: {
  title: string;
  description: string;
  approvals: Approval[];
  documents: LegalDocument[];
  brochure?: string;
  layout?: string;
}) {
  if (!approvals.length && !documents.length) return null;
  return (
    <Section id="approvals" tone="mist" aria-labelledby="approvals-title">
      <Container>
        <div className="grid gap-5 lg:grid-cols-12 lg:items-end lg:gap-x-10">
          <h2 id="approvals-title" className="max-w-[16ch] text-h2 lg:col-span-6">
            {title || "Approvals you can check yourself."}
          </h2>
          {description ? <p className="max-w-[52ch] text-body text-text lg:col-span-5 lg:col-start-8">{description}</p> : null}
        </div>

        {approvals.length ? (
          <Reveal className="mt-10 lg:mt-14">
            <ul className="grid gap-4 md:grid-cols-3">
              {approvals.map((a) => {
                const rera = a.authority === "RERA";
                const Icon = rera ? BadgeCheck : FileCheck2;
                const note = [a.date ? `Issued ${formatDate(a.date)}` : null, a.description].filter(Boolean).join(" · ");
                return (
                  <li key={a.id} className="flex flex-col rounded-lg border border-line bg-white p-7">
                    <div className="flex items-center justify-between gap-4">
                      <span className="rounded-md bg-mist px-2.5 py-1 text-label text-navy">{rera ? "TS RERA" : a.authority}</span>
                      <Icon aria-hidden className="size-6 text-navy-soft" />
                    </div>
                    <h3 className="mt-8 text-h3">{a.title}</h3>
                    {a.reference ? (
                      <div className="mt-2 flex items-start gap-2">
                        <p className="min-w-0 flex-1 text-body font-medium [overflow-wrap:anywhere] text-navy tabular-nums lg:text-lede">{a.reference}</p>
                        <CopyButton value={a.reference} label={`${a.title} number`} />
                      </div>
                    ) : null}
                    {note ? <p className="mt-3 text-small text-muted">{note}</p> : null}
                    {rera ? (
                      <div className="mt-auto pt-6">
                        <TextLink href={RERA_PORTAL} external>
                          Verify on rera.telangana.gov.in
                        </TextLink>
                      </div>
                    ) : null}
                  </li>
                );
              })}
            </ul>
          </Reveal>
        ) : null}

        <div className="mt-16 grid gap-10 lg:mt-20 lg:grid-cols-12 lg:gap-x-10">
          {documents.length ? (
            <div className="lg:col-span-7">
              <h3 className="text-h3">Documents</h3>
              <ul className="mt-5 border-t border-line">
                {documents.map((d) => (
                  <li key={d.id} className="flex items-center justify-between gap-6 border-b border-line py-4">
                    {d.file?.url ? (
                      <a href={d.file.url} target="_blank" rel="noreferrer" className="text-body text-navy underline-offset-4 hover:underline">
                        {d.name}
                      </a>
                    ) : (
                      <span className="text-body text-navy">{d.name}</span>
                    )}
                    {d.file?.url ? (
                      <a
                        href={d.file.url}
                        target="_blank"
                        rel="noreferrer"
                        download
                        className="inline-flex shrink-0 items-center gap-1.5 text-small font-medium text-navy hover:underline"
                      >
                        <Download aria-hidden className="size-4" /> Download
                      </a>
                    ) : d.available ? (
                      <span className="inline-flex shrink-0 items-center gap-1.5 text-small font-medium text-go">
                        <Check aria-hidden className="size-4" /> Available
                      </span>
                    ) : null}
                  </li>
                ))}
              </ul>
              <p className="mt-4 text-small text-muted">Ask us for copies before you book.</p>
            </div>
          ) : null}
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
