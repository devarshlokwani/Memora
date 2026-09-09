"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import type { Grade } from "@/lib/types";
import type { ModeProps } from "./shared";
import { Shortcut } from "./Shortcut";
import { useKeys } from "./useKeys";

const GRADES: { grade: Grade; label: string; tone: string }[] = [
  { grade: 0, label: "Missed it", tone: "bg-wrong-soft text-wrong hover:brightness-95" },
  { grade: 1, label: "Shaky", tone: "bg-rule-soft text-ink hover:brightness-95" },
  { grade: 2, label: "Knew it", tone: "bg-correct-soft text-correct hover:brightness-95" },
  { grade: 3, label: "Instant", tone: "bg-highlight text-[#16233a] hover:brightness-95" },
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
      <div className="flip-scene">
        <div className="flip-inner relative h-[20rem] w-full" data-flipped={flipped}>
          <div className="flip-face card-index absolute inset-0 flex flex-col justify-center rounded-card border border-rule bg-card p-8 shadow-[var(--shadow-card)]">
            <p className="font-reading text-[1.5rem] leading-snug text-ink">{card.prompt}</p>
          </div>
          <div className="flip-face flip-face-back card-index absolute inset-0 flex flex-col justify-center overflow-y-auto rounded-card border border-ink bg-card p-8 shadow-[var(--shadow-lift)]">
            <p className="font-reading text-[1.25rem] leading-relaxed text-ink">{card.answer}</p>
          </div>
        </div>
      </div>

      {!flipped ? (
        <button
          type="button"
          onClick={() => setFlipped(true)}
          autoFocus
          className="mt-6 w-full rounded-md bg-ink px-4 py-3 text-[0.95rem] font-medium text-paper hover:opacity-90"
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
                className={`rounded-md px-3 py-3 text-[0.95rem] font-medium transition-[filter] ${tone}`}
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
