// The header's menu (client, 12 Nov 2026: every menu in the header, no separate menu page): Home, the three project
// dropdowns, About, Contact. The project lists come from what the admin publishes; the delivered names from site.ts.
import { LAYOUTS_URL, LIVE_LAYOUT_IDS, liveLayoutUrl } from './constants';
import { getProjects, hasDetailPage } from './projects';
import { COMPLETED_PROJECTS } from './site';

export type NavLink = { href: string; label: string; note?: string };
export type NavGroup = { key: string; label: string; items: NavLink[]; all: NavLink; wide?: boolean };
export type SiteNav = { groups: NavGroup[] };

export async function getSiteNav(): Promise<SiteNav> {
  const projects = await getProjects();
  const name = (p: (typeof projects)[number]) => p.name.split(/\s+[–-]\s+/)[0]; // 'Western County – Shankarpalli' -> 'Western County'
  // the place, short: 'Near Shamirpet & Mediciti Hospital Road, …' -> 'Shamirpet'
  const place = (p: (typeof projects)[number]) => p.location.short?.split(',')[0].replace(/^near\s+/i, '').split(/\s+&\s+|\s+\/\s+/)[0];
  const ongoing = projects.filter(hasDetailPage);
  const live = LIVE_LAYOUT_IDS.map((id) => projects.find((p) => p.id === id)).filter((p) => !!p);
  return {
    groups: [
      {
        key: 'ongoing',
        label: 'Ongoing Projects',
        items: ongoing.map((p) => ({ href: `/projects/${p.publishing.slug}`, label: name(p), note: place(p) })),
        all: { href: '/projects#current', label: 'All ongoing projects' },
      },
      {
        key: 'live',
        label: 'Live Layouts',
        items: live.map((p) => ({ href: liveLayoutUrl(p.id), label: name(p) })),
        all: { href: LAYOUTS_URL, label: 'All layouts on one map' },
      },
      {
        key: 'delivered',
        label: 'Delivered',
        items: COMPLETED_PROJECTS.map((d) => ({ href: '/projects#delivered', label: d.name, note: d.location })),
        all: { href: '/projects#delivered', label: 'All delivered layouts' },
        wide: true,
      },
    ],
  };
}
