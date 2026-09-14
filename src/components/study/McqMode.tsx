"use client";

import { useEffect, useMemo, useState } from "react";

import { CheckMark, CrossMark } from "@/components/ui/Marks";

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
    <CardShell seed={card.id}>
      <p className="font-reading text-[1.35rem] leading-snug text-ink">{card.prompt}</p>

      <ul className="mt-6 space-y-2">
        {card.options.map((option, index) => {
          const isAnswer = index === card.correct_index;
          const isPick = index === picked;

          // Monochrome, so right and wrong are told apart by weight and texture.
          let tone = "border-rule hover:border-ink";
          if (answered && isAnswer) tone = "border-ink bg-correct-soft";
          else if (answered && isPick) tone = "border-dashed border-rule hatch";
          else if (answered) tone = "border-rule opacity-45";

          return (
            <li key={index}>
              <button
                type="button"
                disabled={answered}
                onClick={() => setPicked(index)}
                className={`flex w-full items-center gap-3 rounded-2xl border px-4 py-3 text-left text-[0.95rem] leading-relaxed text-ink transition-colors ${tone}`}
              >
                <span className="text-ink-faint tabular-nums">{index + 1}</span>
                <span className={answered && isPick && !isAnswer ? "line-through" : ""}>
                  {option}
                </span>
                {answered && isAnswer && <CheckMark className="ml-auto h-5 w-5 shrink-0" />}
                {answered && isPick && !isAnswer && (
                  <CrossMark className="ml-auto h-5 w-5 shrink-0 text-ink-soft" />
                )}
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
