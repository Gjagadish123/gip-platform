import { useMemo } from 'react';
import { Swatch } from '../components/StatusParts.jsx';
import { STATUSES, STATUS_COLOR, STATUS_LABEL, sqyd } from '../lib/plots.js';
import { fmtDate } from '../lib/projects.js';
import { applyFilterOnMap } from '../lib/mapBus.js';

function Donut({ counts, total }) {
  const R = 70;
  const C = 2 * Math.PI * R;
  let acc = 0;
  return (
    <svg viewBox="0 0 200 200" className="h-[190px] w-[190px] shrink-0 -rotate-90" role="img" aria-label={STATUSES.map((s) => `${counts[s]} ${STATUS_LABEL[s].toLowerCase()}`).join(', ')}>
      <circle cx="100" cy="100" r={R} fill="none" stroke="#eaf0ff" strokeWidth="26" />
      {STATUSES.map((s) => {
        if (!counts[s]) return null;
        const len = (counts[s] / total) * C;
        const el = <circle key={s} cx="100" cy="100" r={R} fill="none" stroke={STATUS_COLOR[s]} strokeWidth="26" strokeDasharray={`${Math.max(len - 2, 0.5)} ${C}`} strokeDashoffset={-acc} />;
        acc += len;
        return el;
      })}
    </svg>
  );
}

/** Stacked horizontal bars. Each row is a button that applies the matching filter on the map. */
function Bars({ rows, onPick, live }) {
  const max = Math.max(...rows.map((r) => r.total), 1);
  return (
    <ul className="grid gap-2.5">
      {rows.map((r) => (
        <li key={r.label}>
          <button type="button" onClick={() => onPick(r)} className="group grid w-full grid-cols-[112px_1fr_44px] items-center gap-3 text-left" title={`Show ${r.label.toLowerCase()} plots on the map`}>
            <span className="num text-[15px] font-semibold text-navy-900 group-hover:text-navy-500">{r.label}</span>
            <span className="flex h-6 overflow-hidden rounded-[5px] bg-navy-50">
              {live ? STATUSES.map((s) => (r[s] ? <span key={s} style={{ width: `${(r[s] / max) * 100}%`, background: STATUS_COLOR[s] }} /> : null)) : <span style={{ width: `${(r.total / max) * 100}%` }} className="bg-navy-600" />}
            </span>
            <span className="num text-right text-[17px] font-bold text-navy-900">{r.total}</span>
          </button>
          {live && (
            <p className="num ml-[124px] mt-0.5 text-xs text-ink-muted">
              {STATUSES.filter((s) => r[s])
                .map((s) => `${r[s]} ${STATUS_LABEL[s].toLowerCase()}`)
                .join(', ')}
            </p>
          )}
        </li>
      ))}
    </ul>
  );
}

const tally = (list) => ({ total: list.length, ...Object.fromEntries(STATUSES.map((s) => [s, list.filter((p) => p.status === s).length])) });

