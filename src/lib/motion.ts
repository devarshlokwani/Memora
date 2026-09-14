/** Animation is decoration here, so anyone who has asked for less of it gets none. */
export function prefersReducedMotion() {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export const EASE = "power3.out";
export const DURATION = 0.45;
