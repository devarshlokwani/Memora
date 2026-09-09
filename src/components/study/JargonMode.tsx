"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import type { Grade } from "@/lib/types";
import { CardShell, type ModeProps } from "./shared";
import { Shortcut } from "./Shortcut";
import { useKeys, useSubmitKey } from "./useKeys";

const GRADES: { grade: Grade; label: string; tone: string }[] = [
  { grade: 0, label: "Nothing like it", tone: "bg-wrong-soft text-wrong" },
  { grade: 1, label: "Roughly there", tone: "bg-rule-soft text-ink" },
  { grade: 2, label: "Close enough", tone: "bg-correct-soft text-correct" },
  { grade: 3, label: "Word for word", tone: "bg-highlight text-[#16233a]" },
];

/** Produce the definition from memory, then compare it against the source. */
export function JargonMode({ card, onAnswer }: ModeProps) {
  const [value, setValue] = useState("");
  const [revealed, setRevealed] = useState(false);
  const areaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    setValue("");
    setRevealed(false);
    areaRef.current?.focus();
  }, [card.id]);

  const grade = useCallback(
    (g: Grade) => onAnswer({ grade: g, correct: g >= 2 }),
    [onAnswer],
  );

  const keys = useMemo(
    () => Object.fromEntries(GRADES.map((g, i) => [String(i + 1), () => grade(g.grade)])),
    [grade],
  );

  useSubmitKey(() => setRevealed(true), !revealed);
  useKeys(keys, revealed);

  return (
    <CardShell>
      <p className="text-sm text-ink-faint">Define this term</p>
      <p className="mt-1.5 font-reading text-[1.9rem] leading-tight text-ink">{card.prompt}</p>

      <textarea
        ref={areaRef}
        value={value}
        disabled={revealed}
        rows={4}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Write it in your own words"
        className="mt-5 w-full resize-none rounded-md border border-rule bg-paper px-4 py-3 text-[0.95rem] leading-relaxed text-ink outline-none placeholder:text-ink-faint focus:border-ink disabled:opacity-70"
      />

      {!revealed ? (
        <button
          type="button"
          onClick={() => setRevealed(true)}
          className="mt-3 w-full rounded-md bg-ink px-4 py-3 text-[0.95rem] font-medium text-paper hover:opacity-90"
        >
          Compare with the source
          <Shortcut>ctrl + enter</Shortcut>
        </button>
      ) : (
        <>
          <div className="mt-5 rounded-md border-l-2 border-highlight-deep bg-paper px-4 py-3">
            <p className="text-sm text-ink-faint">From your material</p>
            <p className="mt-1 font-reading text-[1.05rem] leading-relaxed text-ink">
              {card.answer}
            </p>
          </div>

          <p className="mt-5 text-sm text-ink-soft">How close were you?</p>
          <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4">
            {GRADES.map(({ grade: g, label, tone }, index) => (
              <button
                key={g}
                type="button"
                onClick={() => grade(g)}
                className={`rounded-md px-3 py-3 text-[0.9rem] font-medium hover:brightness-95 ${tone}`}
              >
                {label}
                <Shortcut>{index + 1}</Shortcut>
              </button>
            ))}
          </div>
        </>
      )}
    </CardShell>
  );
}
