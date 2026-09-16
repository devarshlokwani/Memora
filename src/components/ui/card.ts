/**
 * The one shape every card on the site is cut to.
 *
 * The formats deck settled this: a white card with a generous corner, a well a
 * shade down from it for anything pictorial, a hairline rule above the footing,
 * and two shadows rather than one, a tight dark one for contact and a wide soft
 * one for the lift off the page. The cards before it were drawn with the same
 * wobbling pen as the rest of the site, which is right for a mark on a page and
 * wrong for an object lying on one.
 *
 * Class names rather than a component, because the places these are needed are
 * not the same shape as each other: one is the face of a card that flips, one is
 * a button in a list, one is a row with a progress track in it. What has to
 * match is the treatment, not the markup.
 */

export const CARD = "rounded-[1.35rem] border border-transparent bg-card";

/**
 * Not chosen yet, or not written yet: an edge drawn as dashes with nothing
 * behind it.
 *
 * The same shape as a card and plainly not one, which is the whole of what it
 * has to say. A white card with a fainter shadow says the same thing much too
 * quietly: three of them in a list and the one you are actually on is a guess.
 * The border is there on a real card too, merely transparent, so nothing
 * shifts by a pixel when one becomes the other.
 */
export const CARD_PENDING = "rounded-[1.35rem] border border-dashed border-rule";

/** Lying on the page. */
export const CARD_REST =
  "shadow-[0_2px_4px_-2px_rgba(11,9,10,0.14),0_14px_28px_-16px_rgba(11,9,10,0.4)]";

/** Picked up off it: the one being read, or the one under the pointer. */
export const CARD_RAISED =
  "shadow-[0_2px_5px_-2px_rgba(11,9,10,0.18),0_26px_46px_-18px_rgba(11,9,10,0.5)]";


/** The well a picture or a diagram is mounted in, a shade down from the card. */
export const CARD_WELL = "rounded-[0.95rem] bg-paper-deep";

/** The small letter-spaced line above a name. */
export const CARD_KICKER =
  "text-[0.6rem] font-semibold uppercase tracking-[0.18em] text-ink-soft/70";

/** The same line along the foot, quieter still. */
export const CARD_FOOT =
  "text-[0.58rem] font-semibold uppercase tracking-[0.18em] text-ink-soft/60";

/** The hairline the footing sits under. */
export const CARD_RULE = "border-t border-rule-soft";

/** The tag in the corner of a well: two letters, reversed out. */
export const CARD_TAG =
  "rounded-full bg-ink px-2 py-[3px] text-[0.6rem] font-semibold tracking-[0.12em] text-paper";
