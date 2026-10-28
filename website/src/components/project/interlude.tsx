import { Container } from "@/components/site/container";
import { EnquireButton } from "@/components/site/enquire-button";
import type { InterestId } from "@/lib/enquiry";

import { Film } from "./film";

/** The page's one film moment: the aerial loop full-bleed, the ideology line and an enquiry over a navy-deep fade. */
export function FilmBand({ name, interest, acres }: { name: string; interest: InterestId; acres?: number }) {
  return (
    <section aria-labelledby="ideology-title" className="relative">
      <Film label={`Aerial film, an artist's impression of ${name}`} className="aspect-[4/5] w-full sm:aspect-auto sm:h-[min(80vh,760px)] sm:min-h-[30rem]">
        <div aria-hidden className="absolute inset-x-0 bottom-0 h-full bg-linear-to-t from-navy-deep/95 via-navy-deep/70 to-navy-deep/5 sm:h-4/5 sm:from-navy-deep/90 sm:via-navy-deep/60 sm:to-transparent" />
        <div className="on-navy absolute inset-x-0 bottom-0 pb-16 lg:pb-20">
          <Container>
            <div className="max-w-[36rem]">
              <h2 id="ideology-title" className="text-h2 text-white">
                A rare plot for an unhurried life.
              </h2>
              <p className="mt-4 text-body text-white/80 lg:text-lede">
                {acres ? `${acres} acres` : "A gated layout"} off the Mumbai Highway, close to GITAM University and the Outer
                Ring Road. Build a weekend home now, or keep the plot until the family is ready: the layout is approved, and
                the work on site is there to see.
              </p>
              <EnquireButton variant="light" arrow interest={interest} className="mt-8">
                Enquire now
              </EnquireButton>
            </div>
          </Container>
        </div>
      </Film>
    </section>
  );
}
