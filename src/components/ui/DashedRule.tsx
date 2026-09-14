"use client";

import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useLayoutEffect, useRef } from "react";

import { prefersReducedMotion } from "@/lib/motion";

gsap.registerPlugin(ScrollTrigger);

/**
 * A ruled line between two parts of a section, dashed and slightly bowed so it
 * belongs to the same hand as everything else on the page.
 *
 * It wipes in from the left when you reach it. The reveal is a clip rather than
 * a dash offset: the dashes are already the stroke pattern, so animating the
 * offset would march them sideways instead of drawing the line.
 */
export function DashedRule({
  className = "",
  colour = "var(--color-guide-strong)",
}: {
  className?: string;
  colour?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const host = ref.current;
    if (!host || prefersReducedMotion()) return;

    const context = gsap.context(() => {
      gsap.fromTo(
        host,
        { clipPath: "inset(0 100% 0 0)" },
        {
          clipPath: "inset(0 0% 0 0)",
          duration: 0.9,
          ease: "power2.out",
          scrollTrigger: {
            trigger: host,
            start: "top 94%",
            toggleActions: "play reset play reset",
          },
        },
      );
    }, host);

    return () => context.revert();
  }, []);

  return (
    <div ref={ref} aria-hidden="true" className={`w-full ${className}`}>
      <svg viewBox="0 0 800 6" preserveAspectRatio="none" className="h-1.5 w-full overflow-visible">
        <path
          d="M0 3.2C190 1.8 420 4.4 610 2.8 690 2.2 750 3.6 800 3"
          fill="none"
          stroke={colour}
          strokeWidth="1.4"
          strokeDasharray="7 8"
          strokeLinecap="round"
          vectorEffect="non-scaling-stroke"
        />
      </svg>
    </div>
  );
}
