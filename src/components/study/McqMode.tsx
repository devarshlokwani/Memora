"use client";

import { useEffect, useMemo, useState } from "react";

import { CardShell, ContinueButton, Verdict, type ModeProps } from "./shared";
import { useKeys } from "./useKeys";

export function McqMode({ card, onAnswer }: ModeProps) {
  const [picked, setPicked] = useState<number | null>(null);

  useEffect(() => setPicked(null), [card.id]);

  const answered = picked !== null;
  const correct = picked === card.correct_index;

  const keys = useMemo(
    () =>
      Object.fromEntries(
        card.options.map((_, index) => [String(index + 1), () => setPicked(index)]),
      ),
    [card.options],
  );

  useKeys(keys, !answered);

  return (
    <CardShell>
      <p className="font-reading text-[1.35rem] leading-snug text-ink">{card.prompt}</p>

      <ul className="mt-6 space-y-2">
        {card.options.map((option, index) => {
          const isAnswer = index === card.correct_index;
          const isPick = index === picked;

          let tone = "border-rule hover:border-ink";
          if (answered && isAnswer) tone = "border-correct bg-correct-soft";
          else if (answered && isPick) tone = "border-wrong bg-wrong-soft";
          else if (answered) tone = "border-rule opacity-60";

          return (
            <li key={index}>
              <button
                type="button"
                disabled={answered}
                onClick={() => setPicked(index)}
                className={`flex w-full items-baseline gap-3 rounded-md border px-4 py-3 text-left text-[0.95rem] leading-relaxed text-ink transition-colors ${tone}`}
              >
                <span className="text-ink-faint tabular-nums">{index + 1}</span>
                <span>{option}</span>
              </button>
            </li>
          );
        })}
      </ul>

      {answered && (
        <>
          <Verdict correct={correct}>
            {card.explanation ? (
              <p>{card.explanation}</p>
            ) : (
              !correct && <p>The answer is &ldquo;{card.answer}&rdquo;.</p>
            )}
          </Verdict>
          <ContinueButton onClick={() => onAnswer({ grade: correct ? 2 : 0, correct })} />
        </>
      )}
    </CardShell>
  );
}
