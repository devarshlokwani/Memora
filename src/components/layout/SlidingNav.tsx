"use client";

import gsap from "gsap";
import Link from "next/link";
import { Fragment, useEffect, useLayoutEffect, useRef } from "react";

import { UNDERLINE_PATH } from "@/components/ui/DrawnUnderline";
import { prefersReducedMotion } from "@/lib/motion";

export type NavItem = { id: string; label: string; href: string };

/**
 * Nav where each item owns its own underline and only the selected one is drawn.
 *
 * Changing section un-draws the old mark right to left, then draws the new one
 * left to right. It used to be a single mark that slid between items, which made
 * the same stroke look like it was being dragged across the nav — the line you
 * had chosen never actually went away.
 *
 * Both directions are the same property: with `pathLength` normalised to 100,
 * a dash offset of 0 is fully drawn and 100 is empty, and the visible run always
 * grows and shrinks from the left-hand end of the path.
 */
const DRAW = 0.42;
const ERASE = 0.26;

export function SlidingNav({
  items,
  activeId,
  className = "",
  onSelect,
  center,
  splitAt,
  onSelectedRect,
}: {
  items: NavItem[];
  /** The item whose underline is drawn. */
  activeId?: string | null;
  className?: string;
  onSelect?: (id: string) => void;
  /** Sits in the middle of the row; the marks are per item either side of it. */
  center?: React.ReactNode;
  splitAt?: number;
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
  // with the selected item — the landing page hangs the panel gap off this.
  const reportSelected = useRef(() => {});
  reportSelected.current = () => {
    if (!onSelectedRect) return;
    const el = activeId ? itemRefs.current[activeId] : null;
    onSelectedRect(el ? el.getBoundingClientRect() : null);
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

  return (
    <ul className={`relative flex items-center gap-7 ${className}`}>
      {items.map((item, index) => (
        <Fragment key={item.id}>
          {center && index === (splitAt ?? Math.ceil(items.length / 2)) && (
            <li className="mx-2">{center}</li>
          )}
          <li>
            <Link
              href={item.href}
              ref={(el) => {
                itemRefs.current[item.id] = el;
              }}
              onClick={() => onSelect?.(item.id)}
              aria-current={activeId === item.id ? "page" : undefined}
              className={`relative block py-1 text-[0.95rem] transition-colors ${
                activeId === item.id ? "text-ink" : "text-ink-soft hover:text-ink"
              }`}
            >
              {item.label}
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
                  stroke="var(--color-ink)"
                  strokeWidth="2.6"
                  strokeLinecap="round"
                  vectorEffect="non-scaling-stroke"
                  strokeDasharray={100}
                  strokeDashoffset={100}
                />
              </svg>
            </Link>
          </li>
        </Fragment>
      ))}
    </ul>
  );
}
