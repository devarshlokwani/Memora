"use client";

import gsap from "gsap";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";

import { Logo } from "@/components/layout/Logo";
import { SlidingNav, type NavItem } from "@/components/layout/SlidingNav";
import { NotchPanel } from "@/components/landing/NotchPanel";
import { EASE, prefersReducedMotion } from "@/lib/motion";

/** How much wider the gap is than the nav item it sits under. */
const NOTCH_PADDING = 22;

export type SectionId = "try" | "how" | "formats";

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

  // Clicking the nav is local state plus a URL rewrite, not a navigation: the
  // section should change instantly rather than waiting on the router.
  const choose = useCallback((id: SectionId) => {
    setActive(id);
    window.history.replaceState(null, "", `?s=${id}`);
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
      {/* Solid, never translucent: the gap in the panel below reveals this exact
          colour, and anything see-through would make the cut look like a mistake
          rather than one surface with a bite out of it. */}
      <header className="sticky top-0 z-50 bg-paper">
        <div className="relative mx-auto max-w-6xl px-6 py-4">
          <div className="flex items-center justify-between md:hidden">
            <Link href="/" aria-label="Memora home">
              <Logo />
            </Link>
            <Link
              href="/signup"
              className="rounded-full bg-ink px-5 py-2 text-[0.9rem] font-medium text-paper"
            >
              Get started
            </Link>
          </div>

          <div className="hidden items-center justify-center md:flex">
            <SlidingNav
              items={ITEMS}
              activeId={active}
              splitAt={2}
              onSelectedRect={placeNotch}
              onSelect={(id) => {
                if (id !== "signin") choose(id as SectionId);
              }}
              center={
                <Link href="/" aria-label="Memora home" className="px-2">
                  <Logo />
                </Link>
              }
            />
          </div>

          <div className="absolute right-6 top-1/2 hidden -translate-y-1/2 md:block">
            <Link
              href="/signup"
              className="rounded-full bg-ink px-5 py-2 text-[0.9rem] font-medium text-paper transition-opacity hover:opacity-90"
            >
              Get started
            </Link>
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
