/**
 * The gap cut under the selected nav item.
 *
 * Lives on its own because it is drawn twice now, mirrored: dipping down out of
 * the nav at the top of the page, and rising up out of the nav that arrives at
 * the bottom when the story ends. Two copies of this would drift apart, and the
 * whole point of the second one is that it is the first one upside down.
 */

export const NOTCH_DEPTH = 38;
/** How close to the panel's ends the gap is allowed to get. */
const MARGIN = 48;

export function notchPath(width: number, centre: number, notch: number, up = false) {
  const half = Math.max(notch, 0) / 2;
  if (half <= 0) return "";

  const cx = Math.min(Math.max(centre, MARGIN + half), width - MARGIN - half);
  const left = cx - half;
  const right = cx + half;

  const edge = up ? NOTCH_DEPTH : 0;
  const floor = up ? 0 : NOTCH_DEPTH;

  return [
    `M ${left} ${edge}`,
    // Into the valley and back out: a slack curve, like a book lying open.
    `C ${left + half * 0.62} ${edge} ${cx - half * 0.16} ${floor} ${cx} ${floor}`,
    `C ${cx + half * 0.16} ${floor} ${right - half * 0.62} ${edge} ${right} ${edge}`,
    "Z",
  ].join(" ");
}
