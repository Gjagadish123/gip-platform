// Publish-readiness checks (domain.md §5 R/W/O table + §4 data-quality problems). Pure functions, no clock.
// 'required' blocks publishing; 'recommended' shows in the confirm dialog and in "Needs attention".
// Pass `others` (all projects) to enable cross-project checks: reused RERA/LP numbers, copied text, slug clashes,
// homepage capacity, shared location image.
import { COMPANY, DEMO_TODAY, HOMEPAGE_CAPACITY, LIVE_SITE_URL, PLACEHOLDER_PHONES, SECTION_IDS, type SectionId } from './constants';
import { formatLandArea } from './format';
import type { Asset, Project, ProjectType, Unit } from './types';

export interface Issue { section: SectionId; field: string; level: 'required' | 'recommended'; message: string }
export type SectionState = 'complete' | 'warning' | 'missing';

/* ---------- derived facts (never stored) ---------- */

/** Completed projects and projects that link out (externalUrl) have a card only. */
export const hasDetailPage = (p: Project) => p.lifecycle !== 'completed' && !p.publishing.externalUrl;
export const reraNumber = (p: Project) => p.legal.approvals.find((a) => a.authority === 'RERA')?.reference;
/** Drives the card's "Approved" badge (hard-coded on every card today). */
export const isApproved = (p: Project) => p.legal.approvals.some((a) => a.status === 'approved' || a.status === 'registered');
/** "View on live site ↗" target; only the 8 projects that exist on the old site have one. */
export const liveSiteUrl = (p: Project) =>
  p.publishing.legacySlug ? `${LIVE_SITE_URL}/property/${encodeURIComponent(p.publishing.legacySlug)}` : null;

/* ---------- patterns ---------- */

const REF = /\b(?:\d{2,7}(?:\/[A-Za-z0-9.]+){2,6}|P\d{11})\b/g; // LP / TLP / RERA numbers
const normRef = (s: string) => s.replace(/\.+$/, '').replace(/\s/g, '').toUpperCase();
const ACRES = /(\d+(?:\.\d+)?)\s*\+?\s*-?\s*acres?\b/gi;
const RUPEES = /₹\s?[\d,]+(?:\.\d+)?/;
const YEAR = /\b(20\d{2})\b/g;
const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const blank = (s?: string | null) => !s?.trim();
const isStock = (a: Asset | null | undefined) => !!a && /images\.unsplash\.com/.test(a.url);

