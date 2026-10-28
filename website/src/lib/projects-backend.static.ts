// The keyless GitHub Pages export's stand-in for ./projects-backend (aliased in next.config.ts): that build has no
// backend (BACKEND is false), so ./projects never calls these.
import type { ID, Project, Unit } from './types';

export async function loadProjects(): Promise<Project[]> {
  throw new Error('No backend in the static export');
}

export async function loadUnits(projectId: ID): Promise<Unit[]> {
  throw new Error(`No backend in the static export (plots of ${projectId})`);
}
