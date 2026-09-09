"use client";

import { useEffect, useRef, useState } from "react";

import { CardShell, ContinueButton, Verdict, matchesAnswer, type ModeProps } from "./shared";

export function FillBlankMode({ card, onAnswer }: ModeProps) {
  const [value, setValue] = useState("");
  const [checked, setChecked] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setValue("");
    setChecked(false);
    inputRef.current?.focus();
  }, [card.id]);

  const correct = checked && matchesAnswer(value, card.answer, card.options);
  const [before, ...rest] = card.prompt.split("___");
  const after = rest.join("___");

  return (
    <CardShell>
      <p className="font-reading text-[1.3rem] leading-relaxed text-ink">
        {before}
        <span className="inline-block min-w-24 border-b-2 border-highlight-deep px-1.5 text-center align-baseline">
          {checked ? (
            <span className={correct ? "text-correct" : "text-wrong line-through"}>
              {value || "\u00a0"}
            </span>
          ) : (
            "\u00a0"
          )}
        </span>
        {after}
      </p>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (!checked && value.trim()) setChecked(true);
        }}
        className="mt-6"
      >
        <input
          ref={inputRef}
          type="text"
          value={value}
          disabled={checked}
          onChange={(e) => setValue(e.target.value)}
          placeholder="The missing word"
          autoComplete="off"
          className="w-full rounded-md border border-rule bg-paper px-4 py-3 text-[1rem] text-ink outline-none placeholder:text-ink-faint focus:border-ink disabled:opacity-70"
        />
        {!checked && (
          <button
            type="submit"
            disabled={!value.trim()}
            className="mt-3 w-full rounded-md bg-ink px-4 py-3 text-[0.95rem] font-medium text-paper hover:opacity-90 disabled:opacity-40"
          >
            Check
          </button>
        )}
      </form>

      {checked && (
        <>
          <Verdict correct={correct}>
            {!correct && (
              <p>
                The answer is <span className="font-medium text-ink">{card.answer}</span>.
              </p>
            )}
          </Verdict>
          <ContinueButton onClick={() => onAnswer({ grade: correct ? 2 : 0, correct })} />
        </>
      )}
    </CardShell>
  );
}
