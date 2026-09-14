"use client";

import gsap from "gsap";
import { useLayoutEffect, useRef, useState } from "react";

import { ScoreTable, type Result } from "@/components/landing/ScoreTable";
import { DrawnMark } from "@/components/ui/DrawnMark";
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

/**
 * One pile, cycling. Depth 0 is the card you are on and every other card sits
 * further down the stack, showing only its bottom edge. Answering sends a card
 * round to the deepest place rather than off the page — a deck of five always
 * has five cards in it, and the pile never thins out as you work through it.
 */
function slotFor(depth: number) {
  return {
    x: 0,
    y: depth * 9,
    rotate: 0,
    scale: 1 - depth * 0.022,
    opacity: 1,
    zIndex: 60 - depth,
  };
}

export function DemoCard() {
  const [index, setIndex] = useState(0);
  // Flip state per card, not one shared flag. A single flag turns the card you
  // just answered face-up again while it is still travelling, and you watch it
  // flip over mid-flight.
  const [flipped, setFlipped] = useState<boolean[]>(() => DECK.map(() => false));
  const [results, setResults] = useState<Result[]>(() => DECK.map(() => null));

  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);
  const previous = useRef<number | null>(null);

  const grade = results[index];
  const knew = results.filter((r) => r === "knew").length;
  const answered = results.filter(Boolean).length;

  useLayoutEffect(() => {
    const reduce = prefersReducedMotion();

    const total = DECK.length;

    DECK.forEach((_, i) => {
      const el = cardRefs.current[i];
      if (!el) return;

      const depth = (i - index + total) % total;
      const slot = slotFor(depth);
      const firstPaint = previous.current === null;
      const justAnswered = previous.current === i && depth !== 0;

      if (firstPaint || reduce) {
        gsap.set(el, slot);
        return;
      }

      if (justAnswered) {
        // Steps out on the diagonal, dims as it passes behind the pile, then
        // slides into the deepest place. The dimming is the card going behind,
        // not the card leaving: it is fully there again by the time it lands.
        gsap
          .timeline({
            // Turned face-up again only at the very end, buried in the pile,
            // where nobody can see it happen.
            onComplete: () =>
              setFlipped((f) => f.map((v, n) => (n === i ? false : v))),
          })
          .to(el, {
            x: 132,
            y: -52,
            rotate: 9,
            scale: 0.97,
            duration: 0.28,
            ease: "power2.out",
          })
          .to(el, { opacity: 0.2, duration: 0.12, ease: "power1.in" })
          .set(el, { zIndex: slot.zIndex })
          .to(el, { ...slot, duration: 0.34, ease: "power2.inOut" });
      } else {
        gsap.set(el, { zIndex: slot.zIndex });
        gsap.to(el, { ...slot, duration: 0.55, ease: "power3.out" });
      }
    });

    previous.current = index;
  }, [index]);

  function mark(value: Grade) {
    if (grade) return;
    setResults((r) => r.map((existing, i) => (i === index ? value : existing)));
  }

  // Round and round. The deck does not end, it comes back to the first card —
  // which is what a deck of cards does.
  function advance() {
    setIndex((i) => (i + 1) % DECK.length);
  }

  function restart() {
    setResults(DECK.map(() => null));
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
              // Everything but the front card is decoration: not clickable, not
              // in the tab order, not read out.
              inert={!isFront}
              aria-hidden={!isFront}
            >
              <div className="flip-scene h-full w-full">
                <div
                  className="flip-inner relative h-full w-full"
                  data-flipped={flipped[i]}
                >
                  <div className="flip-face absolute inset-0" inert={flipped[i]}>
                    <SketchFrame seed={card.id} invert={inverted} />
                    <button
                      type="button"
                      onClick={() => setFlipped((f) => f.map((v, n) => (n === i ? true : v)))}
                      className="relative flex h-full w-full flex-col justify-between p-8 text-left"
                    >
                      <span className="flex items-baseline justify-between gap-4">
                        <span className={`font-hand text-lg ${faint}`}>{card.topic}</span>
                        <span className={`font-hand text-lg ${faint}`}>
                          {i + 1} / {DECK.length}
                        </span>
                      </span>
                      <span className={`font-reading text-[1.6rem] leading-snug ${ink}`}>
                        {card.front}
                      </span>
                      <span className={`font-hand text-lg ${faint}`}>turn me over &rarr;</span>
                    </button>
                  </div>

                  <div
                    className="flip-face flip-face-back absolute inset-0"
                    inert={!flipped[i]}
                  >
                    <SketchFrame seed={`${card.id}-back`} invert={inverted} />
                    <div className="relative flex h-full flex-col p-8">
                      <span className="flex items-baseline justify-between gap-4">
                        <span className={`font-hand text-lg ${faint}`}>the answer</span>
                        <span className={`font-hand text-lg ${faint}`}>
                          {i + 1} / {DECK.length}
                        </span>
                      </span>

                      {/* The judgement lands in the empty space under the label,
                          where the eye already is. */}
                      <div className="grid flex-1 place-items-center">
                        {grade !== null && isFront && (
                          <DrawnMark type={grade} className="h-14 w-14" />
                        )}
                      </div>

                      <p className={`font-reading text-[1.2rem] leading-relaxed ${ink}`}>
                        {card.back}
                      </p>

                      {grade === null ? (
                        <div className="mt-6 flex items-center gap-3">
                          <GradeButton
                            tone="missed"
                            inverted={inverted}
                            onClick={() => mark("missed")}
                          >
                            Missed it
                          </GradeButton>
                          <GradeButton
                            tone="knew"
                            inverted={inverted}
                            onClick={() => mark("knew")}
                          >
                            Knew it
                          </GradeButton>
                        </div>
                      ) : (
                        <div className="mt-6 flex items-center justify-end">
                          <button
                            type="button"
                            onClick={advance}
                            // Always "next": the deck loops, so nothing is ever finished.
                            aria-label="Next card"
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

      <div className="mt-12">
        <ScoreTable results={results} />
      </div>

      {answered === DECK.length && (
        <div className="mt-8 text-center">
          <p className="font-reading text-[1.4rem] leading-snug text-ink">
            {knew} of {DECK.length}, first time through.
          </p>
          <p className="mx-auto mt-2 max-w-[42ch] text-[0.95rem] leading-relaxed text-ink-soft">
            With your own material, the ones you missed come back first and the rest wait until
            you are about to forget them.
          </p>
          <div className="mt-5 flex flex-wrap items-center justify-center gap-4">
            <PushButton href="/signup" size="sm">
              Build my first course
            </PushButton>
            <button
              type="button"
              onClick={restart}
              className="font-hand text-lg text-ink-faint underline-offset-4 hover:text-ink hover:underline"
            >
              clear the sheet
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Ink until you reach for it. Colour arrives on hover and stays for the press,
 * so the card is still monochrome at rest and the two choices only separate
 * themselves at the moment you are actually choosing between them.
 */
function GradeButton({
  tone,
  inverted,
  onClick,
  children,
}: {
  tone: Grade;
  inverted: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  const colour = tone === "knew" ? "var(--color-knew)" : "var(--color-missed)";
  const rest = inverted ? "border-paper text-paper" : "border-ink text-ink";

  return (
    <button
      type="button"
      onClick={onClick}
      style={{ ["--tone" as string]: colour } as React.CSSProperties}
      className={`rounded-full border-[1.5px] bg-transparent px-4 py-2 text-[0.9rem] font-medium transition-colors duration-200 hover:border-[var(--tone)] hover:text-[var(--tone)] focus-visible:border-[var(--tone)] focus-visible:text-[var(--tone)] active:border-[var(--tone)] active:text-[var(--tone)] ${rest}`}
    >
      {children}
    </button>
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
