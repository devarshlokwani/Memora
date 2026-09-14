"use client";

import { useState } from "react";

import { SketchFrame } from "@/components/SketchFrame";
import { sketchTilt } from "@/lib/sketch";

/** The hero: a real card the visitor can flip. Same behaviour as study mode. */
export function DemoCard() {
  const [flipped, setFlipped] = useState(false);

  return (
    <div className="w-full max-w-lg" style={{ transform: `rotate(${sketchTilt("demo")})` }}>
      <button
        type="button"
        onClick={() => setFlipped((f) => !f)}
        aria-pressed={flipped}
        className="flip-scene block w-full text-left"
      >
        <span className="flip-inner relative block h-[21rem] w-full" data-flipped={flipped}>
          <span className="flip-face absolute inset-0 block">
            <SketchFrame seed="demo-front" />
            <span className="relative flex h-full flex-col justify-between p-9">
              <span className="font-hand text-lg text-ink-faint">
                Cell Biology &mdash; membrane transport
              </span>
              <span className="font-reading text-[1.8rem] leading-snug text-ink">
                Why can a sodium&ndash;potassium pump move ions against their concentration
                gradient?
              </span>
              <span className="font-hand text-lg text-ink-faint">turn me over &rarr;</span>
            </span>
          </span>

          <span className="flip-face flip-face-back absolute inset-0 block">
            <SketchFrame seed="demo-back" />
            <span className="relative flex h-full flex-col justify-between p-9">
              <span className="font-hand text-lg text-ink-faint">the answer</span>
              <span className="font-reading text-[1.45rem] leading-relaxed text-ink">
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
        </span>
      </button>
    </div>
  );
}
