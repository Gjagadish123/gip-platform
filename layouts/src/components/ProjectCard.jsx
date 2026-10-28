import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import Icon from './Icon.jsx';
import { ProjectMark, StatusBar } from './StatusParts.jsx';
import { COMPANY } from '../data/project.js';
import { keyApprovals } from '../lib/projects.js';

/**
 * Top-left title block, which is also the project switcher. Two tiers divided by tone: identity on the light surface
 * (opens the list of projects), approvals and the developer credit on a navy band.
 * items: [{id, name, location, available, total}] (available/total null while unknown).
 */
const cap = (s) => (s ? s[0].toUpperCase() + s.slice(1) : '');

export default function ProjectCard({ project, plotCount, items, onSwitch }) {
  const [open, setOpen] = useState(false);
  const wrap = useRef(null);
  const trigger = useRef(null);
  const list = useRef(null);
  const { permit, rera } = keyApprovals(project.content);
  const location = project.content?.location?.short;

  const close = (refocus = true) => {
    setOpen(false);
    if (refocus) requestAnimationFrame(() => trigger.current?.focus({ preventScroll: true }));
  };
  const pick = (id) => {
    close();
    if (id !== project.id) onSwitch(id);
  };

  // focus the open project when the list opens; close on a click outside
  useEffect(() => {
    if (!open) return;
    list.current?.querySelector('[aria-current="true"]')?.focus({ preventScroll: true });
    const away = (e) => !wrap.current?.contains(e.target) && setOpen(false);
    document.addEventListener('pointerdown', away);
    return () => document.removeEventListener('pointerdown', away);
  }, [open]);

  const onListKey = (e) => {
    const btns = [...list.current.querySelectorAll('button')];
    const i = btns.indexOf(document.activeElement);
    const go = (j) => {
      e.preventDefault();
      btns[(j + btns.length) % btns.length]?.focus();
    };
    if (e.key === 'ArrowDown') go(i + 1);
    else if (e.key === 'ArrowUp') go(i - 1);
    else if (e.key === 'Home') go(0);
    else if (e.key === 'End') go(btns.length - 1);
    else if (e.key === 'Escape') {
      e.stopPropagation();
      close();
    } else if (e.key === 'Tab') close(false);
  };

  const authorities = [permit?.authority, rera && 'RERA'].filter(Boolean).join(' & ');

  return (
    <div ref={wrap} className="pointer-events-auto relative">
      <h1 className="sr-only">{project.name} live layout</h1>
      <div className="w-[248px] rounded-xl shadow-lift ring-1 ring-navy-950/10 sm:w-[420px] sm:rounded-2xl">
        <button
          ref={trigger}
          type="button"
          aria-expanded={open}
          aria-controls="project-list"
          onClick={() => setOpen((v) => !v)}
          className="glass group flex w-full items-center gap-2 rounded-t-xl px-2.5 py-1.5 text-left hover:bg-white sm:gap-3.5 sm:rounded-t-2xl sm:px-4 sm:py-3"
        >
          <span className="sm:hidden">
            <ProjectMark id={project.id} name={project.name} size={26} />
          </span>
          <span className="hidden sm:block">
            <ProjectMark id={project.id} name={project.name} size={40} />
          </span>
          <span className="min-w-0 flex-1">
            <span className="sr-only">Project: </span>
            <span className={`display block truncate text-[15.5px] text-navy-900 sm:whitespace-normal ${project.name.length > 18 ? 'sm:text-[22px]' : 'sm:text-[26px]'}`}>{project.name}</span>
            {(plotCount || location) && (
              <span className="num mt-1 hidden truncate text-[11.5px] uppercase leading-none tracking-[0.07em] text-ink-soft sm:block">
                {[plotCount && `${plotCount} plots`, location].filter(Boolean).join(' · ')}
              </span>
            )}
          </span>
          <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full border border-line bg-white text-navy-700 group-hover:border-navy-300 sm:h-9 sm:w-9" title={`${items.length} live layouts`}>
            <Icon name="chevron" size={17} className={`transition-transform ${open ? 'rotate-180' : ''}`} />
            <span className="sr-only">, switch project</span>
          </span>
        </button>

        <div className="flex items-center justify-between gap-2 rounded-b-xl bg-navy-900 px-2.5 py-[3px] sm:gap-4 sm:rounded-b-2xl sm:px-4 sm:py-2.5">
          <p className="num whitespace-nowrap text-[9px] font-semibold uppercase tracking-[0.08em] text-navy-300 sm:hidden">{authorities ? `${authorities} approved` : 'Approved layout'}</p>
          <dl className="hidden min-w-0 sm:block">
            {[permit && [permit.authority, permit.reference || cap(permit.status)], rera && ['RERA', rera.reference || cap(rera.status)]]
              .filter((x) => x && x[1])
              .map(([label, value]) => (
                <div key={label} className="flex items-baseline gap-2 leading-[1.25]">
                  <dt className="w-[34px] shrink-0 text-[10px] font-semibold uppercase tracking-[0.09em] text-navy-300">{label}</dt>
                  <dd className="num whitespace-nowrap text-[13px] text-white">{value}</dd>
                </div>
              ))}
          </dl>
          <a href={COMPANY.website} target="_blank" rel="noreferrer" className="flex shrink-0 items-center gap-2 rounded text-right">
            <img src={`${import.meta.env.BASE_URL}brand/gip-mark-white.svg`} alt="" className="hidden h-[18px] w-auto shrink-0 sm:block" />
            <span className="leading-tight">
              <span className="hidden text-[9.5px] uppercase leading-none tracking-[0.09em] text-navy-300 sm:block">A project by</span>
              <span className="block whitespace-nowrap text-[9px] font-semibold text-white/90 underline-offset-2 hover:underline sm:mt-0.5 sm:text-[12px]">
                {COMPANY.name}
                <span className="sr-only"> (opens their website in a new tab)</span>
              </span>
            </span>
          </a>
        </div>
      </div>

      <AnimatePresence>
        {open && (
          <motion.div
            id="project-list"
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.16 }}
            className="glass absolute left-0 top-full z-30 mt-2 w-[calc(100vw-24px)] overflow-hidden rounded-2xl shadow-lift sm:w-[420px]"
          >
            <p className="px-4 pb-1 pt-3 text-[12px] font-bold uppercase tracking-[0.08em] text-ink-soft">Live layouts</p>
            <ul ref={list} onKeyDown={onListKey} aria-label="Projects" className="max-h-[60svh] overflow-y-auto p-1.5">
              {items.map((it) => {
                const current = it.id === project.id;
                return (
                  <li key={it.id}>
                    <button
                      type="button"
                      aria-current={current ? 'true' : undefined}
                      onClick={() => pick(it.id)}
                      className={`flex w-full items-center gap-3 rounded-xl px-2.5 py-2.5 text-left transition-colors ${current ? 'bg-navy-100' : 'hover:bg-navy-50'}`}
                    >
                      <ProjectMark id={it.id} name={it.name} size={36} />
                      <span className="min-w-0 flex-1">
                        <span className="flex items-baseline justify-between gap-2">
                          <span className="truncate text-[15px] font-bold text-navy-900">{it.name}</span>
                          {current && <Icon name="check" size={16} className="shrink-0 text-navy-600" title="Open now" />}
                        </span>
                        {it.location && <span className="block truncate text-[12px] text-ink-muted">{it.location}</span>}
                        <span className="num mt-1 block text-[12.5px] font-semibold text-ink-soft">
                          {it.total ? `${it.available} of ${it.total} available` : it.counts ? 'No plots listed yet' : it.unknown ? 'Availability not loaded' : 'Loading availability…'}
                        </span>
                        <StatusBar counts={it.counts} total={it.total} className="mt-1 h-1.5" />
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
