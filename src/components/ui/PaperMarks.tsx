"use client";

import { useEffect, useState } from "react";

import { MARK_BAND, paperStrokes } from "@/lib/sketch";

/**
 * The pencil marks lying under every page, loose strokes at their own angles
 * rather than a ruled grid, which is what a repeating tile always turns into
 * however softly it is drawn.
 *
 * Laid over the whole document rather than tiled, so nothing recurs: the sheet
 * is drawn once at the size the page actually is, and redrawn when that changes.
 * Measured on the client, so the first paint has none and hydration has nothing
 * to disagree about.
 */
export function PaperMarks() {
  const [size, setSize] = useState({ width: 0, height: 0 });

  useEffect(() => {
    const measure = () => {
      const width = document.documentElement.clientWidth;
      // Rounded up to a whole band, so the state only changes when there is a
      // band to add or drop, a height that animates would otherwise re-render
      // every stroke on the page on every frame of the tween.
      const raw = Math.max(document.body.scrollHeight, window.innerHeight);
      const height = Math.ceil(raw / MARK_BAND) * MARK_BAND;
      setSize((current) =>
        current.width === width && current.height === height ? current : { width, height },
      );
    };

    measure();

    /* Re-rolled only once the page has stopped changing shape. Switching section
       moves the document height by thousands of pixels, and redrawing a hundred
       strokes in the middle of that costs the frame the new section is trying to
       arrive in. Nothing is waiting on the marks; they can land late. */
    let settling = 0;
    const later = () => {
      window.clearTimeout(settling);
      settling = window.setTimeout(measure, 220);
    };

    const observer = new ResizeObserver(later);
    observer.observe(document.body);
    window.addEventListener("resize", later);
    return () => {
      window.clearTimeout(settling);
      observer.disconnect();
      window.removeEventListener("resize", later);
    };
  }, []);

  const strokes = paperStrokes(size.width, size.height);
  if (!strokes.length) return null;

  return (
    /* The sheet is a whole number of bands tall and so overhangs the end of the
       page. Clipped to the page here: left to itself an absolutely positioned
       child that tall adds its overhang to the document, and you get most of a
       screen of empty scroll under the footer. */
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
      <svg
        width={size.width}
        height={size.height}
        viewBox={`0 0 ${size.width} ${size.height}`}
        className="absolute left-0 top-0"
      >
        {strokes.map((stroke, i) => (
          <path
            key={i}
            d={stroke.d}
            fill="none"
            stroke="var(--color-ink)"
            strokeOpacity={stroke.opacity}
            strokeWidth={stroke.width}
            strokeDasharray={stroke.dash}
            strokeLinecap="round"
          />
        ))}
      </svg>
    </div>
  );
}
