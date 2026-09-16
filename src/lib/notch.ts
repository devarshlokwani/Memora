/**
 * The gap cut under the selected nav item.
 *
 * Lives on its own because it is drawn twice now, mirrored: dipping down out of
 * the nav at the top of the page, and rising up out of the nav that arrives at
 * the bottom when the story ends. Two copies of this would drift apart, and the
 * whole point of the second one is that it is the first one upside down.
 */

export const NOTCH_DEPTH = 38;
/** How much wider the gap is than the nav item it sits under. */
export const NOTCH_PADDING = 22;
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


/* Moving the gap from one nav item to another when the two are on different
   pages.

   Within a page the gap simply slides, because the panel drawing it is still
   the same panel. Across a page it cannot: the panel goes with the page, and
   the next one puts its gap wherever its own selected item is. So the gap is
   walked to the item just picked first, and only then is the page changed, and
   the panel that arrives sets the gap down exactly where the last one left it.

   Quicker than the gap moves anywhere else, because this is the one place
   somebody is waiting on it: the page they asked for cannot arrive until the
   walk is done, so the walk is the wait. A breath on the end so it has
   properly landed before the swap. */
export const NOTCH_WALK = 0.32;
export const NOTCH_HANDOVER = NOTCH_WALK * 1000 + 40;
