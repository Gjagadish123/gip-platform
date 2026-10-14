// One app-wide "unsaved changes" guard. The editor registers it while dirty; navigations that don't go through a
// <Link> (command menu) ask canLeave() before router.push. The guard may prompt and navigate later itself.
// ponytail: a single slot, not a stack: only one editor is visible at a time (hidden routes unmount their effects).
let guard: ((href: string) => boolean) | null = null;

/** Registers (or clears, with null) the guard. Returns a cleanup that clears it only if it's still this one. */
export function setLeaveGuard(fn: ((href: string) => boolean) | null): () => void {
  guard = fn;
  return () => {
    if (guard === fn) guard = null;
  };
}

/** True when nothing objects to leaving for `href`. */
export const canLeave = (href: string) => !guard || guard(href);
