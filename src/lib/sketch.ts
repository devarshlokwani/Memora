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

/* ------------------------------------------------------------------ drawn box

   A rounded rectangle whose edges drift off true, the way a drawn one does.
   Lives here rather than in the card that first needed it because the diagrams
   on the landing page draw their own boxes from the same pen. */

const WOBBLE = 3.2;

function seeded(seed: string) {
  let h = hash(seed);
  return () => {
    h += 0x6d2b79f5;
    let t = h;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Path data for a hand-drawn box, in whatever coordinate space you hand it.
 *
 * Built at real size rather than stretched from a fixed viewBox: stretching
 * turns the corners into long ellipses on a tall box and the line ends up
 * crossing its own content.
 */
export function drawnRectPath(width: number, height: number, seed: string, wobble = WOBBLE) {
  const rand = seeded(seed);
  const jitter = () => (rand() - 0.5) * 2 * wobble;

  const w = Math.max(width, 12);
  const h = Math.max(height, 12);
  // Corners stay a fixed size so a tall box does not get long oval ends.
  const r = Math.min(46, w * 0.17, h * 0.17);

  return [
    `M ${r} ${jitter()}`,
    `C ${w * 0.3} ${jitter()} ${w * 0.7} ${jitter()} ${w - r} ${jitter()}`,
    `Q ${w + jitter() * 0.4} ${jitter() * 0.4} ${w + jitter() * 0.3} ${r}`,
    `C ${w + jitter()} ${h * 0.35} ${w + jitter()} ${h * 0.65} ${w} ${h - r}`,
    `Q ${w} ${h} ${w - r} ${h + jitter() * 0.4}`,
    `C ${w * 0.7} ${h + jitter()} ${w * 0.3} ${h + jitter()} ${r} ${h}`,
    `Q ${jitter() * 0.4} ${h} ${jitter() * 0.3} ${h - r}`,
    `C ${jitter()} ${h * 0.65} ${jitter()} ${h * 0.35} 0 ${r}`,
    `Q 0 ${jitter() * 0.4} ${r} ${jitter()}`,
    "Z",
  ].join(" ");
}

/* -------------------------------------------------------------- paper marks

   The loose strokes lying under the page. Not a grid: a grid is the one thing
   a ruled tile always becomes, however softly it is drawn, because the eye
   finds the repeat before it finds the texture. These are laid down across the
   whole document at once, at their own angles and lengths, with the occasional
   pair of near-parallel strokes where a hand would have gone over something
   twice. */

export type PaperStroke = {
  d: string;
  dash: string;
  width: number;
  opacity: number;
};

const DASHES = ["2 9", "3 8", "4 11", "2.5 7", "5 12", "6 9"];

/** How many square pixels of page each stroke gets to itself. */
const SPACING = 44000;

/** Marks are laid down a band at a time, so a longer page only adds to them. */
export const MARK_BAND = 900;

/**
 * Every stroke on the page, top to bottom.
 *
 * Banded rather than generated across the whole height at once: positions
 * scaled to the document would slide every mark on the page each time a section
 * changed its length, so the background would appear to stretch as you moved
 * around the site. Each band is drawn from its own seed, which also means the
 * marks never repeat however far down you go.
 */
export function paperStrokes(width: number, height: number, seed = "memora"): PaperStroke[] {
  if (width < 2 || height < 2) return [];

  const strokes: PaperStroke[] = [];
  for (let band = 0; band * MARK_BAND < height; band++) {
    strokes.push(...bandStrokes(width, band * MARK_BAND, `${seed}-${band}`));
  }
  return strokes;
}

function bandStrokes(width: number, top: number, seed: string): PaperStroke[] {
  const rand = seeded(seed);
  const pick = <T,>(list: readonly T[]) => list[Math.floor(rand() * list.length)];
  const between = (lo: number, hi: number) => lo + rand() * (hi - lo);

  const strokes: PaperStroke[] = [];
  const count = Math.max(3, Math.round((width * MARK_BAND) / SPACING));

  for (let i = 0; i < count; i++) {
    // Mostly lying along the page, with a few running down it, enough variety
    // that no two strokes read as belonging to the same set of rules.
    const angle = rand() < 0.24 ? between(1.2, 1.94) : between(-0.42, 0.42);
    // Weighted short: a page of uniformly long sweeps starts to look ruled
    // again, whichever way each one happens to be pointing.
    const length = 70 + Math.pow(rand(), 1.5) * 290;
    const x = between(-40, width + 40);
    const y = top + between(-20, MARK_BAND + 20);

    const dx = Math.cos(angle) * length;
    const dy = Math.sin(angle) * length;
    // Across the stroke, so the bow bends it rather than stretching it.
    const nx = -Math.sin(angle);
    const ny = Math.cos(angle);

    // A pair now and then, the way a hand goes back over a line it has drawn.
    const repeats = rand() < 0.22 ? 2 : 1;
    const dash = pick(DASHES);
    const opacity = between(0.08, 0.18);

    for (let n = 0; n < repeats; n++) {
      const slip = n === 0 ? 0 : between(4, 10) * (rand() < 0.5 ? -1 : 1);
      // Bowed in proportion to how far the stroke runs, so a long one bends by
      // as much as a short one does, a fixed offset leaves the long ones ruler
      // straight. A third of them bend back the other way at the far end.
      const bow = length * between(-0.05, 0.05);
      const far = rand() < 0.34 ? -bow * between(0.6, 1.2) : bow * between(0.35, 0.9);
      const ox = x + nx * slip;
      const oy = y + ny * slip;

      strokes.push({
        d: [
          `M${ox.toFixed(1)} ${oy.toFixed(1)}`,
          `C${(ox + dx * 0.3 + nx * bow).toFixed(1)} ${(oy + dy * 0.3 + ny * bow).toFixed(1)}`,
          `${(ox + dx * 0.7 + nx * far).toFixed(1)} ${(oy + dy * 0.7 + ny * far).toFixed(1)}`,
          `${(ox + dx).toFixed(1)} ${(oy + dy).toFixed(1)}`,
        ].join(" "),
        dash,
        width: between(1, 1.5),
        opacity: n === 0 ? opacity : opacity * 0.75,
      });
    }
  }

  return strokes;
}

/**
 * A circle with a shaky edge, for framing something round.
 *
 * Points at jittered radii joined through a Catmull-Rom spline rather than a
 * polygon, so the line stays smooth between the wobbles instead of showing its
 * corners, a drawn circle is uneven, not faceted.
 */
export function drawnCirclePath(size: number, seed: string, wobble = 3.4) {
  const rand = seeded(seed);
  const radius = size / 2 - wobble;
  const centre = size / 2;
  const steps = 11;

  const points: [number, number][] = [];
  for (let i = 0; i < steps; i++) {
    const angle = (i / steps) * Math.PI * 2;
    const r = radius + (rand() - 0.5) * 2 * wobble;
    points.push([centre + Math.cos(angle) * r, centre + Math.sin(angle) * r]);
  }

  const at = (i: number) => points[(i + steps) % steps];
  const parts = [`M ${at(0)[0].toFixed(2)} ${at(0)[1].toFixed(2)}`];
  for (let i = 0; i < steps; i++) {
    const [p0, p1, p2, p3] = [at(i - 1), at(i), at(i + 1), at(i + 2)];
    const c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6];
    const c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
    parts.push(
      `C ${c1[0].toFixed(2)} ${c1[1].toFixed(2)} ${c2[0].toFixed(2)} ${c2[1].toFixed(2)} ${p2[0].toFixed(2)} ${p2[1].toFixed(2)}`,
    );
  }
  return parts.join(" ") + " Z";
}
