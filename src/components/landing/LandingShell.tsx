"use client";

import gsap from "gsap";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";

import { Logo } from "@/components/layout/Logo";
import { NavRow } from "@/components/layout/NavRow";
import { type NavItem } from "@/components/layout/SlidingNav";
import { BottomNav } from "@/components/layout/BottomNav";
import { HeroStory } from "@/components/landing/HeroStory";
import { NotchPanel } from "@/components/landing/NotchPanel";
import { EASE, prefersReducedMotion } from "@/lib/motion";

/** How much wider the gap is than the nav item it sits under. */
const NOTCH_PADDING = 22;

export type SectionId = "hero" | "try" | "how" | "formats";

/* The wordmark is a nav item like any other, sitting in the middle of the row:
   it opens the story that introduces Memora, and the gap in the panel tracks it
   the same way it tracks the rest. It carries no underline — a drawn line under
   the wordmark reads as a mistake rather than as a selection — so the gap alone
   says it is the one you are on.

   Sign in rides in the cluster too, so the row stays balanced around the middle.
   Only the call to action sits out on the right. */
const ITEMS: NavItem[] = [
  { id: "try", label: "Try a card", href: "/?s=try" },
  { id: "how", label: "How it works", href: "/?s=how" },
  { id: "hero", label: "Memora", href: "/?s=hero", node: <Logo />, marked: false },
  { id: "formats", label: "Formats", href: "/?s=formats" },
  { id: "signin", label: "Sign in", href: "/login" },
];

export function LandingShell({
  sections,
}: {
  /** The story is not one of these — the shell renders it itself. */
  sections: Record<Exclude<SectionId, "hero">, React.ReactNode>;
}) {
  const [active, setActive] = useState<SectionId>("try");
  const [notch, setNotch] = useState<{ centre: number | null; width: number }>({
    centre: null,
    width: 0,
  });
  /** The story has been read to the end and the way onward can be offered. */
  const [storyEnded, setStoryEnded] = useState(false);

  const panelRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const frameRef = useRef<HTMLDivElement>(null);
  const firstPaint = useRef(true);

  // The section lives in ?s= so a link from anywhere else on the site opens on
  // the right one. A hash cannot do this job: Next navigates with pushState,
  // which never fires hashchange, so a footer link would quietly do nothing.
  const params = useSearchParams();
  useEffect(() => {
    const id = params.get("s");
    if (id === "hero" || id === "try" || id === "how" || id === "formats") setActive(id);
  }, [params]);

  /* The story is the whole page while it is running: a footer sitting under it
     ends the scroll early, and the closing line and the bar that arrives with
     it land on a page that has already moved on. Marked on the body rather than
     passed down, because the footer is mounted by the root layout — this is a
     mode the page is in, not a prop it can hand over. */
  useEffect(() => {
    document.body.dataset.story = active === "hero" ? "on" : "";
    return () => {
      document.body.dataset.story = "";
    };
  }, [active]);

  /**
   * Clicking the nav is local state plus a URL rewrite, not a navigation — the
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

  // Nav rects arrive in viewport coordinates; the gap needs them relative to
  // the panel, which is a different box and can be scrolled.
  const placeNotch = useCallback((rect: DOMRect | null) => {
    const panel = panelRef.current;
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
          directly beneath it, so the two have to scroll together — a nav that
          follows you leaves its own notch behind. Solid, never translucent: the
          gap reveals this exact colour. */}
      <header className="relative z-50 bg-paper">
        <NavRow
          items={ITEMS}
          activeId={active}
          onSelectedRect={placeNotch}
          onSelect={(id) => {
            // Sign in leaves the page; it should not also swap the panel.
            if (id !== "signin") choose(id as SectionId);
          }}
        />
      </header>

      {/* Phone: tabs sit under the wordmark, where the nav links cannot fit. */}
      <div className="flex gap-5 px-6 pb-3 text-sm md:hidden">
        {ITEMS.filter((i) => i.id !== "signin").map((item) => (
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
            <NotchPanel notchCentre={notch.centre} notchWidth={notch.width}>
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
          underneath changes section — inside the story it was unmounted the
          moment the new section arrived, mid-flight. */}
      <BottomNav
        items={ITEMS}
        activeId={active}
        shown={active === "hero" && storyEnded}
        onSelect={(id) => {
          if (id !== "signin") choose(id as SectionId);
        }}
      />
    </div>
  );
}
