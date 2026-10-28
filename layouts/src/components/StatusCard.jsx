import Icon from './Icon.jsx';
import { LiveBadge, Swatch, changeText } from './StatusParts.jsx';
import { STATUSES, STATUS_LABEL } from '../lib/plots.js';
import { fmtDate } from '../lib/projects.js';

/**
 * Bottom-left availability card: every status with its live count (a zero is dimmed), the total and the date the
 * statuses are as of. Each status is a toggle that filters the map. Phones get a five-across grid.
 */
export default function StatusCard({ counts, total, asOf, sample, live, recent, selected, onToggle }) {
  const { conn, syncedAt, online, loadFailed, retry, backend } = live;
  const failed = loadFailed && !counts;

  return (
    <section aria-label="Availability" className="glass w-full rounded-2xl p-2 shadow-panel sm:w-[244px] sm:p-2.5">
      <header className="flex items-center justify-between gap-2 px-1 pb-1 sm:px-1.5">
        <h2 className="text-[12px] font-bold uppercase tracking-[0.08em] text-ink-soft">Availability</h2>
        {!failed && <LiveBadge conn={conn} syncedAt={syncedAt} online={online} />}
      </header>

      {failed ? (
        <div className="px-1.5 pb-1 pt-0.5" role="alert">
          <p className="text-[13px] leading-snug text-ink-soft">
            {backend ? "Live availability couldn't be loaded, so no statuses are shown." : 'Live availability is not set up for this copy of the page.'}
          </p>
          {backend && (
            <button type="button" onClick={retry} className="mt-2 flex h-10 items-center gap-1.5 rounded-xl bg-navy-700 px-3.5 text-sm font-semibold text-white hover:bg-navy-800">
              <Icon name="refresh" size={16} /> Try again
            </button>
          )}
        </div>
      ) : !counts ? (
        <ul className="grid grid-cols-5 gap-1 sm:grid-cols-1 sm:gap-0.5" aria-busy="true" aria-label="Loading availability">
          {STATUSES.map((s) => (
            <li key={s} className="flex h-10 animate-pulse items-center gap-2 rounded-xl px-2">
              <span className="h-4 w-4 rounded-[5px] bg-navy-100" />
              <span className="h-3 flex-1 rounded bg-navy-100" />
            </li>
          ))}
        </ul>
      ) : (
        <div className="grid grid-cols-5 gap-0.5 sm:grid-cols-1" role="group" aria-label="Show plots by status">
          {STATUSES.map((s) => {
            const on = selected.has(s);
            const zero = counts[s] === 0;
            return (
              <button
                key={s}
                type="button"
                aria-pressed={on}
                onClick={() => onToggle(s)}
                className={`flex min-h-11 flex-col items-center justify-center gap-0.5 rounded-xl px-0.5 py-1 transition-colors sm:flex-row sm:justify-start sm:gap-2.5 sm:px-2 ${on ? 'bg-navy-700 text-white' : 'hover:bg-navy-100'} ${zero && !on ? 'opacity-45' : ''}`}
              >
                <span className="flex items-center gap-1.5 sm:contents">
                  <Swatch s={s} className="h-3.5 w-3.5 rounded-[4px] sm:h-5 sm:w-5 sm:rounded-md" />
                  <span className="num text-[17px] font-bold leading-none sm:w-9 sm:text-right sm:text-[19px]">{counts[s]}</span>
                </span>
                <span className="text-[10.5px] font-medium leading-tight sm:text-sm">{STATUS_LABEL[s]}</span>
              </button>
            );
          })}
        </div>
      )}

      {!failed && (
        <div className="mt-1 border-t border-line px-1 pt-1.5 text-[11.5px] leading-snug text-ink-muted sm:px-1.5">
          {recent ? (
            <p className="font-semibold text-navy-700">
              <span className="text-ink-muted">Just now:</span> {changeText(recent)}
            </p>
          ) : (
            <p className="flex flex-wrap justify-between gap-x-2">
              {counts && <span className="num font-semibold text-navy-900">{total} plots</span>}
              {asOf && <span>Status as of {fmtDate(asOf)}</span>}
            </p>
          )}
          {sample && <p className="mt-0.5">Some statuses are sample data</p>}
        </div>
      )}
    </section>
  );
}
