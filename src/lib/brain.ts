/**
 * The shape of the brain in the footer, as pure arithmetic.
 *
 * Built rather than downloaded. Every anatomical mesh worth having is either
 * licensed in a way that follows you around (ShareAlike) or sits behind a
 * download the browser cannot reach, and the ones that are freely floating
 * about have no stated provenance at all — not something to bury in a product.
 * Generating it also means it can be drawn to match the rest of the site
 * instead of arriving as a photoreal object that belongs to another page.
 *
 * Everything here maps a point on a unit sphere to a point on the brain, so the
 * component only has to walk an icosphere's vertices and hand each one over.
 * No three.js in this file: it is arithmetic, and it is tested as arithmetic.
 */

/* ------------------------------------------------------------------- noise */

const fade = (t: number) => t * t * t * (t * (t * 6 - 15) + 10);
const lerp = (a: number, b: number, t: number) => a + t * (b - a);

function gradient(hash: number, x: number, y: number, z: number) {
  const h = hash & 15;
  const u = h < 8 ? x : y;
  const v = h < 4 ? y : h === 12 || h === 14 ? x : z;
  return ((h & 1) === 0 ? u : -u) + ((h & 2) === 0 ? v : -v);
}

/** Perlin's permutation table, shuffled from a seed so the folds are repeatable. */
function permutation(seed: number) {
  const base = new Uint8Array(256);
  for (let i = 0; i < 256; i++) base[i] = i;

  let state = seed >>> 0;
  const rand = () => ((state = (state * 1664525 + 1013904223) >>> 0) / 4294967296);
  for (let i = 255; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    const swap = base[i];
    base[i] = base[j];
    base[j] = swap;
  }

  const table = new Uint8Array(512);
  for (let i = 0; i < 512; i++) table[i] = base[i & 255];
  return table;
}

const P = permutation(20260914);

function noise(x: number, y: number, z: number) {
  const xi = Math.floor(x) & 255;
  const yi = Math.floor(y) & 255;
  const zi = Math.floor(z) & 255;
  const xf = x - Math.floor(x);
  const yf = y - Math.floor(y);
  const zf = z - Math.floor(z);
  const u = fade(xf);
  const v = fade(yf);
  const w = fade(zf);

  const a = P[xi] + yi;
  const aa = P[a] + zi;
  const ab = P[a + 1] + zi;
  const b = P[xi + 1] + yi;
  const ba = P[b] + zi;
  const bb = P[b + 1] + zi;

  return lerp(
    lerp(
      lerp(gradient(P[aa], xf, yf, zf), gradient(P[ba], xf - 1, yf, zf), u),
      lerp(gradient(P[ab], xf, yf - 1, zf), gradient(P[bb], xf - 1, yf - 1, zf), u),
      v,
    ),
    lerp(
      lerp(gradient(P[aa + 1], xf, yf, zf - 1), gradient(P[ba + 1], xf - 1, yf, zf - 1), u),
      lerp(
        gradient(P[ab + 1], xf, yf - 1, zf - 1),
        gradient(P[bb + 1], xf - 1, yf - 1, zf - 1),
        u,
      ),
      v,
    ),
    w,
  );
}

/**
 * Ridged noise: the absolute value folded back on itself, which turns the
 * smooth hills of plain noise into the winding raised ribbons a cortex is made
 * of. Plain noise gives a lumpy potato; this gives gyri.
 *
 * The stretch matters. This noise stays inside about ±0.45 nine times in ten,
 * so `1 - |noise|` averages 0.8 rather than 0.5 — left as it is, the fold comes
 * out as a constant bulge with a few per cent of relief on it, and the brain
 * renders as a smooth pebble. Scaled up first, the ridge fills 0 to 1 and sits
 * around the middle, so the term adds and subtracts about equally.
 */
function ridged(x: number, y: number, z: number) {
  return 1 - Math.min(Math.abs(noise(x, y, z)) * 2.4, 1);
}

