import Icon from '../components/Icon.jsx';
import { focusOnMap } from '../lib/mapBus.js';

// admin icon keys -> this page's icon set
const ICON = {
  clubhouse: 'club', pool: 'pool', play: 'playground', roads: 'road', drainage: 'drop', water: 'tank', lighting: 'bolt',
  plantation: 'tree', leaf: 'tree', openSpaces: 'tree', harvesting: 'drop', gate: 'arch', security: 'shield', wall: 'shield',
};
// an amenity the layout also places (masterplan features) gets a "Show on map" button
const SPOTS = [
  [/club/i, 'clubhouse'],
  [/pool|swim/i, 'pool'],
  [/arch|gate|entrance/i, 'gate'],
  [/tank/i, 'tank'],
  [/play|child/i, 'play'],
  [/court|sport/i, 'courts'],
  [/park|garden|open space|landscap/i, 'park'],
];
const spotOf = (a, features) => {
  const hit = SPOTS.find(([re]) => re.test(`${a.name} ${a.icon || ''}`));
  return hit && features?.[hit[1]]?.at;
};

const itemsOf = (content) => (Array.isArray(content?.amenities?.items) ? content.amenities.items.filter((a) => a?.name) : []);
export const hasAmenities = (content) => itemsOf(content).length > 0;

export default function Amenities({ project, data }) {
  const am = project.content.amenities || {};
  const items = itemsOf(project.content);
  const detailed = items.filter((a) => a.description);
  const plain = items.filter((a) => !a.description);
  const features = data?.features;

  return (
    <section id="amenities" className="scroll-mt-16 bg-white">
      <div className="mx-auto max-w-page px-5 py-16 sm:px-8 sm:py-24">
        <div className="grid gap-12 lg:grid-cols-[0.9fr_1.1fr] lg:gap-20">
          <div>
            <h2 className="display text-[36px] sm:text-[48px]">{am.title || 'Amenities'}</h2>
            <p className="mt-4 max-w-[52ch] text-lg text-ink-soft">
              {am.description || `What ${project.name} offers.`}
              {detailed.concat(plain).some((a) => spotOf(a, features)) ? ' Pick one with a pin to fly the map to it.' : ''}
            </p>
            {plain.length > 0 && detailed.length > 0 && (
              <ul className="mt-8 flex flex-wrap gap-2">
                {plain.map((a) => (
                  <Pill key={a.id || a.name} a={a} at={spotOf(a, features)} />
                ))}
              </ul>
            )}
          </div>
          {detailed.length > 0 ? (
            <ul className="divide-y divide-line border-y border-line">
              {detailed.map((a) => {
                const at = spotOf(a, features);
                return (
                  <li key={a.id || a.name} className="flex items-center gap-4 py-5">
                    <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-navy-100 text-navy-700">
                      <Icon name={ICON[a.icon] || 'check'} size={24} />
                    </span>
                    <div className="min-w-0 flex-1">
                      <h3 className="text-lg font-bold">{a.name}</h3>
                      <p className="text-ink-soft">{a.description}</p>
                    </div>
                    {at && (
                      <button
                        type="button"
                        onClick={() => focusOnMap(at, a.name)}
                        aria-label={`Show ${a.name} on the map`}
                        className="flex h-10 min-w-10 shrink-0 items-center justify-center gap-2 rounded-full border border-line px-2.5 text-sm font-semibold text-navy-700 hover:border-navy-500 sm:px-4"
                      >
                        <Icon name="pin" size={16} /> <span className="sr-only sm:not-sr-only">Show on map</span>
                      </button>
                    )}
                  </li>
                );
              })}
            </ul>
          ) : (
            <ul className="flex flex-wrap content-start gap-2">
              {plain.map((a) => (
                <Pill key={a.id || a.name} a={a} at={spotOf(a, features)} />
              ))}
            </ul>
          )}
        </div>
      </div>
    </section>
  );
}

function Pill({ a, at }) {
  const body = (
    <>
      <Icon name={ICON[a.icon] || 'check'} size={16} className="text-navy-600" />
      {a.name}
      {at && <Icon name="pin" size={14} className="text-navy-500" />}
    </>
  );
  const cls = 'flex h-10 items-center gap-2 rounded-full border border-line bg-white px-4 text-[15px] font-medium text-navy-900';
  return (
    <li>
      {at ? (
        <button type="button" onClick={() => focusOnMap(at, a.name)} aria-label={`${a.name}, show on the map`} className={`${cls} hover:border-navy-500`}>
          {body}
        </button>
      ) : (
        <span className={cls}>{body}</span>
      )}
    </li>
  );
}
