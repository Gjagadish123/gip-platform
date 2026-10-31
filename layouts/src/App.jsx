import { useEffect, useMemo, useRef, useState } from 'react';
import { MotionConfig } from 'framer-motion';
import MasterPlan from './components/MasterPlan.jsx';
import { SectionNav, Footer } from './sections/SiteChrome.jsx';
import Overview from './sections/Overview.jsx';
import Insights from './sections/Insights.jsx';
import Amenities, { hasAmenities } from './sections/Amenities.jsx';
import Location, { hasLocation } from './sections/Location.jsx';
import Contact from './sections/Contact.jsx';
import { BACKEND, useLive } from './lib/live.js';
import { FALLBACK_LIST, LOGOS, MissingLayout, PROJECT_IDS, asset, isProjectId, loadLandmarks, loadMasterplan, neighboursOf, pinOf, readUrl, writeUrl } from './lib/projects.js';
import { buildGeo, buildModel, statsOf } from './lib/plots.js';
import Icon from './components/Icon.jsx';
import { COMPANY } from './data/project.js';

export default function App() {
  const [initial] = useState(readUrl);
  const [active, setActive] = useState(() => (isProjectId(initial.project) ? initial.project : null));
  const [notice, setNotice] = useState(null);
  const live = useLive(active ?? PROJECT_IDS[0]);

  // Published projects in sort_order; when Supabase can't be read, every layout (without statuses).
  const list = live.projects ?? (live.loadFailed ? FALLBACK_LIST : null);
  const none = list?.length === 0; // Supabase answered: nothing is published (the page recovers when something is)
  const activeId = list ? (list.find((p) => p.id === active)?.id ?? list[0]?.id ?? null) : (active ?? PROJECT_IDS[0]);
  const project = list?.find((p) => p.id === activeId) ?? FALLBACK_LIST.find((p) => p.id === activeId) ?? FALLBACK_LIST[0];

  // A project that stops being listed while open (unpublished): move to the first one and say so.
  const listed = useRef(null);
  useEffect(() => {
    if (!list) return;
    if (active && !list.some((p) => p.id === active) && list[0]) {
      const was = listed.current?.find((p) => p.id === active);
      if (was) setNotice({ text: `${was.name} is no longer listed, so you are seeing ${list[0].name}.`, at: Date.now() });
      setActive(list[0].id);
    } else if (!active && list[0]) setActive(list[0].id);
    listed.current = list;
  }, [list, active]);

  useEffect(() => {
    if (activeId) writeUrl({ project: activeId });
    document.title = none ? 'Live layouts | Greater Infra Projects' : `${project.name} live layout | Greater Infra Projects`;
  }, [activeId, project.name, none]);

  // ---- the approved layout (lazy chunk per project)
  const [plan, setPlan] = useState({ id: null, state: 'loading', geo: null });
  const [planTry, setPlanTry] = useState(0);
  useEffect(() => {
    if (!activeId) return;
    let dead = false;
    setPlan({ id: activeId, state: 'loading', geo: null });
    loadMasterplan(activeId)
      .then((mp) => buildGeo(mp))
      .then(
        (geo) => !dead && setPlan({ id: activeId, state: 'ready', geo }),
        (e) => !dead && setPlan({ id: activeId, state: e instanceof MissingLayout ? 'missing' : 'failed', geo: null })
      );
    return () => {
      dead = true;
    };
  }, [activeId, planTry]);
  const geo = plan.id === activeId ? plan.geo : null;
  const planState = plan.id === activeId ? plan.state : 'loading';

  // ---- nearby landmarks, where they have been measured for this project
  const [landmarks, setLandmarks] = useState({ id: null, data: null });
  useEffect(() => {
    let dead = false;
    if (activeId) loadLandmarks(activeId).then((data) => !dead && setLandmarks({ id: activeId, data }));
    return () => {
      dead = true;
    };
  }, [activeId]);

  // what the renderers get: geometry plus the arch's branding; one object per layout
  const site = useMemo(
    () => geo && { data: geo.data, projector: geo.projector, hit: geo.hit, brand: { name: geo.data.project || project.name, logo: asset(LOGOS[plan.id]?.mark || 'brand/gip-mark-white.svg') } },
    [geo] // eslint-disable-line react-hooks/exhaustive-deps
  );
  const rows = live.units[activeId];
  const model = useMemo(() => geo && buildModel(geo, rows, project), [geo, rows, project]);
  const stats = useMemo(() => statsOf(rows, project), [rows, project]);
  const items = (list || FALLBACK_LIST).map((p) => {
    const st = statsOf(live.units[p.id], p);
    return { id: p.id, name: p.name, location: p.content?.location?.short, counts: st?.counts, total: st?.total, available: st?.counts.available, unknown: live.loadFailed };
  });
  const pin = pinOf(project.content, geo?.data);
  // listed layouts next door (Global City V beside VI), highlighted on the map with a way in
  const near = useMemo(() => neighboursOf(activeId), [activeId]);
  const neighbours = near.flatMap((n) => {
    const it = items.find((i) => i.id === n.id);
    return it ? [{ ...n, name: it.name, sub: it.total ? `${it.available} of ${it.total} available` : '' }] : [];
  });

  const switchTo = (id) => {
    setNotice(null);
    setActive(id);
  };

  const content = project.content || {};
  const sections = [
    ['overview', 'Overview'],
    model && ['insights', 'Insights'],
    hasAmenities(content) && ['amenities', 'Amenities'],
    hasLocation(content, landmarks.id === activeId && landmarks.data) && ['location', 'Location'],
    ['contact', 'Contact'],
  ].filter(Boolean);

  if (none) return <NoLayouts />;
  return (
    <MotionConfig reducedMotion="user">
      <a href="#overview" className="sr-only focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:z-50 focus:rounded-lg focus:bg-white focus:px-4 focus:py-2 focus:text-navy-900">
        Skip to project details
      </a>
      <MasterPlan
        project={project}
        items={items}
        site={site}
        model={model}
        stats={stats}
        plan={planState}
        onRetryPlan={() => setPlanTry((n) => n + 1)}
        live={{ ...live, backend: BACKEND }}
        onSwitch={switchTo}
        neighbours={neighbours}
        initialPlot={initial.plot ? { project: isProjectId(initial.project) ? initial.project : null, plot: initial.plot } : null}
        outsideNotice={notice}
      />
      <SectionNav project={project} sections={sections} pin={pin} />
      <main key={activeId}>
        <Overview project={project} model={model} stats={stats} data={geo?.data} />
        {model && <Insights model={model} stats={stats} />}
        {hasAmenities(content) && <Amenities project={project} data={geo?.data} />}
        <Location project={project} landmarks={landmarks.id === activeId ? landmarks.data : null} pin={pin} />
        <Contact project={project} model={model} pin={pin} />
      </main>
      <Footer project={project} stats={stats} />
    </MotionConfig>
  );
}

