import { useEffect, useState } from 'react';
import { STATUSES, STATUS_COLOR, STATUS_LABEL, STATUS_SWATCH } from '../lib/plots.js';
import { LOGOS, asset, monogram } from '../lib/projects.js';

export function Swatch({ s, className = 'h-4 w-4 rounded-[5px]' }) {
  return <span className={`inline-block shrink-0 ${STATUS_SWATCH[s]} ${className}`} aria-hidden="true" />;
}

/** One thin bar split by status, in the client's order. */
export function StatusBar({ counts, total, className = 'h-1.5' }) {
  if (!counts || !total) return <span className={`block rounded-full bg-navy-100 ${className}`} aria-hidden="true" />;
  return (
    <span className={`flex overflow-hidden rounded-full bg-navy-100 ${className}`} aria-hidden="true">
      {STATUSES.map((s) => (counts[s] ? <span key={s} style={{ width: `${(counts[s] / total) * 100}%`, background: STATUS_COLOR[s] }} /> : null))}
    </span>
  );
}

/** The project's own artwork (GC VI's brochure logo), else a monogram on navy. */
export function ProjectMark({ id, name, size = 40, light = false }) {
  const logo = LOGOS[id];
  if (logo) return <img src={asset(light ? logo.white : logo.mark)} alt="" width={size} height={size} className="shrink-0" style={{ width: size, height: size }} />;
  const m = monogram(name);
  return (
    <span
      aria-hidden="true"
      className={`grid shrink-0 place-items-center rounded-[22%] ring-1 ring-inset ${light ? 'bg-white/10 ring-white/25' : 'bg-navy-700 ring-survey/70'}`}
      style={{ width: size, height: size }}
    >
      <span className="num text-center font-extrabold leading-[0.85] text-white" style={{ fontSize: size * (m.main.length > 2 ? 0.3 : 0.4) }}>
        {m.top && <span className="block text-survey" style={{ fontSize: size * 0.2, letterSpacing: '0.08em' }}>{m.top}</span>}
        {m.main}
      </span>
    </span>
  );
}

const timeOf = (t) => new Date(t).toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit', hour12: true }).toLowerCase();

/** "Live · synced 7:42 pm" / "Reconnecting…" / "Offline". The connection change itself is announced, not the clock. */
export function LiveBadge({ conn, syncedAt, online, className = '' }) {
  const [said, setSaid] = useState('');
  const [seen, setSeen] = useState(conn);
  if (conn !== seen) {
    setSeen(conn);
    if (conn === 'offline') setSaid(online ? 'Live updates paused. Reconnecting.' : 'You are offline. Availability may be out of date.');
    else if (conn === 'live' && seen === 'offline') setSaid('Live updates are back on.');
  }
  if (conn === 'none') return null;
  const label = conn === 'live' ? 'Live' : conn === 'connecting' ? 'Connecting…' : online ? 'Reconnecting…' : 'Offline';
  const dot = conn === 'live' ? 'bg-status-available' : conn === 'connecting' ? 'bg-ink-faint' : 'bg-status-mortgaged';
  return (
    <p className={`inline-flex items-center gap-1.5 whitespace-nowrap text-[12px] font-semibold text-navy-900 ${className}`} title={syncedAt ? `Last synced ${timeOf(syncedAt)}` : undefined}>
      <span className="relative flex h-2 w-2" aria-hidden="true">
        {conn === 'live' && <span key={syncedAt ? 'a' : 'b'} className="absolute inset-0 rounded-full bg-status-available opacity-60 motion-safe:animate-[ping_1s_cubic-bezier(0,0,0.2,1)_3]" />}
        <span className={`relative h-2 w-2 rounded-full ${dot}`} />
      </span>
      {label}
      {conn === 'live' && syncedAt && <span className="num font-medium text-ink-muted">· synced {timeOf(syncedAt)}</span>}
      <span role="status" className="sr-only">
        {said}
      </span>
    </p>
  );
}

/** "Just now: plot 26 is now Hold." for a little while after a live change, and only on the project it happened in.
 * The clock runs from the change itself, so switching projects neither keeps it alive nor brings it back later. */
export function useRecent(lastChange, project, ms = 20_000) {
  const [recent, setRecent] = useState(null);
  useEffect(() => {
    if (!lastChange) return;
    setRecent(lastChange);
    const t = setTimeout(() => setRecent(null), ms);
    return () => clearTimeout(t);
  }, [lastChange, ms]);
  return recent?.project === project ? recent : null;
}
export function changeText(c) {
  if (!c) return '';
  const to = c.to ? STATUS_LABEL[c.to] : null;
  if (c.numbers.length === 1) return `Plot ${c.numbers[0]} is now ${to || 'updated'}.`;
  return to ? `${c.numbers.length} plots now ${to}.` : `${c.numbers.length} plots updated.`;
}
