import { Logo } from "@/components/layout/Logo";
import { type NavItem } from "@/components/layout/SlidingNav";

/**
 * The one row of links, wherever it appears.
 *
 * The wordmark is an item like any other, sitting in the middle of the row: it
 * opens the story that introduces Memora, and the gap in the panel tracks it the
 * same way it tracks the rest. It carries no underline, because a drawn line
 * under the wordmark reads as a mistake rather than as a selection, so the gap
 * alone says it is the one you are on.
 *
 * The waitlist sits in the row rather than off the right-hand edge, so the whole
 * thing stays balanced about the middle: two sections, the wordmark, a section
 * and the way in. It is the one item that really navigates.
 *
 * Kept here rather than on the landing page because the small pages wear the
 * same nav, and a second copy of this list would be a second nav the day either
 * one changed.
 */
export const NAV_ITEMS: NavItem[] = [
  { id: "try", label: "Try a card", href: "/?s=try" },
  { id: "how", label: "How it works", href: "/?s=how" },
  { id: "hero", label: "Memora", href: "/?s=hero", node: <Logo />, marked: false },
  { id: "formats", label: "Formats", href: "/?s=formats" },
  { id: "waitlist", label: "Waitlist", href: "/waitlist" },
];


/**
 * The second row, which only the small print has.
 *
 * Terms and the privacy notice are not items in the row above: they are not
 * places you go from the nav, they are places you end up from a footer link or
 * from under a form. But arriving at one used to close the gap in the panel
 * altogether, and a nav with nothing marked reads as a nav that has lost track
 * of you. So the row grows a second one instead, these two sit in it, and the
 * gap moves down to point at whichever you are reading.
 */
export const LEGAL_ITEMS: NavItem[] = [
  { id: "terms", label: "Terms", href: "/terms" },
  { id: "privacy", label: "Privacy", href: "/privacy" },
];


/* Where the gap was when you last looked at the nav.

   The small print is not in the row, so on its own it has nothing to point the
   gap at, and a nav with nothing marked reads as one that has lost you. Rather
   than invent a home for Terms, the gap simply stays where you left it: you
   went to the small print from somewhere, and that somewhere is still where you
   are on your way back. Session storage because it is exactly the life of the
   visit, and it survives the reload that a ref in a component would not. */
const WAS = "memora:nav-active";

export function rememberNav(id: string) {
  try {
    sessionStorage.setItem(WAS, id);
  } catch {
    // Private windows and locked-down browsers. The fallback below covers it.
  }
}

/** The item to mark when the page itself is not one. Never returns nothing. */
export function recallNav() {
  try {
    const was = sessionStorage.getItem(WAS);
    if (was && NAV_ITEMS.some((item) => item.id === was)) return was;
  } catch {
    // As above.
  }
  return "waitlist";
}