/** Every project unpublished in the admin: say so plainly instead of "loading" a layout that is not listed. */
function NoLayouts() {
  const link = 'flex h-11 items-center gap-2 rounded-xl bg-white/10 px-4 text-sm font-semibold text-white ring-1 ring-inset ring-white/20 hover:bg-white/15';
  return (
    <main className="grid min-h-[100svh] place-items-center bg-navy-900 px-4 py-16 text-white">
      <div className="max-w-xl text-center">
        <img src={asset('brand/gip-lockup-white.svg')} alt="Greater Infra Projects" className="mx-auto h-16 w-auto" />
        <h1 className="mt-10 text-3xl font-bold leading-tight text-white sm:text-4xl">No live layouts are published right now</h1>
        <p role="status" className="mt-4 text-lg leading-relaxed text-navy-100">
          Our project layouts will be back here soon. For plot availability today, please talk to our sales team.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-2.5">
          <a href={`https://wa.me/${COMPANY.whatsapp}`} target="_blank" rel="noreferrer" className={link}>
            <Icon name="whatsapp" size={17} /> WhatsApp sales
          </a>
          <a href={`mailto:${COMPANY.email}`} className={link}>
            <Icon name="mail" size={17} /> {COMPANY.email}
          </a>
        </div>
        <a href={COMPANY.website} target="_blank" rel="noreferrer" className="mt-8 inline-flex items-center gap-1.5 text-sm font-semibold text-survey hover:text-white">
          All our projects <Icon name="external" size={14} />
        </a>
      </div>
    </main>
  );
}