const clamp01 = (t: number) => (t < 0 ? 0 : t > 1 ? 1 : t);
const smoothstep = (edge0: number, edge1: number, t: number) => {
  const x = clamp01((t - edge0) / (edge1 - edge0));
  return x * x * (3 - 2 * x);
};

/* -------------------------------------------------------------- the shapes */

export type Vec3 = [number, number, number];

/** x runs left to right, y bottom to top, z back to front. */
const WIDTH = 0.66;
const HEIGHT = 0.60;
const LENGTH = 0.98;

/**
 * A point on the cerebrum, from a direction on the unit sphere.
 *
 * An ellipsoid does the gross shape; the rest is what makes it read as a brain
 * rather than an egg — a narrower front, a flat underside, temporal lobes
 * bulging at the sides, folds all over, and the fissure down the middle that
 * everyone actually recognises it by.
 */
export function cerebrumPoint(x: number, y: number, z: number): Vec3 {
  // Frontal lobe tapers; the occipital end tapers less.
  const front = smoothstep(0.1, 1, z);
  const back = smoothstep(0.1, 1, -z);
  const taper = 1 - 0.2 * front - 0.12 * back;

  // Temporal lobes: a bulge low down at the sides, forward of centre.
  const temporal =
    0.1 *
    Math.exp(-Math.pow((y + 0.42) / 0.34, 2)) *
    Math.exp(-Math.pow((z - 0.1) / 0.62, 2)) *
    smoothstep(0.25, 0.8, Math.abs(x));

  let px = x * WIDTH * taper * (1 + temporal);
  let py = y * HEIGHT;
  let pz = z * LENGTH;

  // Brains sit flat underneath rather than curving away to a point.
  if (py < 0) py *= 1 - 0.3 * smoothstep(0, -0.55, py);

  // Folds. Two octaves: the second breaks up the regularity of the first, which
  // on its own reads as a pattern wrapped round a ball.
  const fold =
    0.115 * (ridged(px * 4.6, py * 4.6, pz * 4.6) - 0.5) +
    0.022 * (ridged(px * 10 + 31, py * 10, pz * 10) - 0.5);

  // Smoothed out towards the underside, where a brain is flat, not folded.
  const folded = fold * smoothstep(-0.62, -0.2, py);

  const length = Math.hypot(px, py, pz) || 1;
  px += (px / length) * folded;
  py += (py / length) * folded;
  pz += (pz / length) * folded;

  // The longitudinal fissure: a narrow trench down the midline, deepest on top
  // and closing up underneath where the hemispheres join.
  const fissure =
    0.17 * Math.exp(-Math.pow(px / 0.085, 2)) * smoothstep(-0.2, 0.3, py);
  py -= fissure;

  return [px, py, pz];
}

/**
 * A point on the cerebellum — the smaller body tucked under the back of the
 * brain. Its folds are fine and near-parallel rather than winding, so the noise
 * it uses is stretched flat in y to band them.
 */
export function cerebellumPoint(x: number, y: number, z: number): Vec3 {
  let px = x * 0.34;
  let py = y * 0.17;
  let pz = z * 0.24;

  const folia = 0.024 * (ridged(px * 3, py * 26, pz * 5) - 0.5);
  const length = Math.hypot(px, py, pz) || 1;
  px += (px / length) * folia;
  py += (py / length) * folia;
  pz += (pz / length) * folia;

  // A shallow crease down the middle, as the cerebrum has.
  py -= 0.03 * Math.exp(-Math.pow(px / 0.06, 2));

  return [px, py - 0.36, pz - 0.62];
}

/**
 * The brainstem, as a ring of points at a height along it: a tapered tube
 * leaning down and forward out of the underside.
 */
export function brainstemRing(t: number, angle: number): Vec3 {
  const radius = lerp(0.11, 0.065, t);
  // Leaning forward as it drops, so it reads as tucked under the brain rather
  // than as a trunk it happens to be sitting on.
  const lean = 0.2 * t;

  return [
    Math.cos(angle) * radius,
    -0.38 - t * 0.3,
    Math.sin(angle) * radius * 1.15 - 0.36 + lean,
  ];
}
