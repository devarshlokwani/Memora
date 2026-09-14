"use client";

import { useState } from "react";

import { sketchProps } from "@/lib/sketch";

/** The hero: a real card the visitor can flip. Same behaviour as study mode. */
export function DemoCard() {
  const [flipped, setFlipped] = useState(false);

  const front = sketchProps("demo-front", "card-index shadow-[var(--shadow-card)]");
  const back = sketchProps("demo-back", "card-index shadow-[var(--shadow-lift)]");

  return (
    <div className="w-full max-w-lg">
      <button
        type="button"
        onClick={() => setFlipped((f) => !f)}
        aria-pressed={flipped}
        className="flip-scene block w-full text-left"
      >
        <span className="flip-inner relative block h-[20rem] w-full" data-flipped={flipped}>
          <span
            className={`flip-face absolute inset-0 flex flex-col justify-between p-8 ${front.className}`}
            style={front.style}
          >
            <span className="font-hand text-lg text-ink-faint">
              Cell Biology &mdash; membrane transport
            </span>
            <span className="font-reading text-[1.75rem] leading-snug text-ink">
              Why can a sodium&ndash;potassium pump move ions against their concentration
              gradient?
            </span>
            <span className="font-hand text-lg text-ink-faint">turn me over &rarr;</span>
          </span>

          <span
            className={`flip-face flip-face-back absolute inset-0 flex flex-col justify-between p-8 ${back.className}`}
            style={back.style}
          >
            <span className="font-hand text-lg text-ink-faint">the answer</span>
            <span className="font-reading text-[1.4rem] leading-relaxed text-ink">
              It is active transport: the pump hydrolyses ATP, and that energy drives the
              conformational change carrying 3 Na&#8314; out and 2 K&#8314; in.
            </span>
            <span className="flex gap-3 font-hand text-lg text-ink-soft">
              <span>missed it</span>
              <span aria-hidden="true">&middot;</span>
              <span className="text-ink">knew it</span>
            </span>
          </span>
        </span>
      </button>
    </div>
  );
}
