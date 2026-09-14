"use client";

import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useLayoutEffect, useRef } from "react";

import { prefersReducedMotion } from "@/lib/motion";

gsap.registerPlugin(ScrollTrigger);

/**
 * A phrase with a line drawn under it, left to right, as though someone had just
 * underlined it. `pathLength="100"` normalises the path so the dash can be set
 * in plain percentages however wide the phrase happens to be.
 *
 * It resets when you scroll past and draws again on the way back, so the mark is
 * something that happens rather than something that is simply there.
 */
export function Marked({ children }: { children: React.ReactNode }) {
  const hostRef = useRef<HTMLSpanElement>(null);
  const pathRef = useRef<SVGPathElement>(null);

  useLayoutEffect(() => {
    const host = hostRef.current;
    const path = pathRef.current;
    if (!host || !path) return;

    if (prefersReducedMotion()) {
      gsap.set(path, { strokeDashoffset: 0 });
      return;
    }

    const context = gsap.context(() => {
      gsap.set(path, { strokeDasharray: 100, strokeDashoffset: 100 });
      gsap.to(path, {
        strokeDashoffset: 0,
        duration: 0.75,
        ease: "power2.out",
        delay: 0.15,
        scrollTrigger: {
          trigger: host,
          start: "top 92%",
          // onEnter, onLeave, onEnterBack, onLeaveBack. Resetting on leave is
          // the point: scroll the heading off the top and the line is unmarked
          // again, so it redraws every time you come back to it.
          toggleActions: "play reset play reset",
        },
      });
    }, host);

    return () => context.revert();
  }, []);

  return (
    <span ref={hostRef} className="relative inline-block whitespace-nowrap">
      {children}
      <svg
        viewBox="0 0 200 12"
        preserveAspectRatio="none"
        aria-hidden="true"
        className="absolute inset-x-[-0.06em] bottom-[-0.1em] h-[0.3em] w-[calc(100%+0.12em)] overflow-visible"
      >
        <path
          ref={pathRef}
          d="M3 8.2C41 3.4 74 10.6 106 6 138 1.6 168 8.6 197 4"
          pathLength={100}
          fill="none"
          stroke="var(--color-accent)"
          strokeWidth="3.4"
          strokeLinecap="round"
          vectorEffect="non-scaling-stroke"
        />
      </svg>
    </span>
  );
}
