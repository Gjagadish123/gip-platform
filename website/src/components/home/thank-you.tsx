import { Choreo } from "@/components/motion/choreo";
import { Magnetic } from "@/components/motion/magnetic";
import { Container } from "@/components/site/container";
import { EnquireButton } from "@/components/site/enquire-button";
import { withBase } from "@/lib/base-path";
import { THANK_YOU } from "@/lib/site";

/**
 * The close of the live home, full bleed on grained deep navy: its thank-you note set large and centred, the words
 * brightening from faint to white as it scrolls through, the GIP roof mark huge and faint teal behind it drifting
 * against the scroll, then the teal Get in touch (magnetic on desktop) rising in. Phones: the same at the smaller title
 * size, the mark wider than the screen. Reduced motion: all of it still and at full strength.
 */
export function ThankYou() {
  return (
    <Choreo as="section" aria-label="Get in touch" className="on-navy grain relative overflow-hidden bg-navy-deep py-36 lg:py-52">
      <div aria-hidden data-anim="parallax" data-speed="12" className="pointer-events-none absolute inset-0 flex items-center justify-center">
        {/* The roof (without its window) as a mask over teal, so the tint comes from the token. */}
        <span
          className="aspect-[238/96] w-[170%] max-w-none shrink-0 translate-y-[12%] bg-teal opacity-[0.07] sm:w-[120%] lg:w-[94%]"
          style={{ mask: `url(${withBase("/brand/gip-roof-only-white.svg")}) center / contain no-repeat` }}
        />
      </div>
      <Container className="relative z-10 text-center">
        <p data-anim="scrub-words" className="mx-auto max-w-[24ch] text-title text-white">
          {THANK_YOU}
        </p>
        <div data-anim="fade-up" className="mt-12 lg:mt-16">
          <Magnetic>
            <EnquireButton variant="teal" size="lg" arrow interest="general">
              Get in touch
            </EnquireButton>
          </Magnetic>
        </div>
      </Container>
    </Choreo>
  );
}
