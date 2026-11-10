// Supabase reads for ./projects (backend mode): the published projects and a project's plots, cached under the
// 'site-data' tag. The database drops that cache the moment the admin saves (POST app/api/revalidate), so edits show on
// the next visit; the one-minute cacheLife is only the fallback. The GitHub Pages export can't run "use cache" (no cacheComponents there),
// so next.config.ts swaps this module for ./projects-backend.reads.ts (with the Supabase variables) or
// ./projects-backend.static.ts (without) in that build.
import { cacheLife, cacheTag } from 'next/cache';

import * as reads from './projects-backend.reads';
import type { ID, Project, Unit } from './types';

/** Every published project (RLS shows anon nothing else). */
export async function loadProjects(): Promise<Project[]> {
  'use cache';
  cacheLife('minutes');
  cacheTag('site-data');
  return reads.loadProjects();
}

/** A project's plots (public columns only: no notes, deed numbers or prices), by plot number. */
export async function loadUnits(projectId: ID): Promise<Unit[]> {
  'use cache';
  cacheLife('minutes');
  cacheTag('site-data');
  return reads.loadUnits(projectId);
}
