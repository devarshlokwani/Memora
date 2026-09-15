"use client";

import { useEffect, useRef, useState } from "react";

import { drawnRectPath, sketchTilt } from "@/lib/sketch";

/**
 * A card outline drawn as a path, because a CSS corner is always perfectly
 * regular and this needs to look like a pen went round it.
 *
 * The path is built at the card's real pixel size rather than stretched from a
 * fixed viewBox: stretching turns the corners into long ellipses on a tall card
 * and the drawn line ends up crossing its own content. Measuring means corners
 * and wobble stay the same size whatever shape the card is.
 */

const INSET = 2;

export function SketchFrame({
  seed,
  filled = true,
  invert = false,
  dashed = false,
  stroke,
  strokeWidth = 1.5,
}: {
  seed: string;
  /** Cards are filled; frames used purely as an outline are not. */
  filled?: boolean;
  /** Ink card, paper line, the other half of an alternating stack. */
  invert?: boolean;
  /** A pencilled-in edge, for something provisional or not yet chosen. */
  dashed?: boolean;
  stroke?: string;
  strokeWidth?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  // The server and the first client render agree on this default, so hydration
  // matches; the observer then refines it to the real size.
  const [size, setSize] = useState({ width: 600, height: 380 });

  useEffect(() => {
    const node = ref.current?.parentElement;
    if (!node) return;

    const measure = () => {
      const box = node.getBoundingClientRect();
      if (box.width > 0 && box.height > 0) {
        setSize({ width: Math.round(box.width), height: Math.round(box.height) });
      }
    };

    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={ref} className="pointer-events-none absolute inset-0" aria-hidden="true">
      <svg
        viewBox={`0 0 ${size.width} ${size.height}`}
        width="100%"
        height="100%"
        className="overflow-visible"
      >
        <g transform={`translate(${INSET} ${INSET})`}>
          <path
            d={drawnRectPath(size.width - INSET * 2, size.height - INSET * 2, seed)}
            fill={filled ? (invert ? "var(--color-ink)" : "var(--color-card)") : "none"}
            stroke={stroke ?? (invert ? "var(--color-paper)" : "var(--color-ink)")}
            strokeWidth={strokeWidth}
            strokeDasharray={dashed ? "7 7" : undefined}
            strokeLinejoin="round"
            strokeLinecap="round"
          />
        </g>
      </svg>
    </div>
  );
}

/** A card: drawn outline behind, content in front, resting at a slight angle. */
export function SketchCard({
  seed,
  children,
  className = "",
  filled = true,
  invert = false,
  dashed = false,
  stroke,
  tilt = true,
}: {
  seed: string;
  children: React.ReactNode;
  className?: string;
  filled?: boolean;
  invert?: boolean;
  dashed?: boolean;
  stroke?: string;
  /** Off for anything in a row that has to line up with its neighbours. */
  tilt?: boolean;
}) {
  return (
    <div
      className={`relative ${className}`}
      style={tilt ? { transform: `rotate(${sketchTilt(seed)})` } : undefined}
    >
      <SketchFrame seed={seed} filled={filled} invert={invert} dashed={dashed} stroke={stroke} />
      <div className="relative">{children}</div>
    </div>
  );
}
