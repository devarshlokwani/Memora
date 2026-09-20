"use client";

import gsap from "gsap";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";

import { NavRow } from "@/components/layout/NavRow";
import { NAV_ITEMS, rememberNav } from "@/components/layout/navItems";
import { useRouteCurtain } from "@/components/layout/RouteCurtain";
import { BottomNav } from "@/components/layout/BottomNav";
import { HeroStory } from "@/components/landing/HeroStory";
import { NotchPanel } from "@/components/landing/NotchPanel";
import { EASE, prefersReducedMotion } from "@/lib/motion";
import { NOTCH_HANDOVER, NOTCH_PADDING, NOTCH_WALK } from "@/lib/notch";

export type SectionId = "hero" | "try" | "how" | "formats";

/** Whether a value out of the address bar names a section we have. */
function readable(id: string | null): id is SectionId {
  return id === "hero" || id === "try" || id === "how" || id === "formats";
}

/** Everything the sweep can arrive at. The story is what it leaves. */
type Landing = Exclude<SectionId, "hero">;


export function LandingShell({
  sections,
}: {
  /** The story is not one of these. The shell renders it itself. */
  sections: Record<Exclude<SectionId, "hero">, React.ReactNode>;
}) {
  /* The story, not a section.

     Arriving at the site should be the scroll that introduces Memora: it is
     the thing the wordmark in the middle of the row points at, and the only
     part of the page that explains what this is before asking anything. The
     three sections are what you go to once it has. Opening on one of them put
     the argument after the evidence and left the story as something you had to
     go looking for.

     It is also the section the page prerenders as, since nothing has read the
     address bar yet at that point, so the first painted frame of a bare visit
     to `/` is already the right one. */
  const [active, setActive] = useState<SectionId>("hero");
  const [notch, setNotch] = useState<{ centre: number | null; width: number }>({
    centre: null,
    width: 0,
  });
  /** The story has been read to the end and the way onward can be offered. */
  const [storyEnded, setStoryEnded] = useState(false);
  /* The nav's highlight and the section on screen are the same thing except
     during a sweep, where the nav has already arrived and the page has not, and
     on the way to the waitlist, where the highlight goes on ahead to a page
     this component does not own. */
  const [navActive, setNavActive] = useState<SectionId | "waitlist">("hero");
  /** Set while the gap is walking to an item that lives on another page. */
  const [handing, setHanding] = useState(false);
  const [curtain, setCurtain] = useState(false);
  /* Whether the section in the address bar has been read yet.
     
     Until it has, the nav is told it has no selected item at all, and so it
     reports no position and the panel cuts no gap. The order of a mount is why:
     the nav settles, and reports, before this component gets its turn to correct
     the section from ?s=. Left to itself it would report the section the state
     happens to start on, the panel would take that as where the gap has always
     been, and correcting it a frame later would be an animation, which is the
     gap sliding across the nav every time anyone arrived here from elsewhere on
     the site. Nothing to slide from, and it is simply in the right place. */
  const [settled, setSettled] = useState(false);
  /** Sweeps to another route the way `startSweep` sweeps between sections. */
  const cross = useRouteCurtain();
  const router = useRouter();
  const barRef = useRef<HTMLDivElement>(null);
  const barItem = useRef<DOMRect | null>(null);
  /** The last box the nav gave us, kept so the gap can be placed again
      when the panel under it changes shape rather than the nav above it. */
  const navItem = useRef<DOMRect | null>(null);
  const barNotchRef = useRef<SVGSVGElement>(null);
  const panelNotchRef = useRef<SVGSVGElement>(null);

  const panelRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const frameRef = useRef<HTMLDivElement>(null);
  const firstPaint = useRef(true);

  /* The section lives in ?s= so a link from anywhere else on the site opens on
     the right one. A hash cannot do this job: Next navigates with pushState,
     which never fires hashchange, so a footer link would quietly do nothing. */
  const params = useSearchParams();
  useEffect(() => {
    const id = params.get("s");
    if (readable(id)) {
      setActive(id);
      setNavActive(id);
    }
  }, [params]);

  /* The same question asked once more, on the way in, of the address bar
     itself rather than of the hook.

     The hook hands back nothing at all until after hydration, which is by
     design: the page is prerendered, and a prerender has no query string to
     read. So the first painted frame of every arrival here was whatever the
     state happens to start on, and the section, the nav mark and the gap under
     it all corrected themselves a frame later. The gap sliding across the nav
     from the wrong item is what that looked like. The address bar knows, and a
     layout effect is before the paint and only ever on the client, so asking it
     there costs nothing and settles the page before it is seen. */
  useLayoutEffect(() => {
    const id = new URLSearchParams(window.location.search).get("s");
    if (readable(id)) {
      setActive(id);
      setNavActive(id);
    }
    setSettled(true);
  }, []);

  /* So the small print can leave the gap where it found it. Written on every
     change rather than on the way out, because there is no way out to hook:
     you leave this page by following a link in a footer. */
  useEffect(() => {
    rememberNav(navActive);
  }, [navActive]);

  /**
   * Picking the waitlist, which is in the row but not on this page.
   *
   * The gap walks to it here and the page changes once it has arrived, so the
   * panel on the other side can set the gap down where this one left it. Left
   * to itself the link simply went, and the gap was cut afresh under the
   * waitlist on arrival: the one item in the row that did not slide.
   */
  const handOver = useCallback(
    (href: string) => {
      if (handing || prefersReducedMotion() || notch.centre === null) return false;
      setHanding(true);
      setNavActive("waitlist");
      window.setTimeout(() => router.push(href), NOTCH_HANDOVER);
      return true;
    },
    [handing, notch.centre, router],
  );

  /* The story is the whole page while it is running: a footer sitting under it
     ends the scroll early, and the closing line and the bar that arrives with
     it land on a page that has already moved on. Marked on the body rather than
     passed down, because the footer is mounted by the root layout. This is a
     mode the page is in, not a prop it can hand over. */
  useEffect(() => {
    if (active === "hero") {
      document.body.dataset.story = "on";
      return;
    }

    /* Letting the footer back in means laying out the whole of it (a portrait,
       a wordmark and a second canvas) and at the end of a sweep that lands in
       the same frame as everything else. It is a long way below the fold by
       then, so it can wait for the dust to settle. */
    const id = window.setTimeout(() => {
      document.body.dataset.story = "";
    }, 320);
    return () => window.clearTimeout(id);
  }, [active]);

  /* And taken off again on the way out, whatever the way out was.

     The mark is on the body, so it outlives this component, and the effect above
     only ever clears it when the section changes. Leaving the story for another
     page altogether, which is what the bar at the foot of it offers, unmounts
     this without the section changing at all: the mark stayed behind, and the
     waitlist arrived with its footer still hidden by a story that was over. */
  useEffect(
    () => () => {
      document.body.dataset.story = "";
    },
    [],
  );

  /**
   * Clicking the nav is local state plus a URL rewrite, not a navigation. The
   * section should change instantly rather than waiting on the router.
   *
   * It goes back to the top first. The gap in the panel is cut directly beneath
   * the nav, so changing section from halfway down the page moves a notch you
   * cannot see and leaves the nav sitting on a plain edge.
   */
  const choose = useCallback((id: SectionId) => {
    window.history.replaceState(null, "", `?s=${id}`);

    const scrolled = window.scrollY > 8;
    if (!scrolled || prefersReducedMotion()) {
      window.scrollTo({ top: 0, behavior: "auto" });
      setActive(id);
      return;
    }

    window.scrollTo({ top: 0, behavior: "smooth" });
    // Long enough to be back under the nav, short enough not to feel like a wait.
    window.setTimeout(() => setActive(id), 260);
  }, []);

  /**
   * Leaving the story: the bar grows up the screen until it covers everything,
   * changes the page behind itself, then shrinks away to the top and becomes
   * the header.
   *
   * Earlier versions wiped the story away with the bar as the moving edge, which
   * meant the arriving section had to be on screen while it was still arriving.
   * Whatever it did on its way in (a drawn mark filling, a rule wiping across)
   * happened in front of the reader and read as the page loading a second time.
   * Nothing gets rid of that, because mounting a page is mounting a page. So the
   * page is mounted behind a panel that covers the window instead, and none of
   * it is ever seen.
   *
   * It is the same bar throughout: it elongates, holds the nav in the middle of
   * the screen while the change happens, and settles into the top. Never a
   * second element pretending to be it.
   */
  const startSweep = useCallback((id: Landing) => {
    setNavActive(id);

    const bar = barRef.current;
    const land = () => {
      setActive(id);
      window.history.replaceState(null, "", `?s=${id}`);
      window.scrollTo({ top: 0, behavior: "auto" });
    };

    if (!bar || prefersReducedMotion()) {
      land();
      return;
    }

    const height = bar.getBoundingClientRect().height;
    setCurtain(true);

    const timeline = gsap.timeline({
      onComplete: () => {
        /* Hidden before it is put back, so the jump from the top of the window
             to its parking place below the bottom never draws. The real header
             is directly underneath by then and identical, so there is nothing to
             see at the handover. */
        gsap.set(bar, { autoAlpha: 0 });
        gsap.set(bar, {
          clearProps: "top,bottom,height",
          y: 0,
          yPercent: 190,
          autoAlpha: 1,
        });
        if (barNotchRef.current) gsap.set(barNotchRef.current, { scaleY: 1 });
        setCurtain(false);
      },
    });

    // Up the window from the foot of it, taking the nav row to the middle.
    timeline.to(bar, { height: window.innerHeight, duration: 0.5, ease: "power3.inOut" });
    // Its bump belongs to a bar, not to a full screen.
    if (barNotchRef.current) {
      timeline.to(
        barNotchRef.current,
        { scaleY: 0, duration: 0.3, ease: "power2.in", transformOrigin: "50% 100%" },
        0,
      );
    }

    timeline.call(() => {
      land();
      // Re-hung from the top, so shrinking pulls it up rather than down. It
      // fills the window either way, so nothing moves.
      gsap.set(bar, { top: 0, bottom: "auto" });
    });

    // A breath at full cover for the new page to put itself together.
    timeline.to(bar, { height, duration: 0.55, ease: "power3.inOut" }, "+=0.22");

    // The gap under the arriving item opens as the panel comes into view.
    timeline.to(
      {},
      {
        duration: 0.45,
        onStart: () => {
          const notchEl = panelNotchRef.current;
          if (notchEl) gsap.set(notchEl, { scaleY: 0, transformOrigin: "50% 0%" });
        },
        onUpdate() {
          const notchEl = panelNotchRef.current;
          if (notchEl) gsap.set(notchEl, { scaleY: this.progress() });
        },
        onComplete: () => {
          const notchEl = panelNotchRef.current;
          if (notchEl) gsap.set(notchEl, { scaleY: 1 });
        },
      },
      "<",
    );
  }, []);

  // Nav rects arrive in viewport coordinates; the gap needs them relative to
  // the panel, which is a different box and can be scrolled.
  const place = useCallback(() => {
    const panel = panelRef.current;
    const rect = navItem.current;
    if (!panel || !rect) {
      setNotch({ centre: null, width: 0 });
      return;
    }
    const panelBox = panel.getBoundingClientRect();
    setNotch({
      centre: rect.left + rect.width / 2 - panelBox.left,
      width: rect.width + NOTCH_PADDING,
    });
  }, []);

  const placeNotch = useCallback(
    (rect: DOMRect | null) => {
      navItem.current = rect;
      place();
    },
    [place],
  );

  /* The story's panel runs the full width of the page and a section's panel is
     centred inside it, so leaving the story slides the panel sideways underneath
     a gap that was measured against the other one. The nav itself has not moved
     and so will not report again: work it out here instead. It happens behind
     the curtain, which is the only reason the gap is allowed to travel. */
  useLayoutEffect(() => {
    place();
  }, [active, place]);

  // Swapping sections changes the panel's height. Left alone it jumps, which
  // undoes the sense that the gap and the panel are one moving object.
  useLayoutEffect(() => {
    const frame = frameRef.current;
    const content = contentRef.current;
    if (!frame || !content) return;

    const height = content.offsetHeight;

    if (firstPaint.current || prefersReducedMotion()) {
      gsap.set(frame, { height });
      gsap.set(content, { opacity: 1, y: 0 });
      firstPaint.current = false;
    } else {
      gsap.to(frame, { height, duration: 0.55, ease: EASE });
      gsap.fromTo(
        content,
        { opacity: 0, y: 14 },
        { opacity: 1, y: 0, duration: 0.45, ease: EASE, delay: 0.08 },
      );
    }

    // Keep the frame honest if the content reflows (resize, fonts, wrapping).
    const observer = new ResizeObserver(() => {
      gsap.set(frame, { height: content.offsetHeight });
    });
    observer.observe(content);
    return () => observer.disconnect();
  }, [active]);

  return (
    <div className="flex flex-1 flex-col">
      {/* Fixed to the top of the page rather than the viewport. The gap is cut
          directly beneath it, so the two have to scroll together. A nav that
          follows you leaves its own notch behind. Solid, never translucent: the
          gap reveals this exact colour. */}
      <header className="relative z-50 bg-paper">
        <NavRow
          items={NAV_ITEMS}
          activeId={settled ? navActive : null}
          onSelectedRect={placeNotch}
          onSelect={(id) => {
            /* The waitlist is a page, not a section, so it gets the handover
               rather than a section swap. Not the full-screen slide: that one
               belongs to the bar at the foot of the story, where you have read
               the whole thing and are being shown the way on. From up here it
               would be a wipe across the window in front of somebody who has
               not scrolled anywhere yet. */
            if (id === "waitlist") return handOver("/waitlist");
            setNavActive(id as SectionId);
            choose(id as SectionId);
            return true;
          }}
        />
      </header>

      {/* Phone: tabs sit under the wordmark, where the nav links cannot fit. */}
      <div className="flex gap-5 px-6 pb-3 text-sm md:hidden">
        {NAV_ITEMS.filter((i) => i.id !== "hero" && i.id !== "waitlist").map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => choose(item.id as SectionId)}
            className={active === item.id ? "font-medium text-ink" : "text-ink-soft"}
          >
            {item.label}
          </button>
        ))}
      </div>

      {/* The story runs full width and outside the panel. It has to: the panel
          clips its overflow to animate its own height, and a sticky stage inside
          anything that clips has nothing left to stick to. */}
      {active === "hero" ? (
        <main>
          {/* Wrapped in the panel too, so the gap under the wordmark is cut here
              exactly as it is cut under every other section. The panel paints
              only that gap and clips nothing, so the stage inside can still
              stick. */}
          <div ref={panelRef}>
            <NotchPanel notchCentre={notch.centre} notchWidth={notch.width}>
              <HeroStory onEnd={setStoryEnded} />
            </NotchPanel>
          </div>
        </main>
      ) : (
        <main className="px-4 pb-20 sm:px-6">
          {/* The ref must sit on the centred panel itself: measuring the full-width
              wrapper would offset the gap by half the leftover margin. */}
          <div ref={panelRef} className="mx-auto max-w-6xl">
            <NotchPanel
              notchRef={panelNotchRef}
              notchCentre={notch.centre}
              notchWidth={notch.width}
              /* Quicker only on the way to another page, where the page is
                 being held until the gap arrives. Between sections it keeps the
                 pace of the site, because nothing is waiting on it. */
              travel={handing ? NOTCH_WALK : undefined}
            >
              <div ref={frameRef} className="overflow-hidden">
                <div ref={contentRef} key={active} className="px-6 py-14 sm:px-10 sm:py-16">
                  {sections[active]}
                </div>
              </div>
            </NotchPanel>
          </div>
        </main>
      )}

      {/* Rendered by the shell rather than by the story, so that picking
          something from it can fly it up to the top bar's place while the page
          underneath changes section. Inside the story it was unmounted the
          moment the new section arrived, mid-flight. */}
      <BottomNav
        items={NAV_ITEMS}
        activeId={navActive}
        barRef={barRef}
        notchRef={barNotchRef}
        sweeping={curtain}
        shown={active === "hero" && storyEnded}
        onSelectedRect={(rect) => {
          barItem.current = rect;
        }}
        onSelect={(id) => {
          if (id === "waitlist") {
            if (!cross) return false;
            cross("/waitlist", "waitlist");
            return true;
          }
          // The wordmark in this bar is the story you are already reading, so
          // it takes you back to the top of it rather than sweeping anywhere.
          if (id === "hero") {
            window.scrollTo({ top: 0, behavior: "smooth" });
            return true;
          }
          startSweep(id as Landing);
          return true;
        }}
      />
    </div>
  );
}
