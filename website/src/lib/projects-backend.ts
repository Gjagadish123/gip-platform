// Supabase reads for ./projects (backend mode): the published projects and a project's plots, cached for a minute so
// what the admin publishes shows up quickly. The GitHub Pages export can't run "use cache" (no cacheComponents there),
// so next.config.ts swaps this module for ./projects-backend.reads.ts (with the Supabase variables) or
// ./projects-backend.static.ts (without) in that build.
import { cacheLife } from 'next/cache';

import * as reads from './projects-backend.reads';
import type { ID, Project, Unit } from './types';

/** Every published project (RLS shows anon nothing else). */
export async function loadProjects(): Promise<Project[]> {
  'use cache';
  cacheLife('minutes');
  return reads.loadProjects();
}

/** A project's plots (public columns only: no notes, deed numbers or prices), by plot number. */
export async function loadUnits(projectId: ID): Promise<Unit[]> {
  'use cache';
  cacheLife('minutes');
  return reads.loadUnits(projectId);
}
