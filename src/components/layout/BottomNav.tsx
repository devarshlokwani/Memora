"use client";

import gsap from "gsap";
import { useCallback, useLayoutEffect, useRef, useState } from "react";

import { NavRow } from "@/components/layout/NavRow";
import { type NavItem } from "@/components/layout/SlidingNav";
import { EASE, prefersReducedMotion } from "@/lib/motion";
import { NOTCH_DEPTH, notchPath } from "@/lib/notch";

/** Enough of the bar's own height to put its notch off the screen as well. */
const HIDDEN = 190;

/**
 * The same nav again, arriving at the foot of the story.
 *
 * Its gap is cut the other way — rising out of the bar into the page above it
 * rather than dipping down — so it reads as the top bar turned over, which is
 * what tells you it is the same control and that there is somewhere to go.
 *
 * Picking something from it flies the bar up the screen to where the top bar
 * lives and hands over. The page underneath is already on the new section by
 * then, so what lands is the real nav and this one simply stops being drawn.
 */
export function BottomNav({
  items,
  activeId,
  shown,
  onSelect,
}: {
  items: NavItem[];
  activeId?: string | null;
  /** The story is far enough through for the bar to be offered. */
  shown: boolean;
  onSelect: (id: string) => void;
}) {
  const barRef = useRef<HTMLDivElement>(null);
  const pathRef = useRef<SVGPathElement>(null);
  const [notch, setNotch] = useState<{ centre: number | null; width: number }>({
    centre: null,
    width: 0,
  });
  const drawn = useRef({ centre: 0, width: 0 });
  const started = useRef(false);
  const leaving = useRef(false);

  const placeNotch = useCallback((rect: DOMRect | null) => {
    const bar = barRef.current;
    if (!bar || !rect) {
      setNotch({ centre: null, width: 0 });
      return;
    }
    const box = bar.getBoundingClientRect();
    setNotch({ centre: rect.left + rect.width / 2 - box.left, width: rect.width + 22 });
  }, []);

  const redraw = useCallback(() => {
    const path = pathRef.current;
    const bar = barRef.current;
    if (!path || !bar) return;
    const width = Math.round(bar.getBoundingClientRect().width);
    path.setAttribute("d", notchPath(width, drawn.current.centre, drawn.current.width, true));
  }, []);

  useLayoutEffect(() => {
    const to = { centre: notch.centre ?? 0, width: notch.centre === null ? 0 : notch.width };
    if (!started.current || prefersReducedMotion()) {
      drawn.current = { ...to };
      started.current = true;
      redraw();
      return;
    }
    const tween = gsap.to(drawn.current, { ...to, duration: 0.55, ease: EASE, onUpdate: redraw });
    return () => {
      tween.kill();
    };
  }, [notch, redraw]);

  /* Slides in and out of the foot of the window rather than appearing there.
     Its resting place is set here rather than in the markup: an inline
     transform and a GSAP tween both claiming the same property end up
     compounding, and the bar sits at some multiple of where it should be.

     Far enough down to take the notch with it. The notch is drawn above the
     bar's top edge, so a translation of just the bar's own height leaves that
     bump sitting on the bottom of the window through the whole story. */
  const placed = useRef(false);
  useLayoutEffect(() => {
    const bar = barRef.current;
    if (!bar || leaving.current) return;

    if (!placed.current || prefersReducedMotion()) {
      placed.current = true;
      gsap.set(bar, { yPercent: shown ? 0 : HIDDEN });
      return;
    }
    gsap.to(bar, { yPercent: shown ? 0 : HIDDEN, duration: 0.55, ease: EASE });
  }, [shown]);

  const pick = (id: string) => {
    const bar = barRef.current;
    if (!bar || prefersReducedMotion()) {
      onSelect(id);
      return;
    }

    /* The flight has to outlive the section change, which is why this bar is
       rendered by the shell and not by the story: mounted inside the story it
       was torn down the instant the new section arrived, half a second before
       it had finished going anywhere. */
    leaving.current = true;
    const box = bar.getBoundingClientRect();
    // Up to exactly where the top bar sits, so the handover has nothing to jump.
    gsap.to(bar, {
      y: -(window.innerHeight - box.height),
      duration: 0.62,
      ease: EASE,
      onComplete: () => {
        gsap.set(bar, { y: 0, yPercent: HIDDEN });
        leaving.current = false;
      },
    });
    onSelect(id);
  };

  return (
    <div
      ref={barRef}
      className="pointer-events-auto fixed inset-x-0 bottom-0 z-50 bg-paper"
      // Hidden from the reading order while it is off the bottom of the window,
      // so a keyboard does not tab into a bar nobody can see.
      aria-hidden={!shown}
      inert={!shown}
    >
      {/* Exactly as tall as the notch is deep, and dropped a pixel into the bar.
          Any taller and the flat side of the bump stops short of the bar's top
          edge, leaving a hairline of the page showing between the two — which is
          the grey line that looked like a seam in the white. */}
      <svg
        aria-hidden="true"
        style={{ height: NOTCH_DEPTH, bottom: "calc(100% - 1px)" }}
        className="pointer-events-none absolute inset-x-0 w-full overflow-visible"
      >
        <path ref={pathRef} fill="var(--color-paper)" />
      </svg>

      <NavRow items={items} activeId={activeId} onSelect={pick} onSelectedRect={placeNotch} />
    </div>
  );
}
