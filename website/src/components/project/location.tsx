import { gcviRouteMap } from "@/assets/images";
import { Container } from "@/components/site/container";
import { Plate } from "@/components/site/plate";
import { Section } from "@/components/site/section";
import { TextLink } from "@/components/site/text-link";

import { mapsDirections, mapsEmbed, NEARBY } from "./content";
import { NearbyTabs } from "./nearby-tabs";

/** The location: address, directions and what's nearby on the left; the map and the brochure route map on the right. */
export function Location({ name, address, pin }: { name: string; address: string[]; pin?: { lat: number; lng: number } }) {
  return (
    <Section id="location" aria-labelledby="location-title">
      <Container className="grid gap-12 lg:grid-cols-12 lg:gap-x-10">
        <div className="lg:col-span-5">
          <h2 id="location-title" className="text-h2">
            The location
          </h2>
          <address className="mt-6 text-body text-text not-italic">
            {address.map((line) => (
              <span key={line} className="block">
                {line}
              </span>
            ))}
          </address>
          {pin ? (
            <TextLink href={mapsDirections(pin)} external className="mt-5">
              Directions
            </TextLink>
          ) : null}

          <h3 className="mt-14 text-h3 lg:mt-16">What&rsquo;s nearby</h3>
          <p className="mt-2 text-small text-muted">Drive times as the project brochure gives them.</p>
          <NearbyTabs groups={NEARBY} className="mt-6" />
        </div>

        <div className="space-y-10 lg:col-span-6 lg:col-start-7">
          {pin ? (
            <iframe
              title={`Map showing ${name}`}
              src={mapsEmbed(pin)}
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              className="block aspect-[4/3] w-full rounded-lg border border-line bg-mist"
            />
          ) : null}
          <Plate
            src={gcviRouteMap}
            alt="Route map from the project brochure showing the Outer Ring Road, Gachibowli, Kokapet, Kollur Exit 2 and Muttangi Junction"
            caption="Route map from the project brochure, not to scale."
            sizes="(min-width: 1024px) 640px, 100vw"
            className="aspect-[1336/1470]"
          />
        </div>
      </Container>
    </Section>
  );
}
