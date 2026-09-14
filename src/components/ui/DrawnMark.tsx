"use client";

import gsap from "gsap";
import { useLayoutEffect, useRef } from "react";

import { prefersReducedMotion } from "@/lib/motion";

/**
 * A tick or a cross that draws itself, stroke by stroke, the way you would mark
 * a page. The cross draws its two strokes in sequence rather than together —
 * both at once looks like a shape appearing, one after the other looks like a
 * hand.
 */
export function DrawnMark({
  type,
  className = "h-12 w-12",
  colour,
}: {
  type: "knew" | "missed";
  className?: string;
  /** Overrides the red/green pair — the score table draws these in ink. */
  colour?: string;
}) {
  const ref = useRef<SVGSVGElement>(null);

  useLayoutEffect(() => {
    const svg = ref.current;
    if (!svg) return;

    const strokes = svg.querySelectorAll<SVGPathElement>("path");
    if (prefersReducedMotion()) {
      gsap.set(strokes, { strokeDashoffset: 0 });
      return;
    }

    const context = gsap.context(() => {
      gsap.set(strokes, { strokeDasharray: 100, strokeDashoffset: 100 });
      gsap.to(strokes, {
        strokeDashoffset: 0,
        duration: 0.32,
        ease: "power2.out",
        stagger: 0.13,
      });
    }, svg);

    return () => context.revert();
  }, [type]);

  const stroke = colour ?? (type === "knew" ? "var(--color-knew)" : "var(--color-missed)");

  return (
    <svg
      ref={ref}
      viewBox="0 0 24 24"
      fill="none"
      stroke={stroke}
      strokeWidth="2.4"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={className}
    >
      {type === "knew" ? (
        <path d="M3.5 13.2c2.6 1.5 4.4 3.4 5.8 6 2.6-6.4 6.3-11 11.4-14.3" pathLength={100} />
      ) : (
        <>
          <path d="M5.4 5c3.9 4.2 8.4 9.2 13.4 14.2" pathLength={100} />
          <path d="M18.6 5.4c-4 4.1-8.6 9.1-13.3 13.9" pathLength={100} />
        </>
      )}
    </svg>
  );
}
