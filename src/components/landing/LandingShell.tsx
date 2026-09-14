"use client";

import gsap from "gsap";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";

import { Logo } from "@/components/layout/Logo";
import { SlidingNav, type NavItem } from "@/components/layout/SlidingNav";
import { NotchPanel } from "@/components/landing/NotchPanel";
import { PushButton } from "@/components/ui/PushButton";
import { EASE, prefersReducedMotion } from "@/lib/motion";

/** How much wider the gap is than the nav item it sits under. */
const NOTCH_PADDING = 22;

export type SectionId = "try" | "how" | "formats";

// Sign in rides in the centred cluster with the rest, so the nav stays balanced
// around the wordmark. Only the call to action sits out on the right.
const ITEMS: NavItem[] = [
  { id: "try", label: "Try a card", href: "/?s=try" },
  { id: "how", label: "How it works", href: "/?s=how" },
  { id: "formats", label: "Formats", href: "/?s=formats" },
  { id: "signin", label: "Sign in", href: "/login" },
];

export function LandingShell({
  sections,
}: {
  sections: Record<SectionId, React.ReactNode>;
}) {
  const [active, setActive] = useState<SectionId>("try");
  const [notch, setNotch] = useState<{ centre: number | null; width: number }>({
    centre: null,
    width: 0,
  });

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
    if (id === "try" || id === "how" || id === "formats") setActive(id);
  }, [params]);

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
        <div className="relative mx-auto max-w-6xl px-6 py-4">
          <div className="flex items-center justify-between md:hidden">
            <Link href="/" aria-label="Memora home">
              <Logo />
            </Link>
            <PushButton href="/signup" size="sm">
              Get started
            </PushButton>
          </div>

          <div className="hidden items-center justify-center md:flex">
            <SlidingNav
              items={ITEMS}
              activeId={active}
              splitAt={2}
              onSelectedRect={placeNotch}
              onSelect={(id) => {
                // Sign in leaves the page; it should not also swap the panel.
                if (id !== "signin") choose(id as SectionId);
              }}
              center={
                <Link href="/" aria-label="Memora home" className="px-2">
                  <Logo />
                </Link>
              }
            />
          </div>

          <div className="absolute right-6 top-1/2 hidden -translate-y-1/2 items-center gap-4 md:flex">
            <PushButton href="/signup" size="sm">
              Get started
            </PushButton>
          </div>
        </div>
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

    </div>
  );
}
