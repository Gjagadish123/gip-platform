import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import Icon from './Icon.jsx';
import PlotPanel from './PlotPanel.jsx';
import ProjectCard from './ProjectCard.jsx';
import StatusCard from './StatusCard.jsx';
import { ProjectMark, changeText, useRecent } from './StatusParts.jsx';
import { loadGoogleMaps } from '../lib/googleMaps.js';
import { STATUS_LABEL, emptyFilters, filterCount, matches, sqyd } from '../lib/plots.js';
import { asset, writeUrl } from '../lib/projects.js';
import { mapBus } from '../lib/mapBus.js';

function toggleIn(set, v) {
  const next = new Set(set);
  next.has(v) ? next.delete(v) : next.add(v);
  return next;
}
const reducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// ---------------------------------------------------------------- small chrome pieces
/** `pressed` is for real toggles, `expanded` for buttons that open something; action buttons pass neither. */
const ToolButton = ({ icon, label, onClick, pressed, expanded, controls, highlight, disabled, className = '', innerRef }) => (
  <button
    ref={innerRef}
    type="button"
    onClick={onClick}
    disabled={disabled}
    aria-label={label}
    aria-pressed={pressed}
    aria-expanded={expanded}
    aria-controls={controls}
    title={label}
    className={`grid h-11 w-11 place-items-center rounded-xl shadow-panel transition-colors disabled:opacity-50 ${highlight ? 'bg-navy-700 text-white' : 'glass text-navy-900 hover:bg-white'} ${className}`}
  >
    <Icon name={icon} size={19} />
  </button>
);

function Chip({ on, onClick, children, innerRef }) {
  return (
    <button
      ref={innerRef}
      type="button"
      onClick={onClick}
      aria-pressed={on}
      className={`h-10 rounded-full border px-3.5 text-sm font-medium transition-colors ${on ? 'border-navy-700 bg-navy-700 text-white' : 'border-line bg-white text-ink-soft hover:border-navy-300'}`}
    >
      {children}
    </button>
  );
}

function ScaleBar({ zoom, lat }) {
  if (zoom == null || lat == null) return null;
  const mPerPx = (156543.03392 * Math.cos((lat * Math.PI) / 180)) / 2 ** zoom;
  const ftPerPx = mPerPx * 3.28084;
  const nice = [10, 20, 30, 50, 100, 200, 300, 500, 1000, 2000, 5000, 10000, 20000, 50000];
  const ft = nice.find((n) => n / ftPerPx >= 56) || nice[nice.length - 1];
  const w = ft / ftPerPx;
  const label = ft >= 5280 ? `${(ft / 5280).toFixed(ft % 5280 ? 1 : 0)} mi` : `${ft.toLocaleString('en-IN')} ft`;
  return (
    <div className="pointer-events-none select-none text-[11px] font-semibold text-white drop-shadow-[0_1px_2px_rgba(0,0,0,.7)]" aria-hidden="true">
      <div className="num mb-0.5">{label}</div>
      <div className="h-[7px] border-x-2 border-b-2 border-white" style={{ width: Math.min(w, 170) }} />
    </div>
  );
}

function Compass({ heading, onClick }) {
  return (
    <button type="button" onClick={onClick} aria-label="Reset view to north" title="Reset to north" className="glass grid h-11 w-11 place-items-center rounded-full shadow-panel">
      <svg width="30" height="30" viewBox="0 0 30 30" style={{ transform: `rotate(${-heading}deg)` }} aria-hidden="true">
        <path d="M15 3 19 15H11Z" fill="#c8372f" />
        <path d="M15 27 11 15h8Z" fill="#033967" />
        <text x="15" y="12.6" textAnchor="middle" fontSize="6.5" fontWeight="800" fill="#fff">
          N
        </text>
      </svg>
    </button>
  );
}

// ---------------------------------------------------------------- main
/**
 * site: {data, projector, hit, brand} for the renderers (null while the layout loads or when it has none).
 * model: the live per-project model (plots with statuses); stats: live counts (also without a layout).
 * plan: 'loading' | 'ready' | 'missing' | 'failed'.
 */
