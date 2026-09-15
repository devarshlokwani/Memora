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
 * It only shows and hides itself. Picking something from it starts a sweep up
 * the page that the shell runs, because that sweep is as much about the two
 * sections either side of this bar as it is about the bar.
 */
export function BottomNav({
  items,
  activeId,
  shown,
  sweeping,
  barRef,
  notchRef,
  onSelect,
  onSelectedRect,
}: {
  items: NavItem[];
  activeId?: string | null;
  /** The story is far enough through for the bar to be offered. */
  shown: boolean;
  /** The shell is driving the bar up the page; hands off this component. */
  sweeping: boolean;
  barRef: React.RefObject<HTMLDivElement | null>;
  /** The bump rising out of the bar, which the sweep flattens as it travels. */
  notchRef?: React.Ref<SVGSVGElement>;
  onSelect: (id: string) => boolean | void;
  onSelectedRect?: (rect: DOMRect | null) => void;
}) {
  const pathRef = useRef<SVGPathElement>(null);
  const [notch, setNotch] = useState<{ centre: number | null; width: number }>({
    centre: null,
    width: 0,
  });
  const drawn = useRef({ centre: 0, width: 0 });
  const started = useRef(false);

  const placeNotch = useCallback(
    (rect: DOMRect | null) => {
      onSelectedRect?.(rect);
      const bar = barRef.current;
      if (!bar || !rect) {
        setNotch({ centre: null, width: 0 });
        return;
      }
      const box = bar.getBoundingClientRect();
      setNotch({ centre: rect.left + rect.width / 2 - box.left, width: rect.width + 22 });
    },
    [barRef, onSelectedRect],
  );

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
    if (!bar || sweeping) return;

    if (!placed.current || prefersReducedMotion()) {
      placed.current = true;
      gsap.set(bar, { yPercent: shown ? 0 : HIDDEN });
      return;
    }
    gsap.to(bar, { yPercent: shown ? 0 : HIDDEN, duration: 0.55, ease: EASE });
  }, [shown, sweeping, barRef]);

  return (
    <div
      ref={barRef}
      /* Centred rather than stacked: while this is being grown up the
          window the row has to find the middle of it, and drift back to sitting
          in a bar when it shrinks again. Laid out from the top it would stay
          pinned to the ceiling the whole way. */
      className="pointer-events-auto fixed inset-x-0 bottom-0 z-[70] flex flex-col justify-center bg-paper"
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
        ref={notchRef}
        aria-hidden="true"
        style={{ height: NOTCH_DEPTH, bottom: "calc(100% - 1px)" }}
        className="pointer-events-none absolute inset-x-0 w-full overflow-visible"
      >
        <path ref={pathRef} fill="var(--color-paper)" />
      </svg>

      <NavRow items={items} activeId={activeId} onSelect={onSelect} onSelectedRect={placeNotch} />
    </div>
  );
}
