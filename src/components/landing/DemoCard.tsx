"use client";

import gsap from "gsap";
import { useLayoutEffect, useRef, useState } from "react";

import { CheckMark, CrossMark } from "@/components/ui/Marks";
import { PushButton } from "@/components/ui/PushButton";
import { SketchFrame } from "@/components/ui/SketchFrame";
import { prefersReducedMotion } from "@/lib/motion";

type Sample = { id: string; topic: string; front: string; back: string };

/**
 * Deliberately easy. This is the first card a stranger ever sees, so it has to
 * be answerable by anyone — the thing being demonstrated is the loop, not the
 * subject.
 */
const DECK: Sample[] = [
  {
    id: "deck-mitochondria",
    topic: "Biology",
    front: "What is the job of the mitochondria?",
    back: "Releasing energy. It breaks glucose down into ATP, which is why it gets called the powerhouse of the cell.",
  },
  {
    id: "deck-seasons",
    topic: "Geography",
    front: "Why do we get seasons?",
    back: "Because the Earth is tilted. The hemisphere leaning toward the Sun gets more direct light and longer days — it is not about being closer to the Sun.",
  },
  {
    id: "deck-demand",
    topic: "Economics",
    front: "Demand rises and supply stays the same. What happens to the price?",
    back: "It goes up. More buyers competing for the same quantity pushes the market to a higher price.",
  },
  {
    id: "deck-moon",
    topic: "History",
    front: "What is 1969 remembered for?",
    back: "The first Moon landing. Apollo 11 touched down that July, and Neil Armstrong became the first person to walk on the Moon.",
  },
  {
    id: "deck-newton",
    topic: "Physics",
    front: "Newton's third law, in one sentence?",
    back: "Every action has an equal and opposite reaction. Push on a wall and the wall pushes back on you just as hard.",
  },
];

type Grade = "knew" | "missed";

/** Where a card sits by how far back it is. The angles are what make the collage. */
const SLOTS = [
  { x: 0, y: 0, rotate: -1.5, scale: 1 },
  { x: 26, y: 14, rotate: 7.5, scale: 0.95 },
  { x: -28, y: 22, rotate: -9, scale: 0.9 },
];
const VISIBLE = SLOTS.length;

