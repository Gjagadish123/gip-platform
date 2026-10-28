import { useMemo, useState } from 'react';
import Icon from '../components/Icon.jsx';
import { directionsUrl, distanceText, fmtDate } from '../lib/projects.js';
import { showPlaceOnMap } from '../lib/mapBus.js';

const categoriesOf = (content) => (content?.locationAdvantages?.categories || []).filter((c) => c?.places?.length);
export const hasLocation = (content, landmarks) => Boolean(categoriesOf(content).length || landmarks?.places?.length || content?.location?.full);

/**
 * Location advantages from public_content; measured drive distances from src/data/landmarks/<id>.json when that
 * project has them (same schema as the demo's landmarks file).
 */
export default function Location({ project, landmarks, pin }) {
  const c = project.content || {};
  const adv = c.locationAdvantages || {};
  const cats = categoriesOf(c);
  const places = landmarks?.places || [];
  const [cat, setCat] = useState('All');
  const [showAll, setShowAll] = useState(false);
  const groups = useMemo(() => [...new Set(places.map((p) => p.category))], [places]);
  const rows = useMemo(() => places.filter((p) => cat === 'All' || p.category === cat).sort((a, b) => a.driveKm - b.driveKm), [places, cat]);
  const maxKm = Math.max(...places.map((p) => p.driveKm), 1);
  if (!hasLocation(c, landmarks)) return null;

  return (
    <section id="location" className="scroll-mt-16 bg-navy-900 text-white">
      <div className="mx-auto max-w-page px-5 py-16 sm:px-8 sm:py-24">
        <div className="grid gap-14 lg:grid-cols-[0.85fr_1.15fr] lg:gap-20">
          <div className="min-w-0">
            {adv.badge && <p className="inline-flex rounded-full bg-survey px-3 py-1 text-[13px] font-bold text-navy-900">{adv.badge}</p>}
            <h2 className="display mt-4 text-[36px] !text-white sm:text-[48px]">{adv.title || 'Location advantage'}</h2>
            <p className="mt-4 max-w-[48ch] text-lg text-navy-100/80">{adv.description || c.location?.full}</p>
            {adv.description && c.location?.full && (
              <p className="mt-4 flex items-start gap-2 text-navy-100/80">
                <Icon name="pin" size={18} className="mt-0.5 shrink-0 text-survey" /> {c.location.full}
              </p>
            )}
            {cats.length > 0 && (
              <ul className="mt-10 grid gap-7">
                {cats.map((k) => (
                  <li key={k.id || k.title} className="border-l-2 border-survey pl-5">
                    <h3 className="text-lg font-bold !text-white">{k.title}</h3>
                    <ul className="mt-1.5 grid gap-1">
                      {k.places.map((p) => (
                        <li key={p.id || p.name} className="flex justify-between gap-4 text-navy-100/85">
                          <span>{p.name}</span>
                          <span className="num shrink-0 font-semibold text-white">{distanceText(p.distance)}</span>
                        </li>
                      ))}
                    </ul>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div id="nearby" className="min-w-0 scroll-mt-24">
            {places.length > 0 ? (
              <>
                <div className="flex flex-wrap items-end justify-between gap-4">
                  <h2 className="text-2xl font-bold !text-white">Nearby landmarks</h2>
                  <div className="no-scrollbar -mx-1 flex max-w-full gap-1.5 overflow-x-auto px-1" role="group" aria-label="Landmark category">
                    {['All', ...groups].map((g) => (
                      <button
                        key={g}
                        aria-pressed={cat === g}
                        type="button"
                        onClick={() => setCat(g)}
                        className={`h-9 shrink-0 rounded-full px-3.5 text-sm font-medium transition-colors ${cat === g ? 'bg-white text-navy-900' : 'bg-white/10 text-white hover:bg-white/20'}`}
                      >
                        {g}
                      </button>
                    ))}
                  </div>
                </div>
                <ul className="mt-6 divide-y divide-white/10 border-y border-white/10">
                  {(cat === 'All' && !showAll ? rows.slice(0, 8) : rows).map((p) => (
                    <li key={p.name}>
                      <button type="button" onClick={() => showPlaceOnMap(p)} className="group grid w-full grid-cols-[1fr_auto] items-center gap-x-5 py-3.5 text-left" title={`Show ${p.name} on the map`}>
                        <span className="min-w-0">
                          <span className="block truncate text-[17px] font-semibold group-hover:text-survey">{p.name}</span>
                          <span className="mt-1.5 block h-1 rounded-full bg-white/10">
                            <span className="block h-1 rounded-full bg-survey" style={{ width: `${Math.max((p.driveKm / maxKm) * 100, 2)}%` }} />
                          </span>
                        </span>
                        <span className="text-right">
                          <span className="num block text-[22px] font-bold leading-none">{p.driveKm} km</span>
                          <span className="num text-sm text-navy-300">about {p.driveMin} min</span>
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
                {cat === 'All' && rows.length > 8 && (
                  <button type="button" onClick={() => setShowAll((v) => !v)} className="mt-4 h-10 rounded-full bg-white/10 px-4 text-sm font-semibold hover:bg-white/20" aria-expanded={showAll}>
                    {showAll ? 'Show fewer places' : `Show all ${rows.length} places`}
                  </button>
                )}
                <p className="mt-4 text-sm text-navy-300">
                  Driving distance and time from the site without live traffic{landmarks.generated ? `, measured with Google Maps on ${fmtDate(landmarks.generated)}` : ''}. Pick a row to see it on the map.
                </p>
              </>
            ) : (
              <div className="rounded-2xl bg-white/5 p-6 sm:p-8">
                <h2 className="text-2xl font-bold !text-white">Getting there</h2>
                <p className="mt-2 text-navy-100/80">{c.location?.full || project.name}</p>
              </div>
            )}
            {pin && (
              <a href={directionsUrl(pin)} target="_blank" rel="noreferrer" className="mt-6 inline-flex h-12 items-center gap-2 rounded-xl bg-survey px-5 text-[15px] font-semibold text-navy-900 hover:bg-white">
                <Icon name="route" size={18} /> Get directions to the site
              </a>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
