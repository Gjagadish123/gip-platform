import { useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import Icon from './Icon.jsx';
import { STATUS_LABEL, inr, inrShort, sqyd, facingText, roadText, plotPrice } from '../lib/plots.js';
import { fmtDate, shareUrl } from '../lib/projects.js';
import { COMPANY } from '../data/project.js';

// text colours chosen for WCAG AA on each fill
const STATUS_STYLE = {
  available: 'bg-status-available text-navy-900',
  sold_out: 'bg-[#c8372f] text-white',
  mortgaged: 'bg-status-mortgaged text-navy-900',
  registered: 'bg-status-registered text-white',
  hold: 'bg-status-hold text-white',
};

function similarTo(p, plots) {
  return plots
    .filter((q) => q.status === 'available' && q.n !== p.n)
    .map((q) => ({ q, score: Math.abs(q.a - p.a) / p.a + (q.f === p.f ? 0 : 0.35) + (q.rw === p.rw ? 0 : 0.1) + Math.hypot(q.c[0] - p.c[0], q.c[1] - p.c[1]) / 2500 }))
    .sort((a, b) => a.score - b.score)
    .slice(0, 4)
    .map((x) => x.q);
}

const NOT_AVAILABLE = {
  sold_out: 'This plot is sold.',
  registered: 'This plot is sold and registered.',
  mortgaged: 'This plot is mortgaged and not on sale now.',
  hold: 'This plot is on hold for a buyer.',
};

export default function PlotPanel({ plot, plots, project, onClose, onSelect }) {
  const [copied, setCopied] = useState(false);
  const ref = useRef(null);
  const opener = useRef(null);

  // Focus moves into the card when it opens (also closes the phone keyboard after a search) and back to whatever
  // opened it when it closes, unless that was a text field.
  useEffect(() => {
    opener.current = document.activeElement;
    ref.current?.focus({ preventScroll: true });
  }, []);
  const close = () => {
    const back = opener.current;
    onClose();
    const target = back && document.contains(back) && !/input|textarea|select/i.test(back.tagName) && !ref.current?.contains(back) ? back : document.getElementById('plan');
    requestAnimationFrame(() => target?.focus?.({ preventScroll: true }));
  };
  const similar = useMemo(() => (plot.status && plot.status !== 'available' ? similarTo(plot, plots) : []), [plot, plots]);
  const price = plotPrice(plot, project.content);
  const wa = `https://wa.me/${COMPANY.whatsapp}?text=${encodeURIComponent(`Hi, I'm interested in plot ${plot.n} at ${project.name}`)}`;

  const share = async () => {
    const url = shareUrl(project.id, plot.n);
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      // no clipboard (insecure context, denied): fall back to the share sheet where there is one
      if (navigator.share) navigator.share({ title: `${project.name}, plot ${plot.n}`, url }).catch(() => {});
    }
  };

  const rows = [
    ['Area', `${sqyd(plot.a)} sq yd`, `${Math.round(plot.a * 9).toLocaleString('en-IN')} sq ft`],
    facingText(plot) && ['Facing', facingText(plot), plot.corner ? 'corner plot' : plot.through ? 'second frontage at the back' : null],
    roadText(plot) && ['Road', roadText(plot), null],
    plot.w && plot.d ? ['Size', `${plot.w}' × ${plot.d}'`, 'frontage × depth'] : ['Size', 'On the approved layout', 'ask sales for the dimensioned sheet'],
    plot.block && ['Block', plot.block, null],
  ].filter(Boolean);

  return (
    <motion.aside
      key="panel"
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 12 }}
      transition={{ duration: 0.22, ease: 'easeOut' }}
      ref={ref}
      tabIndex={-1}
      role="region"
      aria-label={`Plot ${plot.n} details`}
      onKeyDown={(e) => e.key === 'Escape' && (e.stopPropagation(), close())}
      className="glass pointer-events-auto flex max-h-[58svh] w-full flex-col overflow-hidden rounded-t-2xl shadow-lift focus:outline-none sm:max-h-[calc(100svh-200px)] sm:w-[340px] sm:rounded-2xl"
    >
      <span className="mx-auto mt-2 h-1 w-10 rounded-full bg-navy-100 sm:hidden" aria-hidden="true" />
      <header className="flex items-start gap-3 border-b border-line px-5 pb-3 pt-2 sm:pb-4 sm:pt-4">
        <div className="min-w-0 flex-1">
          <p className="text-[13px] font-medium text-ink-muted">Plot</p>
          <p className="num -mt-1 text-[56px] font-extrabold leading-none text-navy-900 sm:text-[64px]">{plot.n}</p>
        </div>
        <div className="mt-1 flex flex-col items-end gap-1">
          {plot.status ? (
            <span className={`inline-flex items-center rounded-full px-3 py-1 text-[13px] font-bold ${STATUS_STYLE[plot.status]}`}>{STATUS_LABEL[plot.status]}</span>
          ) : (
            <span className="inline-flex items-center rounded-full bg-navy-100 px-3 py-1 text-[13px] font-semibold text-ink-soft">Status unavailable</span>
          )}
          {plot.dt && plot.status && <span className="num text-[12px] text-ink-muted">Since {fmtDate(plot.dt)}</span>}
        </div>
        <button type="button" onClick={close} aria-label="Close plot details" className="-mr-2 -mt-1 grid h-10 w-10 shrink-0 place-items-center rounded-full text-ink-soft hover:bg-navy-100">
          <Icon name="close" size={18} />
        </button>
      </header>

      <div className="no-scrollbar flex-1 overflow-y-auto px-5 py-3 sm:py-4">
        {plot.sample && <p className="mb-2 rounded-lg bg-navy-50 px-3 py-2 text-[12.5px] text-ink-soft">This plot&apos;s status is sample data. Confirm it with sales.</p>}
        <dl className="divide-y divide-line">
          {rows.map(([k, v, sub]) => (
            <div key={k} className="flex items-baseline justify-between gap-4 py-2.5">
              <dt className="text-sm text-ink-muted">{k}</dt>
              <dd className="text-right">
                <span className="num text-[18px] font-semibold text-navy-900">{v}</span>
                {sub && <span className="block text-xs text-ink-muted">{sub}</span>}
              </dd>
            </div>
          ))}
        </dl>

        {price && plot.status === 'available' && (
          <div className="mt-3 rounded-xl bg-navy-50 px-4 py-3">
            <p className="text-xs text-ink-muted">
              Indicative value at {inr(price.rate)} per {price.per}
            </p>
            <p className="num text-[26px] font-bold text-navy-700">
              {inrShort(price.total)} <span className="text-sm font-medium text-ink-muted">({inr(price.total)})</span>
            </p>
            <p className="mt-0.5 text-xs text-ink-muted">Corner and road-width premiums are not included. Confirm the current price with sales.</p>
          </div>
        )}

        {plot.status && plot.status !== 'available' && (
          <div className="mt-3">
            <p className="text-sm font-semibold text-navy-900">
              {NOT_AVAILABLE[plot.status]} {similar.length ? 'Closest available matches:' : ''}
            </p>
            {similar.length > 0 && (
              <ul className="mt-2 grid grid-cols-2 gap-2">
                {similar.map((q) => (
                  <li key={q.n}>
                    <button type="button" onClick={() => onSelect(q.n)} className="w-full rounded-xl border border-line bg-white px-3 py-2 text-left hover:border-navy-500">
                      <span className="num block text-xl font-bold text-navy-900">Plot {q.n}</span>
                      <span className="text-xs text-ink-muted">
                        {sqyd(q.a)} sq yd{q.f ? `, ${q.f}` : ''}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        <div className="mt-4 grid gap-2 pb-1">
          <a href={wa} target="_blank" rel="noreferrer" className="flex h-12 items-center justify-center gap-2 rounded-xl bg-navy-700 text-[15px] font-semibold text-white hover:bg-navy-800">
            <Icon name="whatsapp" size={19} /> Enquire on WhatsApp
          </a>
          <button type="button" onClick={share} className="flex h-11 items-center justify-center gap-2 rounded-xl border border-line bg-white text-sm font-semibold text-navy-700 hover:border-navy-300">
            <Icon name={copied ? 'check' : 'share'} size={17} /> {copied ? 'Link copied' : 'Share this plot'}
          </button>
          <p className="sr-only" aria-live="polite">
            {copied ? 'Link to this plot copied.' : ''}
          </p>
        </div>
      </div>
    </motion.aside>
  );
}
