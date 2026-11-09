import { Container } from "@/components/site/container";
import { EnquireButton } from "@/components/site/enquire-button";
import type { InterestId } from "@/lib/enquiry";

import { Film } from "./film";

/** The page's film moment: the project's film (or photo) full-bleed, the admin's call-to-action line and an enquiry
 * over a navy-deep fade. */
export function FilmBand({
  title,
  description,
  interest,
  media,
}: {
  title: string;
  description?: string;
  interest: InterestId;
  media: { label: string; video?: string; poster?: string; impression?: boolean };
}) {
  return (
    <section aria-labelledby="ideology-title" className="relative">
      <Film {...media} className="aspect-[4/5] w-full sm:aspect-auto sm:h-[min(80vh,760px)] sm:min-h-[30rem]">
        <div aria-hidden className="absolute inset-x-0 bottom-0 h-full bg-linear-to-t from-navy-deep/95 via-navy-deep/70 to-navy-deep/5 sm:h-4/5 sm:from-navy-deep/90 sm:via-navy-deep/60 sm:to-transparent" />
        <div className="on-navy absolute inset-x-0 bottom-0 pb-16 lg:pb-20">
          <Container>
            <div className="max-w-[36rem]">
              <h2 id="ideology-title" className="text-h2 text-white">
                {title}
              </h2>
              {description ? <p className="mt-4 text-body text-white/80 lg:text-lede">{description}</p> : null}
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
