import type { NearbyGroup } from "./content";
import { NearbyTabs } from "./nearby-tabs";

/** What's nearby under a project's address: the travel times the project's own material gives (set in the admin). */
export function Nearby({ groups, className }: { groups: NearbyGroup[]; className?: string }) {
  if (!groups.length) return null;
  return (
    <div className={className}>
      <h3 className="text-h3">What&rsquo;s nearby</h3>
      <p className="mt-2 text-small text-muted">Travel times from the site, as the project&rsquo;s brochure gives them.</p>
      <NearbyTabs groups={groups} className="mt-6" />
    </div>
  );
}
