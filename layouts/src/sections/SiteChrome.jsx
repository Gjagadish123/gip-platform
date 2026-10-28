import { useEffect, useState } from 'react';
import Icon from '../components/Icon.jsx';
import { ProjectMark } from '../components/StatusParts.jsx';
import { COMPANY } from '../data/project.js';
import { LOGOS, approvals, asset, directionsUrl, fmtDate } from '../lib/projects.js';

/** sections: [[id, label]] of the sections that have something to show */
export function SectionNav({ project, sections, pin }) {
  const [current, setCurrent] = useState('overview');
  const ids = sections.map(([id]) => id).join(',');
  useEffect(() => {
    const els = ids.split(',').map((id) => document.getElementById(id)).filter(Boolean);
    const io = new IntersectionObserver(
      (entries) => {
        const vis = entries.filter((e) => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (vis[0]) setCurrent(vis[0].target.id);
      },
      { rootMargin: '-72px 0px -55% 0px' }
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, [ids, project.id]);

  return (
    <nav aria-label="Page sections" className="sticky top-0 z-40 border-b border-line bg-white/95 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-page items-center gap-2 px-3 sm:px-8">
        <a href="#plan" className="mr-2 hidden shrink-0 items-center gap-2 text-[15px] font-bold text-navy-900 md:flex">
          <ProjectMark id={project.id} name={project.name} size={32} />
          {project.name}
        </a>
        <ul className="no-scrollbar flex min-w-0 flex-1 items-center gap-0.5 overflow-x-auto">
          {sections.map(([id, label]) => (
            <li key={id}>
              <a
                href={`#${id}`}
                aria-current={current === id ? 'true' : undefined}
                className={`block whitespace-nowrap rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors ${current === id ? 'bg-navy-100 text-navy-700' : 'text-ink-soft hover:text-navy-700'}`}
              >
                {label}
              </a>
            </li>
          ))}
        </ul>
        {pin && (
          <a href={directionsUrl(pin)} target="_blank" rel="noreferrer" className="hidden h-9 shrink-0 items-center gap-1.5 rounded-full border border-line px-3.5 text-sm font-semibold text-navy-700 hover:border-navy-500 sm:flex">
            <Icon name="route" size={15} /> Directions
          </a>
        )}
        <a href="#plan" className="flex h-9 shrink-0 items-center gap-1.5 rounded-full bg-navy-700 px-3.5 text-sm font-semibold text-white hover:bg-navy-800">
          <Icon name="pin" size={15} />
          <span className="sm:hidden">Map</span>
          <span className="hidden sm:inline">Back to the map</span>
        </a>
      </div>
    </nav>
  );
}

export function Footer({ project, stats }) {
  const refs = approvals(project.content)
    .filter((a) => a.reference)
    .map((a) => `${a.authority === 'RERA' ? 'RERA' : `${a.authority} LP No.`} ${a.reference}`);
  return (
    <footer className="bg-navy-950 text-navy-100">
      <div className="mx-auto max-w-page px-5 py-14 sm:px-8">
        <div className="flex flex-wrap items-start justify-between gap-10">
          <div className="flex items-center gap-8">
            {LOGOS[project.id] ? <img src={asset(LOGOS[project.id].white)} alt={project.name} className="h-28 w-auto" /> : <ProjectMark id={project.id} name={project.name} size={84} light />}
            {/* the lockup without its URL band: the website is a real link at the foot of this footer */}
            <img src={asset('brand/gip-lockup-white.svg')} alt="Greater Infra Projects" className="h-20 w-auto" />
          </div>
          <div className="max-w-[64ch] text-sm leading-relaxed text-navy-300">
            <p>
              This interactive layout is an illustration prepared from the approved layout of {project.name}
              {refs.length ? ` (${refs.join(', ')})` : ''}. Plot positions are matched to satellite imagery within a few metres; trees, villas and buildings in the 3D view are
              artist&apos;s impressions. Dimensions, areas and boundaries in the registered documents prevail.
            </p>
            <p className="mt-3">
              Availability is read live from Greater Infra Projects&apos; inventory{stats?.asOf ? `, status as of ${fmtDate(stats.asOf)}` : ''}. Please confirm status and price with the sales team before making a decision.
            </p>
          </div>
        </div>
        <div className="mt-10 flex flex-wrap items-center justify-between gap-4 border-t border-white/10 pt-6 text-sm text-navy-300">
          <p>
            © {new Date().getFullYear()} {COMPANY.name}. All rights reserved.
          </p>
          <a href={COMPANY.website} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 font-semibold text-white hover:text-survey">
            Visit our website <Icon name="external" size={14} />
          </a>
        </div>
      </div>
    </footer>
  );
}
