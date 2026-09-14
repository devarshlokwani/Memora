"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import type { Grade } from "@/lib/types";
import { SketchFrame } from "@/components/SketchFrame";
import { sketchTilt } from "@/lib/sketch";

import type { ModeProps } from "./shared";
import { Shortcut } from "./Shortcut";
import { useKeys } from "./useKeys";

const GRADES: { grade: Grade; label: string; tone: string }[] = [
  { grade: 0, label: "Missed it", tone: "border-dashed border-rule text-ink-soft hover:border-ink" },
  { grade: 1, label: "Shaky", tone: "border-rule text-ink hover:border-ink" },
  { grade: 2, label: "Knew it", tone: "border-ink bg-paper-deep text-ink" },
  { grade: 3, label: "Instant", tone: "border-ink bg-ink text-paper" },
];

export function FlashcardMode({ card, onAnswer }: ModeProps) {
  const [flipped, setFlipped] = useState(false);

  useEffect(() => setFlipped(false), [card.id]);

  const grade = useCallback(
    (g: Grade) => onAnswer({ grade: g, correct: g >= 2 }),
    [onAnswer],
  );

  const keys = useMemo(
    () =>
      flipped
        ? Object.fromEntries(GRADES.map((g, i) => [String(i + 1), () => grade(g.grade)]))
        : { " ": () => setFlipped(true), Enter: () => setFlipped(true) },
    [flipped, grade],
  );

  useKeys(keys);

  return (
    <div>
      <div className="flip-scene" style={{ transform: `rotate(${sketchTilt(card.id)})` }}>
        <div className="flip-inner relative h-[20rem] w-full" data-flipped={flipped}>
          <div className="flip-face absolute inset-0">
            <SketchFrame seed={card.id} />
            <div className="relative flex h-full flex-col justify-center p-9">
              <p className="font-reading text-[1.55rem] leading-snug text-ink">{card.prompt}</p>
            </div>
          </div>
          <div className="flip-face flip-face-back absolute inset-0">
            <SketchFrame seed={card.id + "b"} />
            <div className="relative flex h-full flex-col justify-center overflow-y-auto p-9">
              <p className="font-reading text-[1.3rem] leading-relaxed text-ink">{card.answer}</p>
            </div>
          </div>
        </div>
      </div>

      {!flipped ? (
        <button
          type="button"
          onClick={() => setFlipped(true)}
          autoFocus
          className="mt-6 w-full rounded-full bg-ink px-4 py-3 text-[0.95rem] font-medium text-paper hover:opacity-90"
        >
          Show the answer
          <Shortcut>space</Shortcut>
        </button>
      ) : (
        <div>
          <p className="mt-6 text-sm text-ink-soft">How well did you know that?</p>
          <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4">
            {GRADES.map(({ grade: g, label, tone }, index) => (
              <button
                key={g}
                type="button"
                onClick={() => grade(g)}
                className={`rounded-2xl border px-3 py-3 text-[0.95rem] font-medium transition-colors ${tone}`}
              >
                {label}
                <Shortcut>{index + 1}</Shortcut>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
