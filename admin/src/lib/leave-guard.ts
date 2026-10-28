// One app-wide "unsaved changes" guard. The project editor and the unit sheet register it while dirty; actions that
// don't go through a <Link> (command menu, sign out) call requestLeave(). The guard may prompt, then run `go` itself
// after Save or Discard. ponytail: a single slot, not a stack: only one dirty form is visible at a time (hidden
// routes unmount their effects).
type Guard = (href: string, go: () => void) => boolean;
let guard: Guard | null = null;

/** Registers (or clears, with null) the guard. Returns a cleanup that clears it only if it's still this one. */
export function setLeaveGuard(fn: Guard | null): () => void {
  guard = fn;
  return () => {
    if (guard === fn) guard = null;
  };
}

/** Runs `go` (leaving for `href`) now, or later from the guard's prompt, or never if the admin stays. */
export function requestLeave(href: string, go: () => void) {
  if (!guard || guard(href, go)) go();
}
