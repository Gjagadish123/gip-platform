import { Container } from "@/components/site/container";
import { Section } from "@/components/site/section";

import { ArchPicture } from "./arch";

/** The entrance arch design, wide, after the highlights. The section's copy was removed at the client's request. */
export function ArchBand() {
  return (
    <Section aria-label="Entrance arch design" className="border-t border-line">
      <Container>
        <ArchPicture />
      </Container>
    </Section>
  );
}
