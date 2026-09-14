/**
 * Picks a drawn-edge variant and a resting angle from an id.
 *
 * Deterministic on purpose: the server and the browser must agree, and a card
 * that re-rolled its shape on every render would jitter as you study. The same
 * card always sits the same way on the desk.
 */

const VARIANTS = ["sketch-a", "sketch-b", "sketch-c", "sketch-d"] as const;
const TILTS = ["-0.7deg", "0.5deg", "-0.4deg", "0.8deg", "-0.9deg", "0.3deg"] as const;

function hash(seed: string) {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h);
}

export function sketchVariant(seed: string) {
  return VARIANTS[hash(seed) % VARIANTS.length];
}

/** Index into any four-variant set, for the drawn outlines. */
export function sketchVariantIndex(seed: string) {
  return hash(seed) % 4;
}

export function sketchTilt(seed: string) {
  return TILTS[hash(`${seed}tilt`) % TILTS.length];
}

/** Class name plus the angle, ready to spread onto a card. */
export function sketchProps(seed: string, extra = "") {
  return {
    className: `sketch ${sketchVariant(seed)} tilt ${extra}`.trim(),
    style: { ["--tilt" as string]: sketchTilt(seed) } as React.CSSProperties,
  };
}
