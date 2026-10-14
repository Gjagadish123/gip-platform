// Activity feed derived from the seeded unit histories (status changes in the last ~6 months), newest first.
// One entry per batch (batchId) or per single unit change. Same provenance as units.ts: GC VI's sold marks are
// from the brochure scan; everything else is sample.
import { DEMO_NOW, getProjectType } from '../constants';
import { describeStatusChange, naturalCompare } from '../inventory';
import { seededId } from '../rng';
import type { ActivityEvent, ID, Project, StatusEvent, Unit } from '../types';

const SIX_MONTHS_MS = 183 * 86_400_000;

export function deriveActivity(projects: Project[], units: Record<ID, Unit[]>): ActivityEvent[] {
  const since = Date.parse(DEMO_NOW) - SIX_MONTHS_MS;
  type Group = { projectId: ID; ev: StatusEvent; numbers: string[] };
  const groups = new Map<string, Group>();
  for (const [projectId, list] of Object.entries(units)) {
    for (const u of list) {
      for (const ev of u.history) {
        if (ev.from === null || Date.parse(ev.at) < since) continue;
        const key = ev.batchId ?? `${u.id}@${ev.at}`;
        const g = groups.get(key);
        if (g) g.numbers.push(u.number); else groups.set(key, { projectId, ev, numbers: [u.number] });
      }
    }
  }
  const byId = new Map(projects.map((p) => [p.id, p]));
  return [...groups.values()]
    .sort((a, b) => (a.ev.at < b.ev.at ? 1 : a.ev.at > b.ev.at ? -1 : naturalCompare(a.numbers[0], b.numbers[0])))
    .map(({ projectId, ev, numbers }, i) => {
      const nums = numbers.sort(naturalCompare);
      const type = getProjectType(byId.get(projectId)?.typeId ?? '');
      return {
        id: seededId('act', i + 1), at: ev.at, by: ev.by, projectId, kind: 'status' as const,
        message: describeStatusChange(type, nums, ev.to) + (ev.note && ev.batchId ? ` · ${ev.note}` : ''),
        ...(ev.batchId && { batchId: ev.batchId }), unitNumbers: nums, to: ev.to,
      };
    });
}
