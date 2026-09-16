"use client";

import gsap from "gsap";
import { useLayoutEffect, useRef } from "react";

import { EASE, prefersReducedMotion } from "@/lib/motion";
import { NOTCH_DEPTH, notchPath } from "@/lib/notch";

/** How close to the panel's ends the gap is allowed to get. */
const MARGIN = 48;

/**
 * The panel the whole landing page sits in. Its top edge dips into a gap, and
 * that gap slides along to sit under whichever nav item is selected, so the
 * panel and the nav read as one object rather than two.
 *
 * Only the gap is ever painted. The panel and the page behind it are the same
 * tone, so a fill across the whole panel would be invisible ink, and worse, it
 * would cover the dotted grid on the page and leave the panel as a blank
 * rectangle in the middle of it. What is drawn here is the dip itself, in the
 * nav's colour, as though the nav had leaked down into the page.
 *
 * It is a path rather than a border because a gap that changes position and
 * width is not something a border can describe. The path is rewritten on each
 * animation frame; nothing re-renders, so the tween stays cheap.
 */
export function NotchPanel({
  notchCentre,
  notchWidth,
  children,
  className = "",
  notchRef,
  travel,
}: {
  /** Pixels from the panel's left edge. */
  notchCentre: number | null;
  notchWidth: number;
  children: React.ReactNode;
  className?: string;
  /**
   * The gap's own element, for anything that wants to work it while it is being
   * drawn: the sweep out of the story grows this one in as it flattens the one
   * rising out of the bar.
   */
  notchRef?: React.Ref<SVGSVGElement>;
  /**
   * How long the gap takes to slide, in seconds. The default is the pace of the
   * site. Leaving the small print asks for quicker: there the page is held
   * until the gap has arrived, so every hundredth of a second it spends
   * travelling is a hundredth the reader spends waiting for a page they have
   * already asked for.
   */
  travel?: number;
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

  /* Laid out rather than merely effectful: the very first value has to be on
     the screen in the frame the panel arrives, or every page opens with one
     painted frame of no gap at all and the gap then pops into it. That frame is
     what made arriving at the small print look like a new gap being cut, when
     it is the same gap that was already there on the page you left. */
  useLayoutEffect(() => {
    const to = {
      centre: notchCentre ?? width.current / 2,
      width: notchCentre === null ? 0 : notchWidth,
    };

    if (!started.current || prefersReducedMotion()) {
      drawn.current = { ...to };
      /* Only a real gap counts as having started. A panel mounts before the nav
         inside it has reported where its selected item is, so the first value it
         is handed is nothing at all; treating that as the gap having been
         somewhere meant the real one arriving a frame later was an animation,
         and the gap slid in from the middle of the page every time a page
         opened. It should simply be where it belongs, in the frame it appears. */
      if (notchCentre !== null) started.current = true;
      redraw();
      return;
    }

    const tween = gsap.to(drawn.current, {
      ...to,
      duration: travel ?? 0.55,
      ease: EASE,
      onUpdate: redraw,
    });
    return () => {
      tween.kill();
    };
  }, [notchCentre, notchWidth, travel]);

  return (
    <div ref={hostRef} className={`relative ${className}`}>
      <svg
        ref={notchRef}
        className="pointer-events-none absolute inset-x-0 top-0 h-[44px] w-full overflow-visible"
        aria-hidden="true"
      >
        <path ref={pathRef} fill="var(--color-paper)" />
      </svg>
      <div className="relative">{children}</div>
    </div>
  );
}