export function DemoCard() {
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [grade, setGrade] = useState<Grade | null>(null);
  const [score, setScore] = useState({ knew: 0, missed: 0 });
  const [done, setDone] = useState(false);

  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);
  const previous = useRef<number | null>(null);

  /**
   * Cycling the deck: the card you just answered lifts, turns away and drops in
   * at the back while the one behind it comes forward. Swapping the text in place
   * would be far less code and would look like the card had simply been replaced,
   * which is not what a deck does.
   */
  useLayoutEffect(() => {
    const total = DECK.length;
    const reduce = prefersReducedMotion();

    DECK.forEach((_, i) => {
      const el = cardRefs.current[i];
      if (!el) return;

      const depth = (i - index + total) % total;
      const slot = SLOTS[Math.min(depth, VISIBLE - 1)];
      const resting = { ...slot, opacity: depth < VISIBLE ? 1 : 0 };

      const firstPaint = previous.current === null;
      const justLeftTheFront = previous.current === i && depth !== 0;

      if (firstPaint || reduce) {
        gsap.set(el, { ...resting, zIndex: total - depth });
        return;
      }

      if (justLeftTheFront) {
        gsap
          .timeline()
          .to(el, {
            y: -46,
            rotate: slot.rotate - 12,
            scale: 0.9,
            duration: 0.26,
            ease: "power2.in",
          })
          // Only once it is clear of the others does it drop behind them.
          .set(el, { zIndex: total - depth })
          .to(el, { ...resting, duration: 0.5, ease: "power3.out" });
      } else {
        gsap.set(el, { zIndex: total - depth });
        gsap.to(el, { ...resting, duration: 0.5, ease: "power3.out" });
      }
    });

    previous.current = index;
  }, [index]);

  function mark(value: Grade) {
    if (grade) return;
    setGrade(value);
    setScore((s) => ({ ...s, [value]: s[value] + 1 }));
  }

  function advance() {
    if (index === DECK.length - 1) {
      setDone(true);
      return;
    }
    setFlipped(false);
    setGrade(null);
    setIndex((i) => i + 1);
  }

  function restart() {
    previous.current = null;
    setIndex(0);
    setFlipped(false);
    setGrade(null);
    setScore({ knew: 0, missed: 0 });
    setDone(false);
  }

  if (done) {
    return (
      <div className="w-full max-w-md text-left">
        <div className="relative aspect-square w-full">
          <SketchFrame seed="deck-done" />
          <div className="relative flex h-full flex-col items-center justify-center p-9 text-center">
            <p className="font-hand text-xl text-ink-faint">that is the deck</p>
            <p className="mt-2 font-reading text-[2.6rem] leading-none text-ink">
              {score.knew} of {DECK.length}
            </p>
            <p className="mt-4 max-w-[30ch] text-[0.95rem] leading-relaxed text-ink-soft">
              With your own material, the ones you missed come back first and the rest wait until
              you are about to forget them.
            </p>
            <div className="mt-7">
              <PushButton href="/signup" size="sm">
                Build my first course
              </PushButton>
            </div>
            <button
              type="button"
              onClick={restart}
              className="mt-4 font-hand text-lg text-ink-faint underline-offset-4 hover:text-ink hover:underline"
            >
              run it again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md text-left">
      <div className="relative aspect-square w-full">
        {DECK.map((card, i) => {
          const isFront = i === index;
          const inverted = i % 2 === 1;
          const ink = inverted ? "text-paper" : "text-ink";
          const faint = inverted ? "text-paper/55" : "text-ink-faint";

          return (
            <div
              key={card.id}
              ref={(el) => {
                cardRefs.current[i] = el;
              }}
              className="absolute inset-0"
              // Cards behind the front one are decoration: not clickable, not in
              // the tab order, not read out.
              inert={!isFront}
              aria-hidden={!isFront}
            >
              <div className="flip-scene h-full w-full">
                <div
                  className="flip-inner relative h-full w-full"
                  data-flipped={isFront && flipped}
                >
                  <div className="flip-face absolute inset-0" inert={isFront && flipped}>
                    <SketchFrame seed={card.id} invert={inverted} />
                    <button
                      type="button"
                      onClick={() => setFlipped(true)}
                      className="relative flex h-full w-full flex-col justify-between p-8 text-left"
                    >
                      <span className={`font-hand text-lg ${faint}`}>{card.topic}</span>
                      <span className={`font-reading text-[1.6rem] leading-snug ${ink}`}>
                        {card.front}
                      </span>
                      <span className={`font-hand text-lg ${faint}`}>turn me over &rarr;</span>
                    </button>
                  </div>

                  <div
                    className="flip-face flip-face-back absolute inset-0"
                    inert={!(isFront && flipped)}
                  >
                    <SketchFrame seed={`${card.id}-back`} invert={inverted} />
                    <div className="relative flex h-full flex-col justify-between p-8">
                      <span className={`font-hand text-lg ${faint}`}>the answer</span>
                      <p className={`font-reading text-[1.2rem] leading-relaxed ${ink}`}>
                        {card.back}
                      </p>

                      {grade === null ? (
                        <div className="flex items-center gap-3">
                          <GradeButton tone="missed" onClick={() => mark("missed")}>
                            Missed it
                          </GradeButton>
                          <GradeButton tone="knew" onClick={() => mark("knew")}>
                            Knew it
                          </GradeButton>
                        </div>
                      ) : (
                        <div className="flex items-center justify-between gap-4">
                          <span
                            style={{
                              color:
                                grade === "knew" ? "var(--color-knew)" : "var(--color-missed)",
                            }}
                          >
                            {grade === "knew" ? (
                              <CheckMark className="h-8 w-8" />
                            ) : (
                              <CrossMark className="h-8 w-8" />
                            )}
                          </span>

                          <button
                            type="button"
                            onClick={advance}
                            aria-label={
                              index === DECK.length - 1 ? "Finish the deck" : "Next card"
                            }
                            className={`grid h-11 w-11 shrink-0 place-items-center rounded-full border transition-transform hover:translate-x-0.5 ${
                              inverted
                                ? "border-paper text-paper hover:bg-paper hover:text-ink"
                                : "border-ink text-ink hover:bg-ink hover:text-paper"
                            }`}
                          >
                            <ArrowRight />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-10 flex items-center justify-center gap-6">
        <Tally tone="knew" value={score.knew} label="knew it" />
        <Tally tone="missed" value={score.missed} label="missed it" />
        <span className="font-hand text-lg text-ink-faint">
          {index + 1} / {DECK.length}
        </span>
      </div>
    </div>
  );
}

function GradeButton({
  tone,
  onClick,
  children,
}: {
  tone: Grade;
  onClick: () => void;
  children: React.ReactNode;
}) {
  const colour = tone === "knew" ? "var(--color-knew)" : "var(--color-missed)";
  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded-full border-[1.5px] bg-transparent px-4 py-2 text-[0.9rem] font-medium transition-colors"
      style={{ borderColor: colour, color: colour }}
    >
      {children}
    </button>
  );
}

function Tally({ tone, value, label }: { tone: Grade; value: number; label: string }) {
  const colour = tone === "knew" ? "var(--color-knew)" : "var(--color-missed)";
  return (
    <span className="flex items-center gap-1.5 text-[0.9rem]" style={{ color: colour }}>
      {tone === "knew" ? <CheckMark className="h-4 w-4" /> : <CrossMark className="h-4 w-4" />}
      <span className="font-medium tabular-nums">{value}</span>
      <span className="sr-only">{label}</span>
    </span>
  );
}

function ArrowRight() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.9"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className="h-5 w-5"
    >
      <path d="M4.2 12.3c5.2-.4 10.4-.5 15.6-.3" />
      <path d="M13.6 6.1c2 2.2 4.1 4.1 6.2 5.9-2.2 1.9-4.3 3.9-6.3 6" />
    </svg>
  );
}
