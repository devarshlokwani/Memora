"use client";

import gsap from "gsap";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";

import { NavRow } from "@/components/layout/NavRow";
import { LEGAL_ITEMS, NAV_ITEMS, recallNav, rememberNav } from "@/components/layout/navItems";
import { SlidingNav } from "@/components/layout/SlidingNav";
import { NotchPanel } from "@/components/landing/NotchPanel";
import { EASE, prefersReducedMotion } from "@/lib/motion";
import { NOTCH_DEPTH, NOTCH_HANDOVER, NOTCH_PADDING, NOTCH_WALK } from "@/lib/notch";

/** The sub nav is a little deeper than the gap, so it closes under the point. */
const BAR = NOTCH_DEPTH + 8;
const DOWN = 0.42;
const UP = 0.3;


/**
 * The shell every page outside the landing page sits in.
 *
 * Same nav, same panel, same gap cut under whichever item you are on. These
 * pages used to carry a stripped-back header of their own, which meant the nav
 * changed shape the moment you left the landing page and the site stopped
 * feeling like one thing.
 *
 * The main row does nothing special with a click: there are no sections to
 * swap, so every item is an ordinary link. The transition slide is the bar's
 * gesture at the end of the story, and these pages have no bar and nothing to
 * have scrolled through first. The one exception is leaving the small print,
 * which waits for it to be put away first.
 */