export default function Insights({ model, stats }) {
  const live = Boolean(stats?.total);
  const m = useMemo(() => {
    const plots = model.plots;
    const areas = plots.map((p) => p.a).filter(Boolean).sort((a, b) => a - b);
    const mode = Object.entries(plots.reduce((acc, p) => ((acc[p.a] = (acc[p.a] || 0) + 1), acc), {})).sort((a, b) => b[1] - a[1])[0];
    return {
      facing: model.facings.map((f) => ({ label: f, key: f, ...tally(plots.filter((p) => p.f === f)) })),
      bands: model.bands.map((b) => ({ label: `${b.label} sq yd`, key: b.id, ...tally(plots.filter((p) => p.band === b.id)) })),
      roads: model.roads.map((w) => ({ label: `${w}' road`, key: w, ...tally(plots.filter((p) => p.rw === w || p.rw2 === w)) })),
      min: areas[0],
      max: areas[areas.length - 1],
      median: areas.length % 2 ? areas[(areas.length - 1) / 2] : (areas[areas.length / 2 - 1] + areas[areas.length / 2]) / 2,
      mode: mode && { a: Number(mode[0]), n: mode[1] },
      corners: tally(plots.filter((p) => p.corner)),
    };
  }, [model]);

  const facts = [
    m.mode && ['Most common plot', `${sqyd(m.mode.a)} sq yd`, `${m.mode.n} plots of this size`],
    m.min != null && ['Smallest to largest', `${sqyd(m.min)} to ${sqyd(m.max)}`, 'sq yd'],
    m.median != null && ['Median plot', `${sqyd(Math.round(m.median * 100) / 100)} sq yd`, `${Math.round(m.median * 9).toLocaleString('en-IN')} sq ft`],
    m.corners.total > 0 && ['Corner plots', `${m.corners.total}`, live ? `${m.corners.available} still available` : 'on the layout'],
  ].filter(Boolean);

  return (
    <section id="insights" className="scroll-mt-16 bg-navy-50">
      <div className="mx-auto max-w-page px-5 py-16 sm:px-8 sm:py-24">
        <h2 className="display text-[36px] sm:text-[48px]">Property insights</h2>
        <p className="mt-3 max-w-[60ch] text-lg text-ink-soft">Counted live from the layout above. Pick any bar to see those plots highlighted on the map.</p>

        <div className="mt-12 grid gap-x-16 gap-y-14 lg:grid-cols-2">
          {live ? (
            <div className="flex flex-wrap items-center gap-x-10 gap-y-6">
              <div className="relative">
                <Donut counts={stats.counts} total={stats.total} />
                <div className="absolute inset-0 grid place-items-center text-center">
                  <div>
                    <p className="num text-[44px] font-extrabold leading-none text-navy-900">{stats.counts.available}</p>
                    <p className="text-sm text-ink-muted">available</p>
                  </div>
                </div>
              </div>
              <div className="min-w-[200px] flex-1">
                <h3 className="text-xl font-bold">Availability</h3>
                <ul className="mt-3 grid gap-2">
                  {STATUSES.map((s) => (
                    <li key={s}>
                      <button type="button" onClick={() => applyFilterOnMap({ status: [s] })} className={`group flex items-center gap-3 text-left ${stats.counts[s] ? '' : 'opacity-50'}`}>
                        <Swatch s={s} className="h-3.5 w-3.5 rounded-[4px]" />
                        <span className="num w-10 text-xl font-bold text-navy-900">{stats.counts[s]}</span>
                        <span className="text-ink-soft group-hover:text-navy-500">{STATUS_LABEL[s]}</span>
                      </button>
                    </li>
                  ))}
                </ul>
                <p className="mt-3 text-xs text-ink-muted">
                  {stats.sample ? 'Some statuses are sample data. ' : ''}
                  {stats.asOf ? `Status as of ${fmtDate(stats.asOf)}. ` : ''}Confirm with sales before booking.
                </p>
              </div>
            </div>
          ) : (
            <div className="self-center rounded-2xl bg-white p-6 text-ink-soft">
              <h3 className="text-xl font-bold">Availability</h3>
              <p className="mt-2">Live availability isn&apos;t loaded, so only the layout&apos;s own figures are shown here.</p>
            </div>
          )}

          <dl className="grid grid-cols-2 content-start gap-x-8 gap-y-7">
            {facts.map(([k, v, sub]) => (
              <div key={k}>
                <dt className="text-sm text-ink-muted">{k}</dt>
                <dd className="num mt-0.5 text-[28px] font-bold leading-tight text-navy-900">{v}</dd>
                <dd className="text-sm text-ink-muted">{sub}</dd>
              </div>
            ))}
          </dl>

          {m.facing.length > 0 && (
            <div>
              <h3 className="mb-4 text-xl font-bold">By facing</h3>
              <Bars live={live} rows={m.facing} onPick={(r) => applyFilterOnMap({ facing: [r.key] })} />
            </div>
          )}
          {m.bands.length > 0 && (
            <div>
              <h3 className="mb-4 text-xl font-bold">By plot size</h3>
              <Bars live={live} rows={m.bands} onPick={(r) => applyFilterOnMap({ band: [r.key] })} />
            </div>
          )}
          {m.roads.length > 0 && (
            <div>
              <h3 className="mb-4 text-xl font-bold">By road in front</h3>
              <Bars live={live} rows={m.roads} onPick={(r) => applyFilterOnMap({ road: [r.key] })} />
            </div>
          )}
          <div className="self-end text-sm leading-relaxed text-ink-muted">
            <p>
              Facing is the side of the plot that meets its road. Corner plots meet two roads and are counted under their main frontage; the road chart counts them under both. Sizes and plot numbers are as printed on the approved layout.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
