import Icon from '../components/Icon.jsx';
import { sqyd } from '../lib/plots.js';
import { approvals, fmtDate, landAreaText, photos } from '../lib/projects.js';

const LAND = [
  { k: 'plotted', label: 'Plots', color: '#033967' },
  { k: 'roads', label: 'Roads', color: '#5b6572' },
  { k: 'park', label: 'Parks', color: '#2f8a4a' },
  { k: 'social', label: 'Social infrastructure', color: '#0f7ed9' },
  { k: 'utility', label: 'Utilities', color: '#f0a020' },
];
const list = (xs) => (xs.length > 1 ? `${xs.slice(0, -1).join(', ')} and ${xs[xs.length - 1]}` : xs[0] || '');

/** Project copy from public_content, figures counted from the live layout. Parts without data are left out. */
export default function Overview({ project, model, stats, data }) {
  const c = project.content || {};
  const total = stats?.total || data?.plots.length;
  const area = landAreaText(c.landArea);
  const aps = approvals(c);
  const by = [...new Set(aps.map((a) => a.authority).filter((a) => a === 'HMDA' || a === 'DTCP' || a === 'RERA'))];
  const lu = data?.landUse;
  const land = lu?.net ? LAND.filter((l) => lu[l.k] > 0) : [];
  const fmt = (n) => n.toLocaleString('en-IN', { minimumFractionDigits: 2 });
  const areas = model ? model.plots.map((p) => p.a).filter(Boolean) : [];
  const facts = [
    areas.length && ['Plot sizes', `${sqyd(Math.min(...areas))} to ${sqyd(Math.max(...areas))} sq yd`],
    model?.roads.length && ['Roads', `${list(model.roads.map((r) => `${r}'`))} wide`],
    area && ['Land area', area],
  ].filter(Boolean);
  const highlights = (c.highlights || []).filter(Boolean);
  const pics = photos(c);

  return (
    <section id="overview" className="scroll-mt-16 bg-white">
      <div className="mx-auto max-w-page px-5 py-16 sm:px-8 sm:py-24">
        <div className={`grid gap-12 lg:gap-20 ${land.length || highlights.length ? 'lg:grid-cols-[1.05fr_1fr]' : ''}`}>
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.1em] text-navy-600">{c.location?.full || c.location?.short || 'Overview'}</p>
            <h2 className="display mt-3 text-[40px] sm:text-[56px]">
              {total ? `${total} plots` : project.name}
              {area ? ` across ${area}` : ''}
              {by.length ? `, approved by ${list(by)}.` : '.'}
            </h2>
            {c.description && <p className="mt-6 max-w-[58ch] text-lg leading-relaxed text-ink-soft">{c.description}</p>}
            {facts.length > 0 && (
              <dl className="mt-10 grid grid-cols-2 gap-x-8 gap-y-6 border-t border-line pt-8 sm:grid-cols-3">
                {facts.map(([k, v]) => (
                  <div key={k}>
                    <dt className="text-sm text-ink-muted">{k}</dt>
                    <dd className="num mt-0.5 text-2xl font-bold text-navy-900">{v}</dd>
                  </div>
                ))}
              </dl>
            )}
          </div>

          {land.length > 0 ? (
            <figure aria-labelledby="landuse-title" className="self-start">
              <figcaption id="landuse-title" className="text-xl font-bold text-navy-900">
                How the {fmt(lu.net)} sq yd are used
              </figcaption>
              <p className="mt-1 text-sm text-ink-muted">Land-use table of the approved layout</p>
              <div className="mt-5 flex h-12 w-full overflow-hidden rounded-lg" role="img" aria-label="Land use split">
                {land.map((l) => (
                  <div key={l.k} style={{ width: `${(lu[l.k] / lu.net) * 100}%`, background: l.color }} title={`${l.label}: ${fmt(lu[l.k])} sq yd`} />
                ))}
              </div>
              <table className="mt-5 w-full text-left">
                <tbody className="divide-y divide-line">
                  {land.map((l) => (
                    <tr key={l.k}>
                      <th scope="row" className="py-2.5 font-medium text-ink-soft">
                        <span className="mr-3 inline-block h-3 w-3 rounded-[3px] align-[-1px]" style={{ background: l.color }} />
                        {l.label}
                      </th>
                      <td className="num py-2.5 text-right text-lg font-semibold text-navy-900">{fmt(lu[l.k])}</td>
                      <td className="num w-16 py-2.5 text-right text-ink-muted">{((lu[l.k] / lu.net) * 100).toFixed(1)}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </figure>
          ) : (
            highlights.length > 0 && <Highlights items={highlights} />
          )}
        </div>

        {land.length > 0 && highlights.length > 0 && (
          <div className="mt-16">
            <Highlights items={highlights} wide />
          </div>
        )}

        {aps.length > 0 && (
          <>
            <div className="tick-rule mt-16" aria-hidden="true" />
            <h3 className="mt-6 text-xl font-bold">{c.legal?.title || 'Approvals'}</h3>
            <dl className="mt-5 grid gap-x-10 gap-y-6 sm:grid-cols-2 lg:grid-cols-4">
              {aps.map((a) => (
                <div key={a.id || a.title}>
                  <dt className="text-sm text-ink-muted">{a.title}</dt>
                  <dd className="num mt-0.5 text-[19px] font-semibold text-navy-900">{a.reference || (a.status ? a.status[0].toUpperCase() + a.status.slice(1) : '')}</dd>
                  {(a.date || a.description) && (
                    <dd className="mt-0.5 text-sm text-ink-muted">
                      {a.date ? `Dated ${fmtDate(a.date)}` : ''}
                      {a.date && a.description ? '. ' : ''}
                      {a.description}
                    </dd>
                  )}
                </div>
              ))}
            </dl>
          </>
        )}
      </div>

      {pics.length > 0 && (
        <div className="pb-16 sm:pb-24">
          <div className="mx-auto max-w-page px-5 sm:px-8">
            <h3 className="text-xl font-bold">Photos</h3>
          </div>
          <ul className="no-scrollbar mt-5 flex snap-x snap-mandatory gap-3 overflow-x-auto px-5 sm:px-[max(2rem,calc((100vw-1180px)/2+2rem))]" aria-label={`${project.name} photos`}>
            {pics.map((a, i) => (
              <li key={a.url} className="shrink-0 snap-start">
                <figure>
                  <img src={a.url} alt={a.alt || `${project.name}, photo ${i + 1} of ${pics.length}`} loading="lazy" decoding="async" className="aspect-[4/3] w-[280px] rounded-2xl bg-navy-50 object-cover sm:w-[360px]" />
                  {a.impression && <figcaption className="mt-1.5 text-xs text-ink-muted">Artist&apos;s impression</figcaption>}
                </figure>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}

function Highlights({ items, wide = false }) {
  return (
    <div className="self-start">
      <h3 className="text-xl font-bold">Highlights</h3>
      <ul className={`mt-5 grid gap-x-8 gap-y-3 ${wide ? 'sm:grid-cols-2 lg:grid-cols-3' : 'sm:grid-cols-2 lg:grid-cols-1'}`}>
        {items.map((t) => (
          <li key={t} className="flex items-start gap-3 border-b border-line pb-3 text-[16px] text-navy-900">
            <span className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full bg-navy-100 text-navy-700">
              <Icon name="check" size={14} />
            </span>
            {t}
          </li>
        ))}
      </ul>
    </div>
  );
}
