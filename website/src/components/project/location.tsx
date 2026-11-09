import type { CSSProperties } from "react";

import { Container } from "@/components/site/container";
import { Plate } from "@/components/site/plate";
import { Section } from "@/components/site/section";
import { TextLink } from "@/components/site/text-link";
import type { Asset } from "@/lib/types";

import { mapsDirections, mapsEmbed, type NearbyGroup } from "./content";
import { Nearby } from "./nearby";

/** The location: address, directions and what's nearby on the left; the map and the admin's location picture on the right. */
export function Location({
  name,
  address,
  pin,
  nearby,
  image,
}: {
  name: string;
  address: string[];
  pin?: { lat: number; lng: number };
  nearby: NearbyGroup[];
  image?: Asset | null;
}) {
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
          <TextLink
            href={pin ? mapsDirections(pin) : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${name}, ${address.join(", ")}`)}`}
            external
            className="mt-5"
          >
            {pin ? "Directions" : "Find it on Google Maps"}
          </TextLink>

          <Nearby groups={nearby} className="mt-14 lg:mt-16" />
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
          {image?.kind === "image" ? (
            <div style={{ "--ratio": image.width && image.height ? `${image.width} / ${image.height}` : "4 / 3" } as CSSProperties}>
              <Plate
                src={image.url}
                alt={image.alt || `Location of ${name}`}
                impression={image.impression}
                sizes="(min-width: 1024px) 640px, 100vw"
                className="aspect-(--ratio)"
              />
            </div>
          ) : null}
        </div>
      </Container>
    </Section>
  );
}
