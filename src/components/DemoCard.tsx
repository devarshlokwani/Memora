"use client";

import { useState } from "react";

/** The hero: a real card the visitor can flip. Same component behaviour as study mode. */
export function DemoCard() {
  const [flipped, setFlipped] = useState(false);

  return (
    <div className="w-full max-w-md">
      <button
        type="button"
        onClick={() => setFlipped((f) => !f)}
        aria-pressed={flipped}
        className="flip-scene block w-full text-left"
      >
        <span className="flip-inner relative block h-[19rem] w-full" data-flipped={flipped}>
          <span className="flip-face card-index absolute inset-0 flex flex-col justify-between rounded-card border border-rule bg-card p-7 shadow-[var(--shadow-card)]">
            <span className="text-sm text-ink-faint">Cell Biology &middot; Membrane transport</span>
            <span className="font-reading text-[1.6rem] leading-snug text-ink">
              Why can a sodium&ndash;potassium pump move ions against their concentration
              gradient?
            </span>
            <span className="text-sm text-ink-faint">Click to turn the card over</span>
          </span>

          <span className="flip-face flip-face-back card-index absolute inset-0 flex flex-col justify-between rounded-card border border-ink bg-card p-7 shadow-[var(--shadow-lift)]">
            <span className="text-sm text-ink-faint">Answer</span>
            <span className="font-reading text-[1.35rem] leading-relaxed text-ink">
              It is active transport: the pump hydrolyses ATP, and that energy drives the
              conformational change that carries 3 Na&#8314; out and 2 K&#8314; in.
            </span>
            <span className="flex gap-2 text-sm">
              <span className="rounded bg-wrong-soft px-2.5 py-1 text-wrong">Missed it</span>
              <span className="rounded bg-correct-soft px-2.5 py-1 text-correct">Knew it</span>
            </span>
          </span>
        </span>
      </button>
    </div>
  );
}