export function PageShell({
  activeId,
  sub,
  children,
}: {
  /** The item in the main row the gap sits under. Omitted where none applies. */
  activeId?: string;
  /**
   * Which piece of small print you are reading, if you are.
   *
   * Terms and the privacy notice are not places you go from the nav, so the gap
   * does not move to them. It stays on the item it was already on, and a second
   * row comes down out of the nav underneath it with both of them on it, one
   * either side of the gap.
   *
   * That row is inked, with the type reversed out of it, and it runs the width
   * of the page like the row above it. Set on the page itself it read as nothing
   * at all: grey text on a grey ground below a grey nav is three greys and no
   * object. The gap stays paper and comes down through it, which is the one
   * thing that says the row belongs to the nav and not to the page under it.
   */
  sub?: string;
  children: React.ReactNode;
}) {
  const router = useRouter();
  const panelRef = useRef<HTMLDivElement>(null);
  const barRef = useRef<HTMLDivElement>(null);
  const printRef = useRef<HTMLDivElement>(null);
  const leaving = useRef(false);
  const [notch, setNotch] = useState<{
    /** Across the panel, for the gap, which is drawn in the panel's own box. */
    centre: number | null;
    width: number;
    /** Across the window, for the row, which runs the whole width of it. */
    across: number | null;
  }>({ centre: null, width: 0, across: null });
  /* Which item in the main row to mark while the small print is open. Read
     after mount rather than during render: it comes out of session storage, and
     the server has no idea what that says. */
  const [held, setHeld] = useState<string | null>(null);
  /* Where the pair stood when you chose to leave. On the way out the gap walks
     to the item you picked, and the pair is hung off the gap, so without this
     they walk with it: a row sliding sideways while it is being put away, which
     is one movement too many and the only part of it that looked broken. */
  const [parted, setParted] = useState<number | null>(null);

  /* Laid out, not merely effectful. This decides which item the gap sits on,
     and deciding it after the first paint means a frame of the gap somewhere
     else, or nowhere, before it jumps to where it belongs. */
  useLayoutEffect(() => {
    if (sub) setHeld((was) => was ?? recallNav());
    else if (activeId) rememberNav(activeId);
  }, [sub, activeId]);

  /* Asked for in advance, so that choosing one is the animation and nothing
     else. The gap takes about a third of a second to walk across, which is
     plenty of time to have fetched what is on the other side, and without this
     the two happen in series: the gap walks, and then the page thinks about it.

     The landing page especially. It is behind a suspense boundary with nothing
     to show while it waits, so arriving there unprepared is a blank window for
     as long as it takes, gap and nav and all. */
  useEffect(() => {
    for (const item of [...NAV_ITEMS, ...LEGAL_ITEMS]) router.prefetch(item.href);
  }, [router]);

  // Nav rects arrive in viewport coordinates. The gap wants them against the
  // panel; the row wants them as they came.
  const placeNotch = useCallback((rect: DOMRect | null) => {
    const panel = panelRef.current;
    if (!panel || !rect) {
      setNotch({ centre: null, width: 0, across: null });
      return;
    }
    const box = panel.getBoundingClientRect();
    const across = rect.left + rect.width / 2;
    setNotch({ centre: across - box.left, width: rect.width + NOTCH_PADDING, across });
  }, []);

  /* The row comes down out of the nav rather than being there when the page
     arrives. It starts a row's height higher, which is behind the header and so
     out of sight.

     The gap does not move for any of this. It was already on this item on the
     page you came from and it is on the same item here, so animating it as well
     would be taking away something already in the right place and handing it
     back, which is the jump this was meant to avoid. */
  const open = Boolean(sub);
  useLayoutEffect(() => {
    if (!open || prefersReducedMotion()) return;
    const parts = [barRef.current, printRef.current].filter(Boolean);
    if (!parts.length) return;

    const tween = gsap.fromTo(
      parts,
      { y: -BAR, autoAlpha: 0 },
      { y: 0, autoAlpha: 1, duration: DOWN, ease: EASE },
    );
    return () => {
      tween.kill();
      /* Only tidied up when the row is staying. On the way out these are halfway
         up behind the nav with the page about to change, and putting them back
         where they started is the black row flashing into place on top of
         whatever was picked, in the last frame before it all goes. */
      if (!leaving.current) gsap.set(parts, { clearProps: "transform,opacity,visibility" });
    };
    /* Keyed on the small print being open at all, not on which of the two it is.
       The layout these pages share keeps this row up across a move between them,
       and re-running here would have it leave and arrive again for a move that
       never took it anywhere. */
  }, [open]);

  /**
   * Picking something in the main row.
   *
   * The gap walks to it and the page changes once it has arrived, so that the
   * panel on the other side sets the gap down exactly where this one left it.
   * Everything about why is in `NOTCH_HANDOVER`.
   *
   * With the small print open there is a second thing to do, and only one of
   * them is the gap: the row goes back the way it came, up behind the nav.
   * Letting the link through straight away would cut from a two-row nav to a
   * one-row nav in a single frame, which reads as the page dropping something
   * rather than putting it away.
   */
  const handOver = useCallback(
    (id: string, href: string) => {
      const standingOn = held ?? activeId;
      if (leaving.current || prefersReducedMotion()) return false;
      // Nothing to hand over: no gap on screen, or it is already where it is going.
      if (notch.across === null || (id === standingOn && !sub)) return false;

      leaving.current = true;
      setHeld(id);

      const parts = [barRef.current, printRef.current].filter(Boolean);
      if (sub && parts.length) {
        setParted(notch.across);
        gsap.to(parts, { y: -BAR, autoAlpha: 0, duration: UP, ease: EASE });
      }

      // A row to put away still needs its moment, even with no gap to walk.
      const wait = id === standingOn ? UP * 1000 + 60 : NOTCH_HANDOVER;
      window.setTimeout(() => router.push(href), wait);
      return true;
    },
    [activeId, held, notch.across, router, sub],
  );

  const standing = parted ?? notch.across;

  return (
    <div className="flex flex-1 flex-col">
      <header className="relative z-50 bg-paper">
        <NavRow
          items={NAV_ITEMS}
          activeId={held ?? activeId}
          onSelectedRect={placeNotch}
          onSelect={(id) => {
            const item = NAV_ITEMS.find((entry) => entry.id === id);
            return item ? handOver(id, item.href) : false;
          }}
        />
      </header>

      {/* Positioned, so the row can run its full width: an absolute child is
          laid against this box, padding included, which is the window. */}
      <main className="relative px-4 pb-20 sm:px-6">
        {/* First, and so underneath: the gap is drawn by the panel below and has
            to come down over this rather than be covered by it. */}
        {sub ? <div ref={barRef} className="absolute inset-x-0 top-0 bg-ink" style={{ height: BAR }} /> : null}

        <div ref={panelRef} className="relative mx-auto max-w-6xl">
          {/* Always the quick walk here. On these pages the gap has nowhere to
              go except on the way out, so there is no other pace to keep. */}
          <NotchPanel notchCentre={notch.centre} notchWidth={notch.width} travel={NOTCH_WALK}>
            <div className="px-6 py-14 sm:px-10 sm:py-16">{children}</div>
          </NotchPanel>
        </div>

        {/* Last, and layered above the panel, because the panel's own box covers
            this strip and would take every click meant for these two. */}
        {sub ? (
          <div
            ref={printRef}
            /* Hung off the gap rather than centred on the row. Centred, the pair
               sat under the wordmark with the gap somewhere else along the nav,
               and nothing said the three were one thing. Centred is still the
               fallback on a phone, where the row of links is not on screen and
               there is no gap to hang from. */
            style={{ left: standing ?? "50%", height: BAR }}
            className="absolute top-0 z-10 flex -translate-x-1/2 items-center"
          >
            {/* The same row as the one above, drawn in paper instead of ink, so
                the line under the one you are reading is the same line, erased
                and drawn again the same way. The space between the two is the
                width of the gap, which comes down through it. */}
            <SlidingNav
              items={LEGAL_ITEMS}
              activeId={sub}
              reversed
              gap={standing === null ? 30 : notch.width + 14}
            />
          </div>
        ) : null}
      </main>
    </div>
  );
}
