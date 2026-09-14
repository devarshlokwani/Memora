"use client";

import gsap from "gsap";
import Link from "next/link";
import { Fragment, useCallback, useEffect, useLayoutEffect, useRef } from "react";

import { DURATION, EASE, prefersReducedMotion } from "@/lib/motion";

export type NavItem = { id: string; label: string; href: string };

/**
 * Nav whose underline slides and stretches between items rather than blinking
 * from one to the next — the mark travels, so you can see where you came from.
 *
 * It marks what is selected and nothing else. Following the pointer as well made
 * it twitch at every passing cursor, and a mark that moves when you have not
 * chosen anything is noise rather than information.
 */
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
  /** The item the mark sits under. */
  activeId?: string | null;
  className?: string;
  onSelect?: (id: string) => void;
  /** Sits in the middle of the row; the mark travels straight past it. */
  center?: React.ReactNode;
  splitAt?: number;
  /**
   * Where the selected item is on screen. The landing page uses this to line the
   * gap in the panel below up with the nav, so the two move together.
   */
  onSelectedRect?: (rect: DOMRect | null) => void;
}) {
  const listRef = useRef<HTMLUListElement>(null);
  const markRef = useRef<HTMLSpanElement>(null);
  const itemRefs = useRef<Record<string, HTMLAnchorElement | null>>({});
  // Whether the mark is currently on screen; decides fade-in versus travel.
  const visible = useRef(false);

  const target = activeId ?? null;

  const moveMark = useCallback(
    (animate: boolean) => {
      const mark = markRef.current;
      const list = listRef.current;
      if (!mark || !list) return;

      const el = target ? itemRefs.current[target] : null;
      if (!el) {
        gsap.to(mark, { autoAlpha: 0, duration: 0.18, ease: EASE });
        visible.current = false;
        return;
      }

      const itemBox = el.getBoundingClientRect();
      const listBox = list.getBoundingClientRect();
      const to = { x: itemBox.left - listBox.left, width: itemBox.width };

      if (visible.current && animate && !prefersReducedMotion()) {
        // Already on screen somewhere else: travel to the new item.
        gsap.to(mark, { ...to, autoAlpha: 1, duration: DURATION, ease: EASE });
      } else {
        // Coming from nothing: appear under the item rather than sliding in
        // from the edge of the nav, which would look like a stray line.
        gsap.set(mark, to);
        gsap.to(mark, {
          autoAlpha: 1,
          duration: prefersReducedMotion() ? 0 : 0.25,
          ease: EASE,
        });
      }
      visible.current = true;
    },
    [target],
  );

  useLayoutEffect(() => {
    moveMark(true);
  }, [moveMark]);

  // Held in a ref so the listeners below can be installed once. Re-running them
  // per target would fire a snap-to-position a frame after each tween started,
  // and the mark would jump instead of travelling.
  const latestMove = useRef(moveMark);
  latestMove.current = moveMark;

  useEffect(() => {
    const reposition = () => {
      latestMove.current(false);
      reportSelected.current();
    };
    window.addEventListener("resize", reposition);

    // Web fonts land after first paint and change how wide every item is.
    document.fonts?.ready.then(reposition).catch(() => {});

    return () => window.removeEventListener("resize", reposition);
  }, []);

  // Reported separately from the mark so a consumer can line something else up
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

  return (
    <ul ref={listRef} className={`relative flex items-center gap-7 ${className}`}>
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
            className={`block py-1 text-[0.95rem] transition-colors ${
              activeId === item.id ? "text-ink" : "text-ink-soft hover:text-ink"
            }`}
          >
            {item.label}
          </Link>
          </li>
        </Fragment>
      ))}

      {/* The travelling mark. Drawn, so it matches everything else on the page. */}
      <span
        ref={markRef}
        aria-hidden="true"
        className="pointer-events-none absolute bottom-0 left-0 block h-[7px] opacity-0"
      >
        <svg viewBox="0 0 120 8" preserveAspectRatio="none" className="h-full w-full">
          <path
            d="M2 5.4C22 2.6 44 6.6 62 4.2 80 1.8 100 5.8 118 3.2"
            fill="none"
            stroke="var(--color-ink)"
            strokeWidth="2.4"
            strokeLinecap="round"
            vectorEffect="non-scaling-stroke"
          />
        </svg>
      </span>
    </ul>
  );
}
