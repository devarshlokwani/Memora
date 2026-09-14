"use client";

import { useState } from "react";

import { SketchFrame } from "@/components/ui/SketchFrame";

type Sample = {
  id: string;
  topic: string;
  front: string;
  back: string;
};

/** Three real cards from three different subjects, so the deck reads as a course. */
const DECK: Sample[] = [
  {
    id: "deck-membrane",
    topic: "Cell Biology — membrane transport",
    front: "Why can a sodium–potassium pump move ions against their concentration gradient?",
    back: "It is active transport: the pump hydrolyses ATP, and that energy drives the conformational change carrying 3 Na⁺ out and 2 K⁺ in.",
  },
  {
    id: "deck-contract",
    topic: "Contract Law — formation",
    front: "What turns an invitation to treat into an offer?",
    back: "A clear statement of terms the offeror intends to be bound by on acceptance. A shop display is an invitation; a signed quote naming price and quantity is an offer.",
  },
  {
    id: "deck-algorithms",
    topic: "Algorithms — complexity",
    front: "Why is binary search O(log n) rather than O(n)?",
    back: "Each comparison discards half the remaining range, so the number of steps is the number of times n can be halved before reaching one.",
  },
];

/**
 * A small deck rather than a single card: the ones behind are visible at the
 * edges, so the page shows a course rather than one example. The stack
 * alternates ink-on-paper and paper-on-ink as you move through it, which is what
 * makes a pile of cards read as a pile rather than one card redrawn.
 */
export function DemoCard() {
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);

  const card = DECK[index];
  const inverted = index % 2 === 1;

  const advance = () => {
    setFlipped(false);
    setIndex((i) => (i + 1) % DECK.length);
  };

  const ink = inverted ? "text-paper" : "text-ink";
  const faint = inverted ? "text-paper/55" : "text-ink-faint";

  return (
    <div className="w-full max-w-lg">
      <div className="relative">
        {/* The rest of the deck, peeking out behind. Purely visual. */}
        <div
          aria-hidden="true"
          className="absolute inset-x-0 top-0 h-full"
          style={{ transform: "rotate(-3.2deg) translate(-14px, 10px)" }}
        >
          <SketchFrame seed="deck-back-two" invert={!inverted} />
        </div>
        <div
          aria-hidden="true"
          className="absolute inset-x-0 top-0 h-full"
          style={{ transform: "rotate(2.1deg) translate(9px, 5px)" }}
        >
          <SketchFrame seed="deck-back-one" invert={inverted} />
        </div>

        <button
          type="button"
          onClick={() => setFlipped((f) => !f)}
          aria-pressed={flipped}
          className="flip-scene relative block w-full text-left"
          style={{ transform: "rotate(-0.6deg)" }}
        >
          <span className="flip-inner relative block h-[21rem] w-full" data-flipped={flipped}>
            <span className="flip-face absolute inset-0 block">
              <SketchFrame seed={card.id} invert={inverted} />
              <span className="relative flex h-full flex-col justify-between p-9">
                <span className={`font-hand text-lg ${faint}`}>{card.topic}</span>
                <span className={`font-reading text-[1.7rem] leading-snug ${ink}`}>
                  {card.front}
                </span>
                <span className={`font-hand text-lg ${faint}`}>turn me over &rarr;</span>
              </span>
            </span>

            <span className="flip-face flip-face-back absolute inset-0 block">
              <SketchFrame seed={`${card.id}-back`} invert={inverted} />
              <span className="relative flex h-full flex-col justify-between p-9">
                <span className={`font-hand text-lg ${faint}`}>the answer</span>
                <span className={`font-reading text-[1.3rem] leading-relaxed ${ink}`}>
                  {card.back}
                </span>
                <span className={`flex gap-3 font-hand text-lg ${faint}`}>
                  <span>missed it</span>
                  <span aria-hidden="true">&middot;</span>
                  <span className={ink}>knew it</span>
                </span>
              </span>
            </span>
          </span>
        </button>
      </div>

      <div className="mt-7 flex items-center justify-center gap-5">
        <button
          type="button"
          onClick={advance}
          className="rounded-full border border-ink px-5 py-2 text-sm font-medium text-ink transition-colors hover:bg-ink hover:text-paper"
        >
          Next card
        </button>
        <span className="font-hand text-lg text-ink-faint">
          {index + 1} of {DECK.length}
        </span>
      </div>
    </div>
  );
}
