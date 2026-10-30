import type { ReactNode } from "react";

import { entranceArch } from "@/assets/images";
import { Container } from "@/components/site/container";
import { Plate } from "@/components/site/plate";
import { Section } from "@/components/site/section";
import { TextLink } from "@/components/site/text-link";
import { WHATSAPP_TEXT, whatsappUrl } from "@/lib/enquiry";
import { OFFICE } from "@/lib/site";
import type { Project } from "@/lib/types";

/** A white card on mist: media on top, then the place, its address and the links. */
function Place({ media, title, children, links }: { media: ReactNode; title: string; children: ReactNode; links: ReactNode }) {
  return (
    <article className="flex flex-col overflow-hidden rounded-lg border border-line bg-white">
      {media}
      <div className="flex flex-1 flex-col p-6 lg:p-8">
        <h3 className="text-h3">{title}</h3>
        <div className="mt-3 flex-1">{children}</div>
        <div className="mt-6 flex flex-wrap gap-x-6 gap-y-3">{links}</div>
      </div>
    </article>
  );
}

/** "Where to find us": the office (its map on top) and the selling site (its render on top), side by side on desktop. */
export function SiteLocations({ project }: { project: Project | null }) {
  const pin = project?.location.pin;
  return (
    <Section tone="mist" rhythm="secondary" aria-labelledby="locations-title">
      <Container>
        <h2 id="locations-title" className="text-h2">
          Where to find us
        </h2>
        <div className="mt-10 grid gap-6 lg:mt-14 lg:grid-cols-2 lg:gap-8">
          <Place
            title="Corporate office"
            media={
              <iframe
                title="Map: Greater Infra Projects office, Vasavi MPM Grand, Ameerpet"
                src={`https://maps.google.com/maps?q=${OFFICE.pin.lat},${OFFICE.pin.lng}&z=15&output=embed`}
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                className="block aspect-[16/10] w-full border-0 bg-mist"
              />
            }
            links={
              <>
                <TextLink href={OFFICE.directionsUrl} external>
                  Directions
                </TextLink>
                <TextLink href={whatsappUrl(WHATSAPP_TEXT.home)} external>Message us on WhatsApp</TextLink>
              </>
            }
          >
            <address className="text-body text-text not-italic">
              {OFFICE.line1},
              <br />
              {OFFICE.line2}
            </address>
            <p className="mt-2 text-small text-muted">{OFFICE.hours}</p>
          </Place>

          {project && pin ? (
            <Place
              title={`${project.name} site`}
              media={
                <Plate
                  src={entranceArch}
                  alt={`Artist's impression of the ${project.name} entrance arch and avenue road`}
                  impression
                  rounded={false}
                  sizes="(min-width: 1344px) 640px, (min-width: 1024px) 50vw, 100vw"
                  position="50% 55%"
                  className="aspect-[16/10]"
                />
              }
              links={
                <>
                  <TextLink href={`https://www.google.com/maps/search/?api=1&query=${pin.lat},${pin.lng}`} external>
                    Directions
                  </TextLink>
                  <TextLink href={project.publishing.externalUrl ?? `/projects/${project.publishing.slug}`}>View project</TextLink>
                </>
              }
            >
              <p className="max-w-[46ch] text-body text-text">
                Near GITAM University, Rudraram to Indrakaran Road, on Mumbai Highway (NH-65), Sangareddy District.
              </p>
            </Place>
          ) : null}
        </div>
      </Container>
    </Section>
  );
}
