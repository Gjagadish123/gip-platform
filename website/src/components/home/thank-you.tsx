import { Choreo } from "@/components/motion/choreo";
import { Container } from "@/components/site/container";
import { EnquireButton } from "@/components/site/enquire-button";
import { THANK_YOU } from "@/lib/site";

/**
 * The close of the live home, as the old site sets it: on grained deep navy, its thank-you note at body size (16 px,
 * 18 px from sm), medium weight and centred, then the teal Get in touch; both rise in. Reduced motion: still.
 */
export function ThankYou() {
  return (
    <Choreo as="section" aria-label="Get in touch" className="on-navy grain relative bg-navy-deep py-12 md:py-16 lg:py-20">
      <Container className="flex flex-col items-center gap-6 text-center">
        <p data-anim="fade-up" className="max-w-3xl text-base font-medium text-white sm:text-lg">
          {THANK_YOU}
        </p>
        <div data-anim="fade-up" data-delay="0.1">
          <EnquireButton variant="teal" size="lg" arrow interest="general">
            Get in touch
          </EnquireButton>
        </div>
      </Container>
    </Choreo>
  );
}
