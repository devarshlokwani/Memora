"use client";

import { useEffect, useState } from "react";

import type { MatchPair } from "@/lib/types";

import { CardShell, ContinueButton, shuffle, type ModeProps } from "./shared";

/** Tap a term, then tap its partner. Correct pairs lock; wrong ones cost a mistake. */
export function MatchMode({ card, onAnswer }: ModeProps) {
  const [selectedLeft, setSelectedLeft] = useState<number | null>(null);
  const [matched, setMatched] = useState<Set<number>>(new Set());
  const [wrongPick, setWrongPick] = useState<string | null>(null);
  const [mistakes, setMistakes] = useState(0);

  // Shuffled in an effect, never during render: a Math.random() ordering computed
  // on the server would not survive hydration.
  const [rights, setRights] = useState<(MatchPair & { index: number })[]>([]);

  useEffect(() => {
    setRights(shuffle(card.pairs.map((pair, index) => ({ ...pair, index }))));
    setSelectedLeft(null);
    setMatched(new Set());
    setWrongPick(null);
    setMistakes(0);
  }, [card.id, card.pairs]);

  const done = matched.size === card.pairs.length && card.pairs.length > 0;
  const ready = rights.length === card.pairs.length;

  const status = !ready
    ? " "
    : done
      ? mistakes === 0
        ? `All ${card.pairs.length}, first time.`
        : `Done, with ${mistakes} wrong ${mistakes === 1 ? "try" : "tries"}.`
      : selectedLeft === null
        ? "Pick a term on the left."
        : "Now pick its partner.";

  function pickRight(rightIndex: number) {
    if (selectedLeft === null || matched.has(rightIndex)) return;

    if (rightIndex === selectedLeft) {
      setMatched(new Set([...matched, rightIndex]));
      setSelectedLeft(null);
      setWrongPick(null);
    } else {
      setMistakes((n) => n + 1);
      setWrongPick(`${selectedLeft}-${rightIndex}`);
      setTimeout(() => setWrongPick(null), 450);
      setSelectedLeft(null);
    }
  }

  return (
    <CardShell seed={card.id}>
      <p className="text-[0.95rem] text-ink-soft">{card.prompt}</p>

      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        <ul className="space-y-2">
          {card.pairs.map((pair, index) => {
            const isMatched = matched.has(index);
            const isSelected = selectedLeft === index;
            return (
              <li key={index}>
                <button
                  type="button"
                  disabled={isMatched}
                  onClick={() => setSelectedLeft(index)}
                  className={`w-full rounded-2xl border px-3.5 py-2.5 text-left text-[0.9rem] leading-snug transition-colors ${
                    isMatched
                      ? "border-ink bg-correct-soft text-ink"
                      : isSelected
                        ? "border-ink bg-ink text-paper"
                        : "border-rule text-ink hover:border-ink"
                  } ${wrongPick?.startsWith(`${index}-`) ? "border-dashed border-ink hatch" : ""}`}
                >
                  {pair.left}
                </button>
              </li>
            );
          })}
        </ul>

        <ul className="space-y-2">
          {rights.map((pair) => {
            const isMatched = matched.has(pair.index);
            return (
              <li key={pair.index}>
                <button
                  type="button"
                  disabled={isMatched || selectedLeft === null}
                  onClick={() => pickRight(pair.index)}
                  className={`w-full rounded-2xl border px-3.5 py-2.5 text-left text-[0.9rem] leading-snug transition-colors ${
                    isMatched
                      ? "border-ink bg-correct-soft text-ink"
                      : "border-rule text-ink enabled:hover:border-ink disabled:opacity-60"
                  } ${wrongPick?.endsWith(`-${pair.index}`) ? "border-dashed border-ink hatch" : ""}`}
                >
                  {pair.right}
                </button>
              </li>
            );
          })}
        </ul>
      </div>

      <p className="mt-4 text-sm text-ink-faint">{status}</p>

      {done && (
        <ContinueButton
          onClick={() =>
            onAnswer({
              grade: mistakes === 0 ? 3 : mistakes <= 2 ? 2 : 0,
              correct: mistakes <= 2,
            })
          }
        />
      )}
    </CardShell>
  );
}
