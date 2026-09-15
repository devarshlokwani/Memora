"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";

import portrait from "@/assets/grey_portrait.jpg";
import { drawnCirclePath } from "@/lib/sketch";

/**
 * The photograph, cut to a circle and framed by hand.
 *
 * Two rings: one in ink round the picture, and a second in mahogany sitting
 * slightly off register behind it, the same second pass of the pen the cards
 * use, which is what stops a perfect circle looking stamped out.
 *
 * The paths are built at the frame's real pixel size rather than stretched from
 * a fixed viewBox, so the wobble stays the same weight whatever size it renders.
 */
export function Portrait({ className = "" }: { className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  // Server and first client render agree on this; the observer then corrects it.
  const [size, setSize] = useState(360);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    const measure = () => {
      const width = Math.round(node.getBoundingClientRect().width);
      if (width > 0) setSize(width);
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={ref} className={`relative aspect-square w-full ${className}`}>
      <svg
        viewBox={`0 0 ${size} ${size}`}
        aria-hidden="true"
        className="absolute inset-0 h-full w-full overflow-visible"
      >
        <g transform="translate(7 9)">
          <path
            d={drawnCirclePath(size, "portrait-echo", 2.6)}
            fill="none"
            stroke="var(--color-accent)"
            strokeWidth="1.6"
            strokeLinecap="round"
            opacity="0.5"
          />
        </g>
      </svg>

      <div className="absolute inset-[4%] overflow-hidden rounded-full bg-card">
        <Image
          src={portrait}
          alt="Devarsh Lokwani"
          placeholder="blur"
          sizes="(min-width: 1024px) 24rem, 60vw"
          className="h-full w-full object-cover object-top"
        />
      </div>

      <svg
        viewBox={`0 0 ${size} ${size}`}
        aria-hidden="true"
        className="absolute inset-0 h-full w-full overflow-visible"
      >
        <path
          d={drawnCirclePath(size, "portrait-ring")}
          fill="none"
          stroke="var(--color-ink)"
          strokeWidth="1.8"
          strokeLinecap="round"
        />
      </svg>
    </div>
  );
}