export function validateProject(p: Project, type: ProjectType, units: Unit[], others: Project[] = []): Issue[] {
  const out: Issue[] = [];
  const add = (level: Issue['level']) => (section: SectionId, field: string, message: string) => out.push({ section, field, level, message });
  const req = add('required'), rec = add('recommended');
  const detail = hasDetailPage(p);
  const peers = others.filter((o) => o.id !== p.id);
  const nounMany = type.unitNounPlural.toLowerCase();
  const thisYear = Number(DEMO_TODAY.slice(0, 4));

  const totalAcres = p.landArea ? p.landArea.acres + (p.landArea.guntas ?? 0) / 40 : 0;
  const checkAcres = (section: SectionId, field: string, ...texts: string[]) => {
    if (!p.landArea || !totalAcres) return;
    for (const t of texts) for (const m of t.matchAll(ACRES)) {
      const n = Number(m[1]);
      if (Math.abs(n - totalAcres) > 0.5 && !(p.landArea.approx && n >= totalAcres)) {
        return rec(section, field, `Says ${m[1]} acres; land area is ${formatLandArea(p.landArea)}.`);
      }
    }
  };
  const knownRefs = new Set(p.legal.approvals.flatMap((a) => (a.reference ? [normRef(a.reference)] : [])));
  const checkRefs = (section: SectionId, field: string, ...texts: string[]) => {
    for (const t of texts) for (const m of t.matchAll(REF)) {
      const ref = m[0].replace(/\.+$/, '');
      if (/[A-Za-z]/.test(ref) && !knownRefs.has(normRef(ref))) {
        return rec(section, field, `Mentions ${ref}, which isn't one of this project's approvals.`);
      }
    }
  };
  const checkCopy = (section: SectionId, field: string, text: string | undefined) => {
    if (!text) return;
    const price = RUPEES.exec(text);
    if (price) rec(section, field, `Mentions a price (${price[0]}). Keep prices in Pricing so they stay in sync.`);
    const past = [...text.matchAll(YEAR)].map((m) => Number(m[1])).find((y) => y < thisYear);
    if (past) rec(section, field, `Mentions ${past}, which has passed.`);
  };
  const checkCopied = (section: SectionId, field: string, text: string) => {
    if (text.trim().length < 40) return;
    const twin = peers.find((o) => readText(o, field) === text);
    if (twin) rec(section, field, `Same text as ${twin.name}. Write copy for this project.`);
  };

  /* Overview */
  if (blank(p.name)) req('overview', 'name', 'Add a project name.');
  else if (p.name === p.name.toUpperCase() && /[A-Z]{3}/.test(p.name)) rec('overview', 'name', 'Name is in capitals. Store natural case; the website can uppercase it.');
  if (detail) {
    if (blank(p.description)) req('overview', 'description', 'Add a short description for the hero and search results.');
    else if (p.description.length > 320) rec('overview', 'description', `Description is ${p.description.length} characters; keep it under 320.`);
    if (p.highlights.length < 3) rec('overview', 'highlights', `Add at least 3 highlights (${p.highlights.length} now).`);
    else if (p.highlights.length > 8) rec('overview', 'highlights', 'Keep highlights to 8 or fewer.');
  }
  if (p.lifecycle === 'completed' && !p.completionYear) rec('overview', 'completionYear', 'Add the completion year.');
  checkAcres('overview', 'description', p.description);
  checkCopy('overview', 'description', p.description);
  checkCopied('overview', 'description', p.description);

  /* Pricing & size */
  if (p.price.mode !== 'on_request' && !(p.price.amount > 0)) req('pricing', 'price', 'Enter a price, or choose "Contact for price".');
  if (!totalAcres) (p.lifecycle === 'completed' ? rec : req)('pricing', 'landArea', 'Add the total land area.');
  if (detail && type.hasInventory && units.length === 0) {
    if (!p.totalUnits) req('pricing', 'totalUnits', `Add ${nounMany} in Inventory, or enter the number of ${nounMany}.`);
    if (!p.unitSize) req('pricing', 'unitSize', `Enter the ${type.unitNoun.toLowerCase()} size range.`);
  }

  /* Location */
  const loc = p.location, adv = p.locationAdvantages;
  if (blank(loc.short)) req('location', 'location.short', 'Add the short location shown on cards.');
  if (detail) {
    if (blank(loc.full)) req('location', 'location.full', 'Add the full location shown in the hero.');
    if (blank(loc.district)) req('location', 'location.district', 'Add the district.');
    if (blank(loc.state)) req('location', 'location.state', 'Add the state.');
    if (!loc.areaId) rec('location', 'location.areaId', 'Pick a filter area so the project appears under a location filter.');
    if (blank(adv.badge)) rec('location', 'locationAdvantages.badge', 'Add the "Prime Location" badge text.');
    if (!adv.categories.length) rec('location', 'locationAdvantages.categories', 'Add at least one location category.');
    for (const c of adv.categories) {
      if (!c.places.length) req('location', `locationAdvantages.categories.${c.id}`, `"${c.title || 'Untitled'}" has no places; add one or remove the category.`);
    }
    checkCopied('location', 'locationAdvantages.description', adv.description);
  }

  /* Media */
  const m = p.media;
  if (!m.cover) req('media', 'media.cover', 'Add a cover image.');
  if (detail) {
    if (m.gallery.length < 3) req('media', 'media.gallery', `Add at least 3 gallery photos (${m.gallery.length} now).`);
    else if (m.gallery.length < 6) rec('media', 'media.gallery', `6 or more photos fill two rows of the website gallery (${m.gallery.length} now).`);
    if (!m.masterPlan) req('media', 'media.masterPlan', 'Add the master plan (image or PDF).');
    else if (m.masterPlan.kind === 'pdf' && !(m.masterPlanPage >= 1)) req('media', 'media.masterPlanPage', 'Choose which PDF page shows the master plan.');
    if (!m.locationImage) rec('media', 'media.locationImage', 'Add a location map image.');
    else {
      const sharing = peers.filter((o) => o.media.locationImage?.url === m.locationImage!.url).length;
      if (sharing) rec('media', 'media.locationImage', `Same location image as ${sharing} other ${sharing === 1 ? 'project' : 'projects'}.`);
    }
    if (!m.brochure) rec('media', 'media.brochure', 'Add the brochure PDF; the Download Brochure button is hidden without it.');
  }
  for (const [field, a] of [['media.cover', m.cover], ['media.hero', m.hero], ['media.masterPlan', m.masterPlan]] as const) {
    if (isStock(a)) rec('media', field, 'Stock photo (Unsplash), not a project photo.');
  }
  const urls = m.gallery.map((a) => a.url);
  if (new Set(urls).size !== urls.length) rec('media', 'media.gallery', 'The gallery has duplicate photos.');

  /* Page content (only rendered when there is a detail page) */
  if (detail) {
    const v = p.vision;
    if (blank(v.description)) req('vision', 'vision.description', 'Add the vision paragraph.');
    if (!v.features.length) req('vision', 'vision.features', 'Add 1–4 feature cards.');
    else if (v.features.length > 4) req('vision', 'vision.features', 'The page shows at most 4 feature cards.');
    else if (v.features.length < 4) rec('vision', 'vision.features', `The row is designed for 4 cards (${v.features.length} now).`);
    checkAcres('vision', 'vision.features', v.description, ...v.features.map((f) => f.description));
    checkRefs('vision', 'vision.features', v.description, ...v.features.flatMap((f) => [f.title, f.description]));

    const mp = p.masterPlan;
    if (mp.stats.length < 3 || mp.stats.length > 4) rec('masterplan', 'masterPlan.stats', `Use 3–4 layout stats (${mp.stats.length} now).`);
    checkAcres('masterplan', 'masterPlan.description', mp.description, ...mp.stats.map((s) => s.value));
    checkRefs('masterplan', 'masterPlan.description', mp.description);

    if (p.amenities.visible) {
      if (!p.amenities.items.length) rec('amenities', 'amenities.items', 'Add at least one amenity.');
      if (p.amenities.items.some((a) => a.featured && !a.icon)) rec('amenities', 'amenities.items', 'Featured amenities need an icon.');
    }

    if (p.lifecycle === 'ongoing' && !p.legal.approvals.length) req('legal', 'legal.approvals', 'Add at least one approval.');
    if (!p.legal.approvals.some((a) => a.authority === 'RERA')) rec('legal', 'legal.approvals', 'No RERA registration listed.');
    checkRefs('legal', 'legal.description', p.legal.description, ...p.legal.approvals.map((a) => a.description ?? ''));

    const phone = p.cta.phone?.replace(/[\s-]/g, '');
    if (!phone) rec('cta', 'cta.phone', `No sales phone; the page falls back to ${COMPANY.phone}.`);
    else if (PLACEHOLDER_PHONES.includes(phone)) req('cta', 'cta.phone', 'This is the placeholder number +91 98765 43210.');
    else if (!/^\+91[6-9]\d{9}$/.test(phone)) rec('cta', 'cta.phone', 'Use a 10-digit Indian mobile number with +91.');
    const wa = p.cta.whatsapp?.replace(/[\s-]/g, '');
    if (wa && PLACEHOLDER_PHONES.includes(wa)) req('cta', 'cta.whatsapp', 'This is the placeholder number +91 98765 43210.');
    for (const f of ['subheading', 'title', 'description', 'urgency'] as const) checkCopy('cta', `cta.${f}`, p.cta[f]);
    checkRefs('cta', 'cta.description', p.cta.description);
  }
  checkCopied('vision', 'vision.description', p.vision.description);
  checkCopied('cta', 'cta.description', p.cta.description);

  /* Legal (approvals feed the card badge, so these run for every project) */
  for (const a of p.legal.approvals) {
    const field = `legal.approvals.${a.id}`;
    if (blank(a.reference)) {
      if (a.authority === 'HMDA' || a.authority === 'DTCP' || a.authority === 'RERA') rec('legal', field, `${a.title || a.authority}: no reference number.`);
      continue;
    }
    if (a.authority === 'RERA' && a.status !== 'registered') rec('legal', field, 'RERA status should be Registered.');
    if (/\/PIg\//.test(a.reference!)) rec('legal', field, `${a.reference} reads "PIg"; HMDA LP numbers usually read "Plg". Please check the approval letter.`);
    const twins = peers.filter((o) => o.legal.approvals.some((b) => b.reference && normRef(b.reference) === normRef(a.reference!)));
    if (twins.length) rec('legal', field, `${a.authority} ${a.reference} is also used by ${twins.map((o) => o.name).join(', ')}.`);
  }

  /* Publishing */
  const pub = p.publishing;
  if (blank(pub.slug)) req('publishing', 'publishing.slug', 'Add a URL slug.');
  else if (!SLUG.test(pub.slug)) req('publishing', 'publishing.slug', 'Use lowercase letters, numbers and single hyphens only.');
  else {
    const clash = peers.find((o) => o.publishing.slug === pub.slug);
    if (clash) req('publishing', 'publishing.slug', `Slug is already used by ${clash.name}.`);
  }
  if (pub.homepageSlot && pub.state === 'published') {
    const inRow = peers.filter((o) => o.publishing.state === 'published' && o.publishing.homepageSlot === pub.homepageSlot).length + 1;
    const cap = HOMEPAGE_CAPACITY[pub.homepageSlot];
    if (inRow > cap) rec('publishing', 'publishing.homepageSlot', `The homepage ${pub.homepageSlot} row holds ${cap}; ${inRow} projects are in it.`);
  }
  if (pub.externalUrl && !/^https?:\/\/\S+$/.test(pub.externalUrl)) rec('publishing', 'publishing.externalUrl', 'Use a full URL starting with https://');

  return out;
}

/** Text fields compared across projects for copy-paste content. */
function readText(p: Project, field: string): string | undefined {
  switch (field) {
    case 'description': return p.description;
    case 'vision.description': return p.vision.description;
    case 'locationAdvantages.description': return p.locationAdvantages.description;
    case 'cta.description': return p.cta.description;
    default: return undefined;
  }
}

/** Per-section dot state for the editor TOC: any required → 'missing', any recommended → 'warning'. */
export function sectionCompletion(issues: Issue[]): Record<SectionId, SectionState> {
  const out = Object.fromEntries(SECTION_IDS.map((s) => [s, 'complete'])) as Record<SectionId, SectionState>;
  for (const i of issues) {
    if (i.level === 'required') out[i.section] = 'missing';
    else if (out[i.section] === 'complete') out[i.section] = 'warning';
  }
  return out;
}

/** Issues that block publishing. */
export const blockers = (issues: Issue[]) => issues.filter((i) => i.level === 'required');
