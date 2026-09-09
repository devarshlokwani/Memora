"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useMemo, useRef, useState } from "react";

import { Swipe } from "@/components/Swipe";
import { CARD_TYPES, MODE_BLURBS, MODE_LABELS, type CardType, type Grade } from "@/lib/types";

import { FillBlankMode } from "./FillBlankMode";
import { FlashcardMode } from "./FlashcardMode";
import { JargonMode } from "./JargonMode";
import { MatchMode } from "./MatchMode";
import { McqMode } from "./McqMode";
import { shuffle, type StudyCard } from "./shared";

const SESSION_SIZE = 20;

type Mode = CardType | "mixed";

export function StudySession({
  topicTitle,
  courseId,
  topicId = null,
  cards,
}: {
  topicTitle: string;
  courseId: string | null;
  topicId?: string | null;
  cards: StudyCard[];
}) {
  const router = useRouter();
  const [mode, setMode] = useState<Mode | null>(null);
  const [queue, setQueue] = useState<StudyCard[]>([]);
  const [position, setPosition] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const startedAt = useRef<string>("");
  const recorded = useRef(false);

  const countsByType = useMemo(() => {
    const counts = new Map<CardType, number>();
    for (const card of cards) counts.set(card.type, (counts.get(card.type) ?? 0) + 1);
    return counts;
  }, [cards]);

  const dueCount = useMemo(() => {
    const now = Date.now();
    return cards.filter((c) => !c.dueAt || new Date(c.dueAt).getTime() <= now).length;
  }, [cards]);

  function start(selected: Mode) {
    const pool = selected === "mixed" ? cards : cards.filter((c) => c.type === selected);
    const now = Date.now();
    const isDue = (c: StudyCard) => !c.dueAt || new Date(c.dueAt).getTime() <= now;

    // Anything due (or never seen) comes first; the rest fill the session out.
    const ordered = [...shuffle(pool.filter(isDue)), ...shuffle(pool.filter((c) => !isDue(c)))];

    setQueue(ordered.slice(0, SESSION_SIZE));
    setPosition(0);
    setCorrectCount(0);
    startedAt.current = new Date().toISOString();
    recorded.current = false;
    setMode(selected);
  }

  /** Writes the session once, when the last card is answered. */
  const recordSession = useCallback(
    async (answered: number, correct: number, sessionMode: Mode) => {
      if (recorded.current || answered === 0) return;
      recorded.current = true;
      try {
        await fetch("/api/sessions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            courseId,
            topicId,
            mode: sessionMode,
            answered,
            correct,
            startedAt: startedAt.current,
          }),
        });
      } catch {
        /* a lost session record is not worth interrupting the student for */
      }
    },
    [courseId, topicId],
  );

  async function handleAnswer({ grade, correct }: { grade: Grade; correct: boolean }) {
    const card = queue[position];
    const nextCorrect = correctCount + (correct ? 1 : 0);
    const nextPosition = position + 1;

    if (correct) setCorrectCount(nextCorrect);
    setPosition(nextPosition);

    if (nextPosition >= queue.length && mode) {
      void recordSession(queue.length, nextCorrect, mode);
    }

    // Scheduling is not worth blocking the next card on; a dropped review just
    // leaves the card due, which is the safe direction to fail in.
    try {
      await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cardId: card.id, grade, correct }),
      });
    } catch {
      /* keep going */
    }
  }

  // ------------------------------------------------------------- mode picker

  if (mode === null) {
    const available = CARD_TYPES.filter((t) => (countsByType.get(t) ?? 0) > 0);

    return (
      <div className="mt-6">
        <h1 className="font-reading text-[2rem] leading-tight text-ink">{topicTitle}</h1>
        <p className="mt-2 text-[0.95rem] text-ink-soft">
          {cards.length} cards, {dueCount} ready for you now. Pick how you want to work through
          them.
        </p>

        <ul className="mt-7 space-y-2.5">
          {available.map((type) => (
            <li key={type}>
              <button
                type="button"
                onClick={() => start(type)}
                className="flex w-full items-baseline justify-between gap-6 rounded-card border border-rule bg-card px-5 py-4 text-left transition-colors hover:border-ink"
              >
                <span className="min-w-0">
                  <span className="block text-[1.05rem] font-medium text-ink">
                    {MODE_LABELS[type]}
                  </span>
                  <span className="mt-0.5 block text-[0.9rem] leading-relaxed text-ink-soft">
                    {MODE_BLURBS[type]}
                  </span>
                </span>
                <span className="shrink-0 text-sm text-ink-faint">
                  {countsByType.get(type)} cards
                </span>
              </button>
            </li>
          ))}
        </ul>

        {available.length > 1 && (
          <button
            type="button"
            onClick={() => start("mixed")}
            className="mt-5 w-full rounded-md bg-ink px-4 py-3 text-[0.95rem] font-medium text-paper hover:opacity-90"
          >
            Mix all formats
          </button>
        )}

        {available.length === 0 && (
          <p className="mt-6 rounded-card border border-rule bg-card p-5 text-[0.95rem] text-ink-soft">
            This topic has no cards yet. Go back to the course and write them.
          </p>
        )}
      </div>
    );
  }

  // ----------------------------------------------------------------- summary

  if (position >= queue.length) {
    const score = queue.length > 0 ? Math.round((correctCount / queue.length) * 100) : 0;

    return (
      <div className="mt-10 rounded-card border border-rule bg-card p-8 text-center shadow-[var(--shadow-card)]">
        <p className="text-sm text-ink-faint">{MODE_LABELS[mode as CardType] ?? "Mixed"}</p>
        <h2 className="mt-1 font-reading text-[2rem] leading-tight text-ink">
          {correctCount} of {queue.length}
        </h2>
        <p className="mx-auto mt-2 max-w-[42ch] text-[0.95rem] leading-relaxed text-ink-soft">
          {score >= 80
            ? "That's solid. Memora has pushed these cards further out."
            : score >= 50
              ? "Getting there. The ones you missed come back sooner."
              : "Worth another pass. Everything you missed is queued up again."}
        </p>

        <div className="mt-7 flex flex-col gap-2.5 sm:flex-row sm:justify-center">
          <button
            type="button"
            onClick={() => {
              router.refresh();
              setMode(null);
            }}
            className="rounded-md bg-ink px-5 py-2.5 text-[0.95rem] font-medium text-paper hover:opacity-90"
          >
            Study again
          </button>
          <Link
            href={courseId ? `/courses/${courseId}` : "/dashboard"}
            className="rounded-md border border-ink px-5 py-2.5 text-[0.95rem] font-medium text-ink hover:bg-paper"
          >
            {courseId ? "Back to the course" : "Back to your courses"}
          </Link>
        </div>
      </div>
    );
  }

  // ----------------------------------------------------------------- session

  const card = queue[position];

  return (
    <div className="mt-6">
      <div className="flex items-center gap-4">
        <Swipe value={position} total={queue.length} />
        <span className="shrink-0 text-sm text-ink-faint">
          {position + 1} / {queue.length}
        </span>
        <button
          type="button"
          onClick={() => setMode(null)}
          className="shrink-0 text-sm text-ink-soft hover:text-ink"
        >
          Change format
        </button>
      </div>

      <div className="mt-6">
        {card.type === "flashcard" && <FlashcardMode card={card} onAnswer={handleAnswer} />}
        {card.type === "mcq" && <McqMode card={card} onAnswer={handleAnswer} />}
        {card.type === "fill_blank" && <FillBlankMode card={card} onAnswer={handleAnswer} />}
        {card.type === "match" && <MatchMode card={card} onAnswer={handleAnswer} />}
        {card.type === "jargon" && <JargonMode card={card} onAnswer={handleAnswer} />}
      </div>
    </div>
  );
}
