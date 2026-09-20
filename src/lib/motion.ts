import { useEffect, useState } from "react";

/** Animation is decoration here, so anyone who has asked for less of it gets none. */
export function prefersReducedMotion() {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export const EASE = "power3.out";
export const DURATION = 0.45;

/**
 * The same question, asked by something that renders on the server.
 *
 * `prefersReducedMotion` answers `false` where there is no window, which is
 * the only honest answer available during a prerender but the wrong one for a
 * reader who has asked for stillness. A component that branches on it at
 * render time therefore produces one tree on the server and, for that reader,
 * a different one on the client, and hydration fails on the difference.
 *
 * This starts at `false` so the first client render agrees with the prerender,
 * then corrects itself in an effect. Reduced motion arrives a frame late,
 * which is the cost of the markup matching, and it is a frame of a thing that
 * has not begun moving yet. The listener is there because the preference can
 * be changed with the page open.
 *
 * Only for a branch in the returned markup. Anything deciding inside an effect
 * or a handler should keep calling `prefersReducedMotion`, which is already on
 * the client by the time it runs and needs no state of its own.
 */
export function useReducedMotion() {
  const [reduce, setReduce] = useState(false);

  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const read = () => setReduce(query.matches);
    read();
    query.addEventListener("change", read);
    return () => query.removeEventListener("change", read);
  }, []);

  return reduce;
}
