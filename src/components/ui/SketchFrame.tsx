"use client";

import { useEffect, useRef, useState } from "react";

import { sketchTilt } from "@/lib/sketch";

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
const WOBBLE = 3.2;

function seeded(seed: string) {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return () => {
    h += 0x6d2b79f5;
    let t = h;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** A rectangle with rounded corners and edges that drift off true, like a drawn one. */
function drawnRect(width: number, height: number, seed: string) {
  const rand = seeded(seed);
  const jitter = () => (rand() - 0.5) * 2 * WOBBLE;

  const w = Math.max(width - INSET * 2, 20);
  const h = Math.max(height - INSET * 2, 20);
  // Corners stay a fixed size so a tall card does not get long oval ends.
  const r = Math.min(26, w * 0.12, h * 0.12);

  return [
    `M ${r} ${jitter()}`,
    `C ${w * 0.3} ${jitter()} ${w * 0.7} ${jitter()} ${w - r} ${jitter()}`,
    `Q ${w + jitter() * 0.4} ${jitter() * 0.4} ${w + jitter() * 0.3} ${r}`,
    `C ${w + jitter()} ${h * 0.35} ${w + jitter()} ${h * 0.65} ${w} ${h - r}`,
    `Q ${w} ${h} ${w - r} ${h + jitter() * 0.4}`,
    `C ${w * 0.7} ${h + jitter()} ${w * 0.3} ${h + jitter()} ${r} ${h}`,
    `Q ${jitter() * 0.4} ${h} ${jitter() * 0.3} ${h - r}`,
    `C ${jitter()} ${h * 0.65} ${jitter()} ${h * 0.35} 0 ${r}`,
    `Q 0 ${jitter() * 0.4} ${r} ${jitter()}`,
    "Z",
  ].join(" ");
}

export function SketchFrame({
  seed,
  filled = true,
  invert = false,
  strokeWidth = 1.5,
}: {
  seed: string;
  /** Cards are filled; frames used purely as an outline are not. */
  filled?: boolean;
  /** Ink card, paper line — the other half of an alternating stack. */
  invert?: boolean;
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
            d={drawnRect(size.width, size.height, seed)}
            fill={filled ? (invert ? "var(--color-ink)" : "var(--color-card)") : "none"}
            stroke={invert ? "var(--color-paper)" : "var(--color-ink)"}
            strokeWidth={strokeWidth}
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
}: {
  seed: string;
  children: React.ReactNode;
  className?: string;
  filled?: boolean;
  invert?: boolean;
}) {
  return (
    <div
      className={`relative ${className}`}
      style={{ transform: `rotate(${sketchTilt(seed)})` }}
    >
      <SketchFrame seed={seed} filled={filled} invert={invert} />
      <div className="relative">{children}</div>
    </div>
  );
}
