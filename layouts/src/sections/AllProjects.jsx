import Icon from '../components/Icon.jsx';
import { ProjectMark, StatusBar } from '../components/StatusParts.jsx';
import { LOGOS, asset } from '../lib/projects.js';

/**
 * Below the map in All projects: one card per live layout with its availability and the way in. Explore opens it on
 * the map above (the camera travels there).
 * items: [{id, name, location, counts, total, available, unknown}]
 */
export default function AllProjects({ items, onExplore }) {
  const explore = (id) => {
    onExplore(id);
    document.getElementById('plan')?.scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
  };
  return (
    <section id="projects" className="scroll-mt-16 bg-white">
      <div className="mx-auto max-w-page px-5 py-16 sm:px-8 sm:py-24">
        <h2 className="display text-[36px] sm:text-[48px]">Our live layouts</h2>
        <p className="mt-4 max-w-[60ch] text-lg text-ink-soft">
          Every approved layout on the real map, with each plot&apos;s status as it changes. Open one to walk its plots in 2D or 3D.
        </p>
        <ul className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2">
          {items.map((it) => (
            <li key={it.id} className="flex flex-col rounded-2xl border border-line p-5 sm:p-6">
              <div className="flex items-center gap-3.5">
                {LOGOS[it.id]?.full ? (
                  <img src={asset(LOGOS[it.id].full)} alt="" className="h-14 w-[88px] shrink-0 object-contain" />
                ) : (
                  <ProjectMark id={it.id} name={it.name} size={44} />
                )}
                <div className="min-w-0">
                  <h3 className="text-[19px] font-bold leading-tight text-navy-900">{it.name}</h3>
                  {it.location && <p className="mt-0.5 truncate text-sm text-ink-muted">{it.location}</p>}
                </div>
              </div>
              <p className="num mt-5 text-[15px] font-semibold text-ink-soft">
                {it.total ? `${it.available} of ${it.total} plots available` : it.unknown ? 'Availability not loaded' : 'Loading availability…'}
              </p>
              <StatusBar counts={it.counts} total={it.total} className="mt-2 h-2" />
              <button
                type="button"
                onClick={() => explore(it.id)}
                className="mt-5 flex h-11 items-center justify-center gap-2 self-start rounded-xl bg-navy-700 px-4 text-sm font-semibold text-white hover:bg-navy-800"
              >
                Explore {it.name} <Icon name="chevron" size={16} className="-rotate-90" />
              </button>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
