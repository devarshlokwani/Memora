"use client";

import gsap from "gsap";
import { useEffect, useLayoutEffect, useRef } from "react";

import { EASE, prefersReducedMotion } from "@/lib/motion";

const NOTCH_DEPTH = 38;
const CORNER = 40;

/**
 * The panel the whole landing page sits in. Its top edge dips into a gap, and
 * that gap slides along to sit under whichever nav item is selected — so the
 * panel and the nav read as one object rather than two.
 *
 * The edge is a path rather than a border because a gap that changes position
 * and width is not something a border can describe. The path is rewritten on
 * each animation frame; nothing re-renders, so the tween stays cheap.
 */
function panelPath(w: number, h: number, centre: number, notch: number) {
  const half = Math.max(notch, 0) / 2;
  const r = Math.min(CORNER, w / 2, h / 2);
  const depth = half > 0 ? NOTCH_DEPTH : 0;

  // Keep the gap clear of the rounded corners at either end.
  const cx = Math.min(Math.max(centre, r + half + 8), w - r - half - 8);
  const left = cx - half;
  const right = cx + half;

  return [
    `M ${r} 0`,
    `H ${left}`,
    // Down into the valley and back up: a slack curve, like a book lying open.
    `C ${left + half * 0.62} 0 ${cx - half * 0.16} ${depth} ${cx} ${depth}`,
    `C ${cx + half * 0.16} ${depth} ${right - half * 0.62} 0 ${right} 0`,
    `H ${w - r}`,
    `A ${r} ${r} 0 0 1 ${w} ${r}`,
    `V ${h - r}`,
    `A ${r} ${r} 0 0 1 ${w - r} ${h}`,
    `H ${r}`,
    `A ${r} ${r} 0 0 1 0 ${h - r}`,
    `V ${r}`,
    `A ${r} ${r} 0 0 1 ${r} 0`,
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
  const size = useRef({ w: 1200, h: 600 });
  // The values actually being drawn, which the tween moves toward.
  const drawn = useRef({ centre: 0, width: 0 });
  const started = useRef(false);

  const redraw = () => {
    const path = pathRef.current;
    if (!path) return;
    path.setAttribute(
      "d",
      panelPath(size.current.w, size.current.h, drawn.current.centre, drawn.current.width),
    );
  };

  useLayoutEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    const measure = () => {
      const box = host.getBoundingClientRect();
      size.current = { w: Math.round(box.width), h: Math.round(box.height) };
      redraw();
    };

    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(host);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const to = {
      centre: notchCentre ?? size.current.w / 2,
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
        className="pointer-events-none absolute inset-0 h-full w-full"
        aria-hidden="true"
        preserveAspectRatio="none"
      >
        <path ref={pathRef} fill="var(--color-paper-deep)" />
      </svg>
      <div className="relative">{children}</div>
    </div>
  );
}
