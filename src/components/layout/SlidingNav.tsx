"use client";

import gsap from "gsap";
import Link from "next/link";
import { useEffect, useLayoutEffect, useRef } from "react";

import { UNDERLINE_PATH } from "@/components/ui/DrawnUnderline";
import { prefersReducedMotion } from "@/lib/motion";

export type NavItem = {
  id: string;
  label: string;
  href: string;
  /** Shown instead of the label: the wordmark sits in the row as an item. */
  node?: React.ReactNode;
  /** Off for an item the underline would not suit, such as the wordmark. */
  marked?: boolean;
};

/**
 * Nav where each item owns its own underline and only the selected one is drawn.
 *
 * Changing section un-draws the old mark right to left, then draws the new one
 * left to right. It used to be a single mark that slid between items, which made
 * the same stroke look like it was being dragged across the nav. The line you
 * had chosen never actually went away.
 *
 * Both directions are the same property: with `pathLength` normalised to 100,
 * a dash offset of 0 is fully drawn and 100 is empty, and the visible run always
 * grows and shrinks from the left-hand end of the path.
 */
const DRAW = 0.42;
const ERASE = 0.26;
/** The usual space between items, as a number so it can be overridden. */
const GAP = 28;

export function SlidingNav({
  items,
  activeId,
  className = "",
  gap = GAP,
  reversed = false,
  onSelect,
  onSelectedRect,
}: {
  items: NavItem[];
  /** The item whose underline is drawn. */
  activeId?: string | null;
  className?: string;
  /** Pixels between items. The small print needs a gap the width of the notch. */
  gap?: number;
  /**
   * Drawn in paper rather than ink, for a row that sits on an inked ground.
   * Everything the row says, it says in one tone or the other: which item you
   * are on, which you are pointing at, and the line drawn under the one you
   * are reading.
   */
  reversed?: boolean;
  /**
   * Returns true when it has dealt with the click itself, which stops the link
   * navigating. These are real links so they can be opened in a new tab and
   * read by anything that walks the page, but letting one navigate while the
   * page is mid-transition swaps the section out from under it.
   */
  onSelect?: (id: string) => boolean | void;
  /**
   * Where the selected item is on screen. The landing page uses this to line the
   * gap in the panel below up with the nav, so the two move together.
   */
  onSelectedRect?: (rect: DOMRect | null) => void;
}) {
  const itemRefs = useRef<Record<string, HTMLAnchorElement | null>>({});
  const pathRefs = useRef<Record<string, SVGPathElement | null>>({});
  const drawn = useRef<string | null>(null);

  useLayoutEffect(() => {
    const reduce = prefersReducedMotion();
    const previous = drawn.current;
    if (previous === activeId) return;

    const leaving = previous ? pathRefs.current[previous] : null;
    const arriving = activeId ? pathRefs.current[activeId] : null;

    if (reduce || previous === null) {
      if (leaving) gsap.set(leaving, { strokeDashoffset: 100 });
      if (arriving) gsap.set(arriving, { strokeDashoffset: 0 });
      drawn.current = activeId ?? null;
      return;
    }

    const timeline = gsap.timeline();
    if (leaving) {
      timeline.to(leaving, { strokeDashoffset: 100, duration: ERASE, ease: "power2.in" });
    }
    if (arriving) {
      timeline.to(arriving, { strokeDashoffset: 0, duration: DRAW, ease: "power2.out" });
    }

    drawn.current = activeId ?? null;
  }, [activeId]);

  // Reported separately from the marks so a consumer can line something else up
  // with the selected item, the landing page hangs the panel gap off this.
  const reportSelected = useRef(() => {});
  reportSelected.current = () => {
    if (!onSelectedRect) return;
    const el = activeId ? itemRefs.current[activeId] : null;
    const box = el ? el.getBoundingClientRect() : null;
    /* A row that is not laid out at all reports a box of nothing. That happens
       on a phone, where this row is hidden and the wordmark and the waitlist
       button stand in for it, and passing the empty box on drew a stub of a gap
       clinging to the left end of the panel under a nav it did not belong to. */
    onSelectedRect(box && box.width > 0 ? box : null);
  };

  useLayoutEffect(() => {
    reportSelected.current();
  }, [activeId, items]);

  useEffect(() => {
    const reposition = () => reportSelected.current();
    window.addEventListener("resize", reposition);
    // Web fonts land after first paint and change how wide every item is.
    document.fonts?.ready.then(reposition).catch(() => {});
    return () => window.removeEventListener("resize", reposition);
  }, []);

  const entry = (item: NavItem) => {
    const marked = item.marked !== false;
    return (
      <li key={item.id}>
        <Link
          href={item.href}
          ref={(el) => {
            itemRefs.current[item.id] = el;
          }}
          onClick={(event) => {
            // A modified click is someone asking for a new tab; leave it be.
            if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
            if (onSelect?.(item.id)) event.preventDefault();
          }}
          aria-current={activeId === item.id ? "page" : undefined}
          aria-label={item.node ? item.label : undefined}
          className={`relative block text-[0.95rem] transition-colors ${
            item.node ? "px-2 py-0.5" : "py-1"
          } ${
            reversed
              ? activeId === item.id
                ? "text-paper"
                : "text-paper/55 hover:text-paper"
              : activeId === item.id
                ? "text-ink"
                : "text-ink-soft hover:text-ink"
          }`}
        >
          {item.node ?? item.label}
          {marked && (
            <svg
              viewBox="0 0 200 12"
              preserveAspectRatio="none"
              aria-hidden="true"
              className="pointer-events-none absolute inset-x-0 -bottom-1 h-[0.42em] w-full overflow-visible"
            >
              <path
                ref={(el) => {
                  pathRefs.current[item.id] = el;
                }}
                d={UNDERLINE_PATH}
                pathLength={100}
                fill="none"
                stroke={reversed ? "var(--color-paper)" : "var(--color-ink)"}
                strokeWidth="2.6"
                strokeLinecap="round"
                vectorEffect="non-scaling-stroke"
                strokeDasharray={100}
                strokeDashoffset={100}
              />
            </svg>
          )}
        </Link>
      </li>
    );
  };

  /* The wordmark is the middle of the row, and the row is the middle of the
     page, so the wordmark has to be the middle of the page. A single centred
     flex line does not give that: it centres the whole run of items, and the
     mark drifts by half the difference between the two sides. Two equal columns
     either side of it do. */
  const middle = items.findIndex((item) => item.node);

  if (middle === -1) {
    return (
      <ul className={`relative flex items-center ${className}`} style={{ gap }}>
        {items.map(entry)}
      </ul>
    );
  }

  return (
    <div
      className={`relative grid grid-cols-[1fr_auto_1fr] items-center ${className}`}
      style={{ gap }}
    >
      <ul className="flex items-center justify-end" style={{ gap }}>
        {items.slice(0, middle).map(entry)}
      </ul>
      <ul className="flex items-center">{entry(items[middle])}</ul>
      <ul className="flex items-center justify-start" style={{ gap }}>
        {items.slice(middle + 1).map(entry)}
      </ul>
    </div>
  );
}
