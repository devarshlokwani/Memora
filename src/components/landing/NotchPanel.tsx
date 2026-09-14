"use client";

import gsap from "gsap";
import { useEffect, useLayoutEffect, useRef } from "react";

import { EASE, prefersReducedMotion } from "@/lib/motion";

const NOTCH_DEPTH = 38;
/** How close to the panel's ends the gap is allowed to get. */
const MARGIN = 48;

/**
 * The panel the whole landing page sits in. Its top edge dips into a gap, and
 * that gap slides along to sit under whichever nav item is selected — so the
 * panel and the nav read as one object rather than two.
 *
 * Only the gap is ever painted. The panel and the page behind it are the same
 * tone, so a fill across the whole panel would be invisible ink — and worse, it
 * would cover the dotted grid on the page and leave the panel as a blank
 * rectangle in the middle of it. What is drawn here is the dip itself, in the
 * nav's colour, as though the nav had leaked down into the page.
 *
 * It is a path rather than a border because a gap that changes position and
 * width is not something a border can describe. The path is rewritten on each
 * animation frame; nothing re-renders, so the tween stays cheap.
 */
function notchPath(w: number, centre: number, notch: number) {
  const half = Math.max(notch, 0) / 2;
  if (half <= 0) return "";

  const cx = Math.min(Math.max(centre, MARGIN + half), w - MARGIN - half);
  const left = cx - half;
  const right = cx + half;

  return [
    `M ${left} 0`,
    // Down into the valley and back up: a slack curve, like a book lying open.
    `C ${left + half * 0.62} 0 ${cx - half * 0.16} ${NOTCH_DEPTH} ${cx} ${NOTCH_DEPTH}`,
    `C ${cx + half * 0.16} ${NOTCH_DEPTH} ${right - half * 0.62} 0 ${right} 0`,
    "Z",
  ].join(" ");
}

export function NotchPanel({
  notchCentre,
  notchWidth,
  children,
  className = "",
}: {
  /** Pixels from the panel's left edge. */
  notchCentre: number | null;
  notchWidth: number;
  children: React.ReactNode;
  className?: string;
}) {
  const hostRef = useRef<HTMLDivElement>(null);
  const pathRef = useRef<SVGPathElement>(null);
  const width = useRef(1200);
  // The values actually being drawn, which the tween moves toward.
  const drawn = useRef({ centre: 0, width: 0 });
  const started = useRef(false);

  const redraw = () => {
    const path = pathRef.current;
    if (!path) return;
    path.setAttribute("d", notchPath(width.current, drawn.current.centre, drawn.current.width));
  };

  useLayoutEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    const measure = () => {
      width.current = Math.round(host.getBoundingClientRect().width);
      redraw();
    };

    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(host);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const to = {
      centre: notchCentre ?? width.current / 2,
      width: notchCentre === null ? 0 : notchWidth,
    };

    if (!started.current || prefersReducedMotion()) {
      drawn.current = { ...to };
      started.current = true;
      redraw();
      return;
    }

    const tween = gsap.to(drawn.current, {
      ...to,
      duration: 0.55,
      ease: EASE,
      onUpdate: redraw,
    });
    return () => {
      tween.kill();
    };
  }, [notchCentre, notchWidth]);

  return (
    <div ref={hostRef} className={`relative ${className}`}>
      <svg
        className="pointer-events-none absolute inset-x-0 top-0 h-[44px] w-full overflow-visible"
        aria-hidden="true"
      >
        <path ref={pathRef} fill="var(--color-paper)" />
      </svg>
      <div className="relative">{children}</div>
    </div>
  );
}
