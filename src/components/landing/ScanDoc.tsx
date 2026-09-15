"use client";

import gsap from "gsap";
import { useEffect, useRef, useState } from "react";

import { prefersReducedMotion } from "@/lib/motion";
import { drawnRectPath } from "@/lib/sketch";

/**
 * A page of your handout, being read.
 *
 * It replaced a pair of panels that showed a passage, the card written from it,
 * and a `[C1]` tag linking the two. Everything in that was true, and the tag was
 * the part everybody stopped at: a reference number is machinery, and putting it
 * in front of someone means explaining it before the point lands.
 *
 * A beam going down a page needs no explaining. The lines it has passed are inked
 * in behind it, so what you watch is the document being taken in, which is the
 * whole of the claim.
 */

const W = 268;
const H = 336;

/** Where each line of the page sits, and how far across it runs. */
const LINES = [
  { y: 92, w: 0.82 },
  { y: 110, w: 0.9 },
  { y: 128, w: 0.74 },
  { y: 146, w: 0.86 },
  { y: 164, w: 0.44 },
  { y: 248, w: 0.88 },
  { y: 266, w: 0.8 },
  { y: 284, w: 0.9 },
  { y: 302, w: 0.58 },
];

export function ScanDoc({ className = "" }: { className?: string }) {
  const hostRef = useRef<HTMLDivElement>(null);
  const readRef = useRef<SVGGElement>(null);
  const beamRef = useRef<SVGGElement>(null);
  const [seen, setSeen] = useState(false);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    const watcher = new IntersectionObserver(([entry]) => setSeen(entry.isIntersecting), {
      threshold: 0.3,
    });
    watcher.observe(host);
    return () => watcher.disconnect();
  }, []);

  useEffect(() => {
    const read = readRef.current;
    const beam = beamRef.current;
    if (!read || !beam) return;

    // Nothing to watch when animation is off, so the page is simply shown read.
    if (prefersReducedMotion()) {
      read.style.clipPath = "inset(0 0 0 0)";
      beam.style.opacity = "0";
      return;
    }

    if (!seen) return;

    const at = { y: 0 };
    const place = () => {
      // Everything above the beam has been taken in; everything below has not.
      read.style.clipPath = `inset(0 0 ${(100 - at.y * 100).toFixed(2)}% 0)`;
      beam.style.transform = `translateY(${(at.y * H).toFixed(1)}px)`;
    };

    const timeline = gsap.timeline({ repeat: -1, repeatDelay: 0.5 });
    timeline
      .set(at, { y: 0 })
      .set(beam, { opacity: 1 })
      .to(at, { y: 1, duration: 2.3, ease: "none", onUpdate: place })
      // Held at the foot of the page, read, before it starts over.
      .to(beam, { opacity: 0, duration: 0.3 }, ">-0.1")
      .to({}, { duration: 1.1 });

    return () => {
      timeline.kill();
    };
  }, [seen]);

  return (
    <div ref={hostRef} className={`flex justify-center lg:justify-end ${className}`}>
      <div className="w-full max-w-[19rem]">
        <svg viewBox={`0 0 ${W} ${H}`} className="h-auto w-full overflow-visible" role="img" aria-label="A page of a handout being read">
          {/* The page. */}
          <path
            d={drawnRectPath(W, H, "scan-page", 1.8)}
            fill="var(--color-card)"
            stroke="var(--color-ink)"
            strokeWidth={1.5}
            strokeLinejoin="round"
            strokeLinecap="round"
          />

          <text x={22} y={34} className="font-hand text-[14px]" fill="var(--color-ink-faint)">
            lecture-04.pdf
          </text>

          {/* Unread: the page as it arrives. */}
          <g>
            <path
              d={`M22 58H${22 + (W - 44) * 0.62}`}
              stroke="var(--color-rule)"
              strokeWidth={5}
              strokeLinecap="round"
            />
            {LINES.map((line) => (
              <path
                key={line.y}
                d={`M22 ${line.y}H${22 + (W - 44) * line.w}`}
                stroke="var(--color-rule-soft)"
                strokeWidth={3}
                strokeLinecap="round"
              />
            ))}
            <path
              d={drawnRectPath(W - 92, 48, "scan-figure", 1.4)}
              transform={`translate(46 186)`}
              fill="none"
              stroke="var(--color-rule-soft)"
              strokeWidth={1.4}
              strokeLinejoin="round"
            />
          </g>

          {/* Read: the same page in ink, uncovered by the beam as it descends. */}
          <g ref={readRef} style={{ clipPath: "inset(0 0 100% 0)" }}>
            <path
              d={`M22 58H${22 + (W - 44) * 0.62}`}
              stroke="var(--color-ink)"
              strokeWidth={5}
              strokeLinecap="round"
            />
            {LINES.map((line) => (
              <path
                key={line.y}
                d={`M22 ${line.y}H${22 + (W - 44) * line.w}`}
                stroke="var(--color-ink-soft)"
                strokeWidth={3}
                strokeLinecap="round"
              />
            ))}
            <path
              d={drawnRectPath(W - 92, 48, "scan-figure", 1.4)}
              transform={`translate(46 186)`}
              fill="none"
              stroke="var(--color-ink-soft)"
              strokeWidth={1.4}
              strokeLinejoin="round"
            />
          </g>

          {/* The beam, and the light it throws just ahead of itself. */}
          <g ref={beamRef} style={{ opacity: 0 }}>
            <rect
              x={2}
              y={-26}
              width={W - 4}
              height={26}
              fill="url(#scan-glow)"
              opacity={0.5}
            />
            <path
              d={`M4 0H${W - 4}`}
              stroke="var(--color-accent)"
              strokeWidth={2}
              strokeLinecap="round"
            />
          </g>

          <defs>
            <linearGradient id="scan-glow" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--color-accent)" stopOpacity="0" />
              <stop offset="100%" stopColor="var(--color-accent)" stopOpacity="0.35" />
            </linearGradient>
          </defs>
        </svg>

        <p className="mt-4 text-center font-hand text-lg text-ink-soft">
          read line by line, not skimmed
        </p>
      </div>
    </div>
  );
}
