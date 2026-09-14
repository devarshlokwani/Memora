"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { Logo } from "@/components/Logo";
import { SlidingNav, type NavItem } from "@/components/SlidingNav";

/** Section links either side of the wordmark, the way the reference sets it out. */
// Ordered the way the page is, so the mark travels left to right as you scroll.
const ITEMS: NavItem[] = [
  { id: "try", label: "Try a card", href: "#try" },
  { id: "how", label: "How it works", href: "#how" },
  { id: "formats", label: "Formats", href: "#formats" },
  { id: "signin", label: "Sign in", href: "/login" },
];

export function SiteNav() {
  const [active, setActive] = useState<string | null>(null);

  // The mark rests on whichever section is actually on screen, so it reads as
  // "you are here" rather than just "you clicked this".
  useEffect(() => {
    const sections = ITEMS.filter((i) => i.href.startsWith("#"))
      .map((i) => document.getElementById(i.id))
      .filter((el): el is HTMLElement => el !== null);
    if (sections.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const onScreen = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (onScreen) setActive(onScreen.target.id);
      },
      { rootMargin: "-45% 0px -45% 0px", threshold: [0, 0.25, 0.5, 1] },
    );

    for (const section of sections) observer.observe(section);
    return () => observer.disconnect();
  }, []);

  return (
    <header className="sticky top-0 z-50 bg-paper/85 backdrop-blur-sm">
      <div className="relative mx-auto max-w-6xl px-6 py-4">
        {/* Phone: wordmark left, one action right. The section links need room. */}
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
  );
}