export default function MasterPlan({ project, items, site, model, stats, plan, onRetryPlan, live, onSwitch, initialPlot, outsideNotice }) {
  const wrapRef = useRef(null);
  const googleEl = useRef(null);
  const soloEl = useRef(null);
  const gRef = useRef(null); // GoogleRenderer
  const sRef = useRef(null); // StandaloneRenderer
  const mods = useRef(null); // three.js and both renderers load as a separate chunk, after first paint
  const filterBtn = useRef(null);
  const firstChip = useRef(null);
  const soloRef = useRef(false);
  const siteRef = useRef(site);
  siteRef.current = site;
  const pending = useRef(initialPlot); // {project, plot} from the URL, applied once its layout is up
  const [engine, setEngine] = useState(null); // null while booting | 'google-vector' | 'google-raster' | 'standalone' | 'none'
  const [soloOn, setSoloOn] = useState(false);
  const [mode, setMode] = useState('2d');
  const [selected, setSelected] = useState(null);
  const [hover, setHover] = useState(null);
  const [tip, setTip] = useState({ x: 0, y: 0 });
  const [filters, setFilters] = useState(emptyFilters);
  const [showFilters, setShowFilters] = useState(false);
  const [cam, setCam] = useState({ heading: 0, tilt: 0, zoom: 17.35 });
  const [tourLabel, setTourLabel] = useState(null);
  const [touring, setTouring] = useState(false);
  const [villas, setVillas] = useState(true);
  const [basemap, setBasemap] = useState('satellite');
  const [query, setQuery] = useState('');
  const [notice, setNotice] = useState(null);
  const [place, setPlace] = useState(null);
  const [full, setFull] = useState(false);
  const [announce, setAnnounce] = useState('');
  soloRef.current = soloOn;

  const ready = engine && engine !== 'none';
  const plots = model?.plots;
  const active = useCallback(() => (soloRef.current || !gRef.current ? sRef.current : gRef.current), []);
  const nFilters = filterCount(filters);
  const isActive = useMemo(() => (model && nFilters ? (p) => matches(model.plotByNumber.get(p.n), filters) : null), [model, filters, nFilters]);
  const matchCount = useMemo(() => (plots ? (nFilters ? plots.filter((p) => matches(p, filters)).length : plots.length) : 0), [plots, filters, nFilters]);

  // where a focused plot should land so the card (desktop, left) or the sheet (phones, bottom) does not cover it
  const focusOffset = useCallback(() => {
    const el = wrapRef.current;
    if (!el) return { x: 0, y: 0 };
    return el.clientWidth < 640 ? { x: 0, y: -Math.round(el.clientHeight * 0.27) } : { x: 180, y: 0 };
  }, []);

  const callbacks = useMemo(
    () => ({
      onPick: (n) => {
        setSelected(n);
        if (n == null) return;
        gRef.current?.clearPlace();
        setPlace(null);
        // on phones the bottom sheet would cover the plot that was just tapped, so slide it into the clear
        const el = wrapRef.current;
        if (el && el.clientWidth < 640) active()?.focusPlot(n, { x: 0, y: -Math.round(el.clientHeight * 0.27) });
      },
      onHover: (n) => setHover((h) => (h === n ? h : n)),
      onCamera: (c) => setCam((p) => (Object.keys(c).every((k) => p[k] === c[k]) ? p : { ...p, ...c })),
    }),
    [active]
  );

  const mountStandalone = useCallback(
    (startMode) => {
      if (sRef.current) return sRef.current;
      if (!mods.current) return null;
      try {
        sRef.current = new mods.current.StandaloneRenderer({ container: soloEl.current, project: siteRef.current, startMode, ...callbacks, onReady: () => {} });
      } catch {
        sRef.current = null; // no WebGL at all
      }
      return sRef.current;
    },
    [callbacks]
  );

  // ---- boot: Google first, self-contained model if Google is unavailable
  useEffect(() => {
    let dead = false;
    const giveUp = () => {
      if (dead) return;
      setEngine('none');
      setNotice('The interactive plan could not load. Check your connection and reload the page.');
    };
    const fallback = (why) => {
      if (dead) return;
      gRef.current?.dispose();
      gRef.current = null;
      if (!mountStandalone('2d')) return giveUp();
      setSoloOn(true);
      setEngine('standalone');
      setNotice(why);
    };
    const chunks = Promise.all([import('../map/GoogleRenderer.js'), import('../map/StandaloneRenderer.js')]).then(([g, st]) => {
      mods.current = { GoogleRenderer: g.GoogleRenderer, StandaloneRenderer: st.StandaloneRenderer };
    });
    // ?nomap=1 skips Google on purpose: handy for checking the self-contained model
    const wantGoogle = !new URLSearchParams(window.location.search).has('nomap');
    Promise.all([wantGoogle ? loadGoogleMaps() : null, chunks])
      .then(([gm]) => {
        if (dead) return;
        if (!wantGoogle) return fallback(null);
        if (!gm || window.__gmAuthFailed) return fallback('The live Google map could not load, so you are seeing the site model instead.');
        gRef.current = new mods.current.GoogleRenderer({
          container: googleEl.current,
          gm,
          center: siteRef.current?.data.origin,
          ...callbacks,
          onReady: (info) => !dead && setEngine(info.engine),
        });
        gRef.current.setProject(siteRef.current);
      })
      .catch(giveUp);
    // Google reports a rejected key after its script has loaded, possibly before our own chunks have
    const onAuth = () => chunks.then(() => fallback('The Google Maps key was rejected, so you are seeing the site model instead.')).catch(giveUp);
    window.addEventListener('gm-auth-failure', onAuth);
    return () => {
      dead = true;
      window.removeEventListener('gm-auth-failure', onAuth);
      gRef.current?.dispose();
      sRef.current?.dispose();
      gRef.current = sRef.current = null;
    };
  }, [callbacks, mountStandalone]);

  if (import.meta.env.DEV) window.__gc = { g: gRef, s: sRef }; // dev-only handle for debugging the renderers

  // ---- a new project: the renderers swap their site (dispose, rebuild, fly there, unfurl); per-plot UI resets
  useEffect(() => {
    gRef.current?.setProject(site);
    sRef.current?.setProject(site);
    setSelected(null);
    setHover(null);
    setFilters(emptyFilters());
    setPlace(null);
    setBasemap('satellite');
    setShowFilters(false);
    setTouring(false);
    setTourLabel(null);
    setQuery('');
  }, [site]);

  // ---- push state into whichever renderer(s) exist
  useEffect(() => {
    const st = model?.statusByPlot || null;
    gRef.current?.paint(st, isActive);
    sRef.current?.paint(st, isActive);
  }, [model, isActive, engine, soloOn, mode, site]);
  useEffect(() => {
    gRef.current?.setSelected(selected);
    sRef.current?.setSelected(selected);
  }, [selected, engine, soloOn, site]);
  useEffect(() => {
    gRef.current?.setHover(hover);
    sRef.current?.setHover(hover);
  }, [hover]);
  useEffect(() => {
    gRef.current?.setVillas(villas);
    sRef.current?.setVillas(villas);
  }, [villas, engine, soloOn]);
  useEffect(() => {
    gRef.current?.setBasemap(basemap);
  }, [basemap, engine]);

  // ---- live changes to this project: a pulse on the plots, and a sentence for screen readers
  const recent = useRecent(live.lastChange, project.id);
  useEffect(() => {
    if (!recent) {
      setAnnounce(''); // no stale sentence left behind (and the same sentence can be announced again later)
      return;
    }
    gRef.current?.pulse(recent.numbers);
    sRef.current?.pulse(recent.numbers);
    setAnnounce(changeText(recent));
  }, [recent]);

  // ---- notices from outside (a project unpublished while open)
  useEffect(() => {
    if (outsideNotice) setNotice(outsideNotice.text);
  }, [outsideNotice]);

  // ---- deep link ?plot=142, once the fly-in has had time to finish. One for a project that is not on screen any more
  // (switched away, or not published, so the app opened another) can never apply: drop it and its URL param.
  useEffect(() => {
    if (pending.current?.project && pending.current.project !== project.id) {
      pending.current = null;
      writeUrl({ plot: null });
    }
  }, [project.id]);
  useEffect(() => {
    const want = pending.current;
    if (!ready || !site || !want || (want.project && want.project !== project.id)) return;
    const t = setTimeout(() => {
      pending.current = null;
      const n = String(want.plot);
      if (site.data.plots.some((p) => p.n === n)) {
        setSelected(n);
        active()?.focusPlot(n, focusOffset());
      } else {
        writeUrl({ plot: null });
        setNotice(`There is no plot ${n} in this layout.`);
      }
    }, reducedMotion() ? 300 : 3800);
    return () => clearTimeout(t);
  }, [ready, site, project.id, active, focusOffset]);
  // the open plot is part of the shareable URL
  useEffect(() => {
    if (!pending.current) writeUrl({ plot: selected });
  }, [selected]);

  const stopTour = useCallback(() => {
    gRef.current?.cancelTour();
    sRef.current?.cancelTour();
    setTouring(false);
    setTourLabel(null);
  }, []);

  const leavePlace = useCallback(() => {
    gRef.current?.clearPlace();
    setPlace(null);
  }, []);

  const changeMode = useCallback(
    (next) => {
      if (!ready || next === mode) return;
      stopTour();
      leavePlace();
      const g = gRef.current;
      if (g && g.supports3D === false) {
        // raster Google: hand the 3D view to the standalone model and back
        if (next === '3d') {
          const s = mountStandalone('3d');
          if (!s) return setNotice('This device cannot draw the 3D view.');
          s.setMode('3d');
          setSoloOn(true);
        } else {
          setSoloOn(false);
          sRef.current?.dispose();
          sRef.current = null;
          g._emitCamera(); // the compass and scale bar go back to the Google camera
        }
        setMode(next);
        return;
      }
      setMode(next);
      (g || sRef.current)?.setMode(next);
    },
    [ready, mode, mountStandalone, stopTour, leavePlace]
  );

  const startTour = useCallback(() => {
    if (!ready || !site) return;
    if (touring) return stopTour();
    setSelected(null);
    leavePlace();
    const g = gRef.current;
    let r = g;
    if (!g || g.supports3D === false) {
      r = mountStandalone('3d');
      if (!r) return setNotice('This device cannot draw the 3D tour.');
      setSoloOn(true);
    }
    setMode('3d');
    setTouring(true);
    r.tour((label) => {
      setTourLabel(label);
      if (label == null) setTouring(false);
    });
  }, [ready, site, touring, stopTour, leavePlace, mountStandalone]);

  const selectPlot = useCallback(
    (n) => {
      setSelected(n);
      if (n == null) return;
      leavePlace();
      active()?.focusPlot(n, focusOffset()); // any non-tour flight ends a running tour inside the renderer
    },
    [active, focusOffset, leavePlace]
  );

  const submitSearch = (e) => {
    e.preventDefault();
    const n = query.trim().replace(/^0+(?=\d)/, '');
    if (!model) return;
    if (model.plotByNumber.has(n)) {
      selectPlot(n);
      setNotice(null);
    } else setNotice(`There is no plot ${n || ''} in this layout. Plots run from ${model.firstPlot} to ${model.lastPlot}.`);
  };

  // notices clear themselves; a fallback explanation stays a little longer than a search miss
  useEffect(() => {
    if (!notice || engine === 'none') return;
    const t = setTimeout(() => setNotice(null), notice.length > 70 ? 9000 : 5000);
    return () => clearTimeout(t);
  }, [notice, engine]);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') {
        setSelected(null);
        setShowFilters(false);
        stopTour();
      }
      if (e.key === '/' && !/input|textarea|select/i.test(document.activeElement?.tagName)) {
        e.preventDefault();
        document.getElementById('plot-search')?.focus();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [stopTour]);

  // filter sheet: focus goes in when it opens and back to its button when it closes
  const wasOpen = useRef(false);
  useEffect(() => {
    if (showFilters) firstChip.current?.focus({ preventScroll: true });
    else if (wasOpen.current) filterBtn.current?.focus({ preventScroll: true });
    wasOpen.current = showFilters;
  }, [showFilters]);

  // ---- sections below the map can steer it
  useEffect(() => {
    const toTop = () => wrapRef.current?.scrollIntoView({ behavior: reducedMotion() ? 'auto' : 'smooth', block: 'start' });
    const onPlace = (e) => {
      stopTour();
      setSelected(null);
      toTop();
      if (gRef.current && !soloRef.current) {
        gRef.current.showPlace(e.detail);
        setPlace(e.detail);
        setMode('2d');
        setBasemap('hybrid');
      } else setNotice(`${e.detail.name} is ${e.detail.driveKm} km from the site by road. The live Google map is needed to show it.`);
    };
    const onFocus = (e) => {
      stopTour();
      setSelected(null);
      leavePlace();
      toTop();
      active()?.focusXY(e.detail.xy);
    };
    const onFilter = (e) => {
      stopTour();
      setSelected(null);
      leavePlace();
      const f = emptyFilters();
      Object.entries(e.detail).forEach(([k, v]) => (f[k] = k === 'corner' ? Boolean(v) : new Set(v)));
      setFilters(f);
      toTop();
    };
    mapBus.addEventListener('place', onPlace);
    mapBus.addEventListener('focus', onFocus);
    mapBus.addEventListener('filter', onFilter);
    return () => {
      mapBus.removeEventListener('place', onPlace);
      mapBus.removeEventListener('focus', onFocus);
      mapBus.removeEventListener('filter', onFilter);
    };
  }, [active, stopTour, leavePlace]);

  useEffect(() => {
    const onFs = () => setFull(Boolean(document.fullscreenElement));
    document.addEventListener('fullscreenchange', onFs);
    return () => document.removeEventListener('fullscreenchange', onFs);
  }, []);
  const toggleFull = () => (document.fullscreenElement ? document.exitFullscreen() : wrapRef.current?.requestFullscreen?.());

  const switchTo = (id) => {
    pending.current = null;
    writeUrl({ plot: null }); // nothing may be selected yet, so the [selected] effect would not clear it
    stopTour();
    onSwitch(id);
  };

  const selPlot = selected != null ? model?.plotByNumber.get(selected) : null;
  const hovPlot = hover != null && hover !== selected ? model?.plotByNumber.get(hover) : null;
  const canBasemap = ready && engine !== 'standalone' && !soloOn;
  const plotCount = stats?.total || site?.data.plots.length;

  return (
    <section
      ref={wrapRef}
      id="plan"
      tabIndex={-1}
      aria-label={`${project.name} interactive layout`}
      className="relative h-[100svh] min-h-[600px] w-full overflow-hidden bg-navy-900 focus:outline-none"
      onMouseMove={(e) => {
        const r = e.currentTarget.getBoundingClientRect();
        setTip({ x: e.clientX - r.left, y: e.clientY - r.top });
      }}
    >
      {/* both layers stay laid out (visibility, not display) so a renderer built while hidden still measures its real size */}
      <div ref={googleEl} className="absolute inset-0" style={{ visibility: soloOn ? 'hidden' : 'visible' }} />
      <div ref={soloEl} className="absolute inset-0" style={{ visibility: soloOn ? 'visible' : 'hidden' }} />

      <AnimatePresence>
        {!engine && (
          <motion.div exit={{ opacity: 0 }} transition={{ duration: 0.4 }} className="absolute inset-0 z-40 grid place-items-center bg-navy-900 text-white" role="status">
            <div className="text-center">
              <div className="mx-auto flex justify-center">
                <ProjectMark id={project.id} name={project.name} size={112} light />
              </div>
              <p className="display mt-6 text-[28px] !text-white">{project.name}</p>
              <p className="mt-2 text-sm text-navy-300">{plotCount ? `Laying out ${plotCount} plots on the map` : 'Loading the live layout'}</p>
              <span className="mx-auto mt-5 block h-1 w-40 overflow-hidden rounded-full bg-white/10" aria-hidden="true">
                <span className="block h-1 w-1/3 animate-[loadbar_1.2s_ease-in-out_infinite] rounded-full bg-survey" />
              </span>
              {/* the lockup without the URL band, at a size where its wordmark actually reads */}
              <img src={asset('brand/gip-lockup-white.svg')} alt="Greater Infra Projects" className="mx-auto mt-10 h-14 w-auto opacity-90" />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* top gradient keeps the chrome readable over bright satellite imagery */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-navy-950/60 to-transparent" />

      {/* ---- title block + project switcher */}
      <div className="pointer-events-none absolute left-3 top-3 z-30 sm:left-5 sm:top-5">
        <ProjectCard project={project} plotCount={plotCount} items={items} onSwitch={switchTo} />
      </div>

      {/* ---- loading / missing layout */}
      {plan === 'loading' && engine && (
        <div role="status" className="glass absolute left-3 top-[84px] z-20 flex h-10 items-center gap-2.5 rounded-full px-4 text-sm font-semibold text-navy-900 shadow-panel sm:left-1/2 sm:top-5 sm:-translate-x-1/2">
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-navy-100 border-t-navy-700" aria-hidden="true" />
          Loading the {project.name} layout
        </div>
      )}
      {(plan === 'missing' || plan === 'failed') && (
        <div className="absolute inset-x-3 top-1/2 z-20 mx-auto max-w-[400px] -translate-y-1/2 sm:inset-x-0" role="alert">
          <div className="glass rounded-2xl p-5 shadow-lift">
            <h2 className="text-lg font-bold">{plan === 'missing' ? `${project.name} is not on the map yet` : `The ${project.name} layout didn't load`}</h2>
            <p className="mt-1.5 text-[15px] text-ink-soft">
              {plan === 'missing' ? 'Its approved layout is still being digitised. Live availability and project details are shown below.' : 'Check your connection and try again.'}
            </p>
            {plan === 'failed' && (
              <button type="button" onClick={onRetryPlan} className="mt-3 flex h-11 items-center gap-2 rounded-xl bg-navy-700 px-4 text-sm font-semibold text-white hover:bg-navy-800">
                <Icon name="refresh" size={17} /> Try again
              </button>
            )}
          </div>
        </div>
      )}

      {/* ---- search + tools */}
      <div className="absolute right-3 top-[84px] z-10 flex flex-col items-end gap-2 sm:right-5 sm:top-5">
        <form onSubmit={submitSearch} role="search" className="glass flex h-11 items-center gap-2 rounded-xl pl-3 pr-1.5 shadow-panel">
          <Icon name="search" size={17} className="text-ink-muted" />
          <label htmlFor="plot-search" className="sr-only">
            Find a plot by number
          </label>
          <input
            id="plot-search"
            inputMode="numeric"
            autoComplete="off"
            value={query}
            onChange={(e) => setQuery(e.target.value.replace(/\D/g, '').slice(0, 4))}
            placeholder="Plot no."
            className="num w-[74px] bg-transparent text-[17px] font-semibold text-navy-900 placeholder:font-normal placeholder:text-ink-muted focus:outline-none sm:w-24"
          />
          <button type="submit" disabled={!ready || !model} className="h-8 rounded-lg bg-navy-700 px-3 text-sm font-semibold text-white hover:bg-navy-800 disabled:opacity-50">
            Find
          </button>
        </form>
        <div className="flex flex-col gap-2">
          <ToolButton
            innerRef={filterBtn}
            icon="filter"
            label={nFilters ? `Filter plots, ${nFilters} active` : 'Filter plots'}
            expanded={showFilters}
            controls="filter-sheet"
            highlight={showFilters || nFilters > 0}
            disabled={!model}
            onClick={() => setShowFilters((v) => !v)}
          />
          <ToolButton icon="plus" label="Zoom in" onClick={() => active()?.zoomBy(1)} />
          <ToolButton icon="minus" label="Zoom out" onClick={() => active()?.zoomBy(-1)} />
          {canBasemap && (
            <ToolButton
              icon="layers"
              label={{ satellite: 'Show place names', hybrid: 'Switch to street map', roadmap: 'Switch to satellite' }[basemap]}
              highlight={basemap !== 'satellite'}
              onClick={() => setBasemap((b) => ({ satellite: 'hybrid', hybrid: 'roadmap', roadmap: 'satellite' })[b])}
            />
          )}
          {mode === '3d' && <ToolButton icon="villa" label="Sample villas on sold and registered plots" pressed={villas} highlight={villas} onClick={() => setVillas((v) => !v)} />}
          <ToolButton icon={full ? 'collapse' : 'expand'} label={full ? 'Exit full screen' : 'Full screen'} onClick={toggleFull} className="hidden sm:grid" />
        </div>
      </div>

      {/* ---- filter sheet */}
      <AnimatePresence>
        {showFilters && model && (
          <motion.div
            id="filter-sheet"
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.18 }}
            className="glass absolute right-[68px] top-[140px] z-20 w-[min(340px,calc(100vw-92px))] rounded-2xl p-4 shadow-lift sm:right-[84px] sm:top-[76px]"
            role="dialog"
            aria-label="Filter plots"
          >
            <div className="flex items-baseline justify-between">
              <h2 className="text-base font-bold">Filter plots</h2>
              <p className="num text-sm text-ink-soft" aria-live="polite">
                {matchCount} of {plots.length} match
              </p>
            </div>
            {model.facings.length > 0 && (
              <fieldset className="mt-3">
                <legend className="mb-1.5 text-[13px] font-medium text-ink-soft">Facing</legend>
                <div className="flex flex-wrap gap-1.5">
                  {model.facings.map((f, i) => (
                    <Chip key={f} innerRef={i === 0 ? firstChip : undefined} on={filters.facing.has(f)} onClick={() => setFilters((s) => ({ ...s, facing: toggleIn(s.facing, f) }))}>
                      {f}
                    </Chip>
                  ))}
                </div>
              </fieldset>
            )}
            <fieldset className="mt-3">
              <legend className="mb-1.5 text-[13px] font-medium text-ink-soft">Plot size, sq yd</legend>
              <div className="flex flex-wrap gap-1.5">
                {model.bands.map((b, i) => (
                  <Chip key={b.id} innerRef={i === 0 && !model.facings.length ? firstChip : undefined} on={filters.band.has(b.id)} onClick={() => setFilters((s) => ({ ...s, band: toggleIn(s.band, b.id) }))}>
                    <span className="num">{b.label}</span>
                  </Chip>
                ))}
              </div>
            </fieldset>
            <fieldset className="mt-3">
              <legend className="mb-1.5 text-[13px] font-medium text-ink-soft">Road frontage</legend>
              <div className="flex flex-wrap gap-1.5">
                {model.roads.map((r) => (
                  <Chip key={r} on={filters.road.has(r)} onClick={() => setFilters((s) => ({ ...s, road: toggleIn(s.road, r) }))}>
                    <span className="num">{r}&apos; road</span>
                  </Chip>
                ))}
                {plots.some((p) => p.corner) && (
                  <Chip on={filters.corner} onClick={() => setFilters((s) => ({ ...s, corner: !s.corner }))}>
                    Corner plots
                  </Chip>
                )}
              </div>
            </fieldset>
            <div className="mt-4 flex gap-2">
              <button type="button" onClick={() => setFilters(emptyFilters())} className="h-11 flex-1 rounded-xl border border-line bg-white text-sm font-semibold text-navy-700 hover:border-navy-300">
                Clear filters
              </button>
              <button type="button" onClick={() => setShowFilters(false)} className="h-11 flex-1 rounded-xl bg-navy-700 text-sm font-semibold text-white hover:bg-navy-800">
                Show {matchCount} plots
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ---- availability: live counts that double as the status filter. An open plot card takes its corner: on wide
           screens the counts move to the right (compact) and stay in view; on phones and tablets they make way for the
           card. One element throughout, moved by its classes, so a focused status toggle keeps focus when the plot closes. */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.18 }}
        className={`absolute z-10 ${selPlot ? 'hidden lg:bottom-[84px] lg:right-5 lg:block' : 'bottom-[120px] left-3 right-3 sm:bottom-[72px] sm:left-5 sm:right-auto lg:bottom-6'}`}
      >
        <StatusCard
          counts={stats?.counts}
          total={stats?.total}
          asOf={stats?.asOf}
          sample={stats?.sample}
          live={live}
          recent={recent}
          selected={filters.status}
          onToggle={(s) => setFilters((f) => ({ ...f, status: toggleIn(f.status, s) }))}
          compact={Boolean(selPlot)}
        />
      </motion.div>

      {/* ---- mode switch, tour, compass, scale */}
      <div className="absolute bottom-[68px] right-3 z-10 flex items-end gap-2 sm:right-5 sm:gap-3 lg:bottom-6">
        <div className="hidden pb-1 sm:block">
          <ScaleBar zoom={soloOn || !site ? null : cam.zoom} lat={site?.data.origin.lat} />
        </div>
        <Compass heading={cam.heading || 0} onClick={() => active()?.resetNorth()} />
        <button
          type="button"
          onClick={startTour}
          disabled={!ready || !site}
          className={`flex h-11 items-center gap-2 rounded-full px-4 text-sm font-semibold shadow-panel disabled:opacity-60 ${touring ? 'bg-survey text-navy-900' : 'glass text-navy-900 hover:bg-white'}`}
        >
          <Icon name={touring ? 'stop' : 'play'} size={16} />
          {touring ? 'Stop tour' : 'Take the tour'}
        </button>
        <div className="glass flex rounded-full p-1 shadow-panel" role="group" aria-label="View">
          {['2d', '3d'].map((m) => (
            <button
              key={m}
              type="button"
              aria-pressed={mode === m}
              disabled={!ready}
              onClick={() => changeMode(m)}
              className={`num h-9 min-w-[52px] rounded-full px-4 text-[15px] font-bold uppercase transition-colors disabled:opacity-60 ${mode === m ? 'bg-navy-700 text-white' : 'text-navy-900 hover:bg-navy-100'}`}
            >
              {m}
            </button>
          ))}
        </div>
      </div>

      {/* ---- tour caption / landmark chip share the same spot */}
      <AnimatePresence>
        {tourLabel && (
          <motion.p
            key={tourLabel}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="glass-dark pointer-events-none absolute bottom-[244px] left-1/2 z-10 max-w-[92vw] -translate-x-1/2 whitespace-nowrap rounded-full px-5 py-2 text-center text-sm font-medium text-white shadow-lift sm:bottom-[128px] lg:bottom-[84px]"
            aria-live="polite"
          >
            {tourLabel}
          </motion.p>
        )}
      </AnimatePresence>
      {place && !tourLabel && (
        <div className="glass-dark absolute bottom-[244px] left-1/2 z-10 flex max-w-[92vw] -translate-x-1/2 items-center gap-3 rounded-full py-1.5 pl-5 pr-1.5 text-sm text-white shadow-lift sm:bottom-[128px] lg:bottom-[84px]" role="status">
          <span className="truncate">
            <span className="font-semibold">{place.name}</span>
            <span className="num ml-2 text-navy-100">
              {place.driveKm} km, about {place.driveMin} min by road
            </span>
          </span>
          <button
            type="button"
            onClick={() => {
              setPlace(null);
              setBasemap('satellite');
              gRef.current?.home();
            }}
            className="h-9 shrink-0 rounded-full bg-white px-4 text-sm font-semibold text-navy-900 hover:bg-survey"
          >
            Back to the layout
          </button>
        </div>
      )}

      {/* ---- notice (search miss, map fallback): sits in the filter-sheet slot, clear of the plot card */}
      {notice && (
        <div role="status" className="glass absolute left-3 right-[68px] top-[140px] z-20 flex items-start gap-2 rounded-xl py-2 pl-4 pr-1.5 text-sm shadow-lift sm:left-auto sm:right-[84px] sm:top-[76px] sm:w-[340px]">
          <span className="flex-1 py-1.5 text-ink-soft">{notice}</span>
          <button type="button" onClick={() => setNotice(null)} aria-label="Dismiss message" className="grid h-10 w-10 shrink-0 place-items-center rounded-lg text-ink-soft hover:bg-navy-100 hover:text-navy-900">
            <Icon name="close" size={16} />
          </button>
        </div>
      )}
      <p className="sr-only" aria-live="polite">
        {announce}
      </p>

      {/* ---- hover tooltip (mouse only) */}
      {hovPlot && (
        <div
          className="glass-dark pointer-events-none absolute z-20 hidden rounded-lg px-3 py-1.5 text-white shadow-lift md:block"
          style={{ left: Math.min(tip.x + 16, (wrapRef.current?.clientWidth || 9999) - 210), top: Math.max(tip.y - 46, 8) }}
        >
          <span className="num text-[17px] font-bold">Plot {hovPlot.n}</span>
          <span className="num ml-2 text-sm text-navy-100">
            {sqyd(hovPlot.a)} sq yd{hovPlot.status ? `, ${STATUS_LABEL[hovPlot.status].toLowerCase()}` : ''}
          </span>
        </div>
      )}

      {/* ---- plot card: side card on desktop, bottom sheet on phones */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-30 flex justify-center sm:inset-x-auto sm:bottom-auto sm:left-5 sm:top-[156px] sm:block">
        <AnimatePresence mode="wait">
          {selPlot && <PlotPanel key={`${project.id}:${selPlot.n}`} plot={selPlot} plots={plots} project={project} onClose={() => setSelected(null)} onSelect={selectPlot} />}
        </AnimatePresence>
      </div>

      {/* ---- way out of the map: a real, labelled control on every screen size */}
      <a href="#overview" className="glass absolute bottom-6 left-1/2 z-10 hidden h-11 -translate-x-1/2 items-center gap-2 rounded-full px-5 text-sm font-semibold text-navy-900 shadow-panel hover:bg-white lg:flex">
        Project details <Icon name="arrowDown" size={16} />
      </a>
      <a href="#overview" className="absolute inset-x-0 bottom-0 z-10 flex h-12 items-center justify-center gap-2 bg-white text-sm font-semibold text-navy-900 lg:hidden">
        Project details <Icon name="arrowDown" size={16} />
      </a>
    </section>
  );
}
