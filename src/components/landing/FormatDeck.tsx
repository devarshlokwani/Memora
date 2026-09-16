"use client";

import { useRef, useState } from "react";

import { FORMAT_ART } from "@/components/landing/formatArt";
import {
  CARD_TYPES,
  MODE_BLURBS,
  MODE_LABELS,
  type CardType,
} from "@/lib/types";

type Face = {
  /** The line above the name: what the format asks of you, in two words. */
  kicker: string;
  /** Initials, for the tag in the corner of the picture. */
  mark: string;
  /** The one word the format is really about, along the foot of the card. */
  foot: string;
  /** What it is good for, which is the part a student has to decide. */
  use: string;
};

const FACES: Record<CardType, Face> = {
  flashcard: {
    kicker: "Self graded",
    mark: "FC",
    foot: "Recall",
    use: "Best for the ideas you have to be able to explain, not just recognise.",
  },
  mcq: {
    kicker: "Four options",
    mark: "MC",
    foot: "Recognition",
    use: "Closest to how most exams ask. The wrong options are real misconceptions.",
  },
  fill_blank: {
    kicker: "Typed answer",
    mark: "FB",
    foot: "Precision",
    use: "For the sentence you need word-perfect: a definition, a law, a formula.",
  },
  match: {
    kicker: "Tap to pair",
    mark: "MP",
    foot: "Connections",
    use: "For sets that blur together: structures and functions, terms and dates.",
  },
  jargon: {
    kicker: "From memory",
    mark: "JD",
    foot: "Vocabulary",
    use: "For vocabulary you must produce from memory, not pick from a list.",
  },
};

/** The middle of the deck, which every place in it is measured from. */
const MID = (CARD_TYPES.length - 1) / 2;

/**
 * The five formats, as a deck of cards rather than a grid of boxes.
 *
 * A grid of five panels with a paragraph in each is a list of features, and
 * nobody reads the fifth one. A deck is something you handle: it sits closed,
 * it spreads under the pointer, and whichever card you are over straightens up
 * and comes to the front with its own drawing on it.
 *
 * It is a fan, not a row. Every card is turned a little further than the one
 * inside it and rides a little lower, so the set sits on an arc the way a hand
 * of cards does. Sliding five upright rectangles apart is the version of this
 * that looks like a slideshow; the turn is what makes it look held.
 *
 * Three numbers do all of it, and all three are written onto the element: how
 * far along the card sits, how far it is turned, and how far it has dropped.
 * React writes them, CSS tweens them, and there is no animation code here.
 *
 * It spreads rather than snaps open, which is a matter of the cards not all
 * arriving at once: the further out a card is, the longer it takes to get where
 * it is going, so the deck opens from the middle and the ends trail after it.
 * One duration for all five made the whole thing move as a single object, which
 * is the one thing a deck of loose cards is not.
 */
export function FormatDeck() {
  /* Opens on the middle of the deck. A fan with the outermost card raised out
     of it is lopsided, and the card nobody can see past is the one at the end
     of the row. */
  const [active, setActive] = useState(Math.floor(CARD_TYPES.length / 2));
  const [over, setOver] = useState<number | null>(null);
  const cardRefs = useRef<(HTMLButtonElement | null)[]>([]);

  const move = (to: number) => {
    const next = (to + CARD_TYPES.length) % CARD_TYPES.length;
    setActive(next);
    cardRefs.current[next]?.focus();
  };

  /* Whichever card is under the pointer is the one at the front, and the one
     clicked is where it returns to when the pointer goes. Pinning the front to
     the click alone meant running along the deck lifted nothing: the card you
     were actually pointing at stayed buried under its neighbour. */
  const front = over ?? active;
  const open = over !== null;
  const chosen = CARD_TYPES[front];

  return (
    <div
      /* Every size the deck is built from, in one place, so the whole thing
         scales with the window instead of needing a breakpoint per piece.
         Clipped sideways and nowhere else: the fan is wider than a phone, and a
         page that scrolls sideways is a broken page, but nothing here is meant
         to look framed. */
      style={
        {
          "--card-w": "clamp(174px, 19vw, 264px)",
          "--card-h": "clamp(312px, 27vw, 368px)",
          "--step": open
            ? "clamp(18px, 8.4vw, 148px)"
            : "clamp(10px, 1.1vw, 16px)",
        } as React.CSSProperties
      }
      className="mt-12 -mx-6 overflow-x-clip sm:-mx-10"
    >
      <div
        role="tablist"
        aria-label="Card formats"
        onMouseLeave={() => setOver(null)}
        onBlur={(event) => {
          if (!event.currentTarget.contains(event.relatedTarget)) setOver(null);
        }}
        onKeyDown={(event) => {
          if (event.key === "ArrowRight") move(active + 1);
          else if (event.key === "ArrowLeft") move(active - 1);
          else return;
          event.preventDefault();
        }}
        className="relative mx-auto h-[calc(var(--card-h)+7rem)] w-full"
      >
        {CARD_TYPES.map((type, i) => {
          const Drawing = FORMAT_ART[type];
          const face = FACES[type];
          const here = i === front;
          const n = i - MID;
          const out = Math.abs(n);
          /* Turned further the further out it sits, and dropped by the square of
             that, which is what puts the set on an arc rather than on a slope.
             The one at the front straightens and stands up out of the fan: a
             card being looked at is a card square to you.

             Closed, the deck is squared up and held a shade narrower than a
             card's own margin, so all that shows behind the front one is blank
             edge. Any wider, or dropped the way the open fan is, and every card
             behind offers up a slice of its own heading, and a stack of
             half-words is not a deck, it is a mess. */
          const turn = n * (open ? 6 : 1.2);
          const arc = open ? out * out * 13 : 0;
          /* The card at the front rises and squares up. It cancels its own place
             in the fan rather than being handed a different one, which is what
             lets the two jobs be timed apart: see the transitions below. */
          const lift = here ? (open ? -30 : -14) : 0;
          /* Closed, a card that is not at the front shows nothing but its own
             blank edge. Leaving the faces on meant the corner tag of every
             card behind poked out of the side of the deck like a row of
             bookmarks, which is not what a stack of cards looks like. */
          const faced = open || here;
          /* The middle of the deck leaves first and the ends trail it, and on
             the way back the ends come home first. Cards that all set off
             together are one object moving; cards that go in order are a deck
             being spread with a thumb. */
          const stagger = open ? out * 62 : (MID - out) * 52;

          return (
            <button
              key={type}
              ref={(el) => {
                cardRefs.current[i] = el;
              }}
              role="tab"
              type="button"
              aria-selected={i === active}
              tabIndex={i === active ? 0 : -1}
              onMouseEnter={() => setOver(i)}
              onFocus={() => setOver(i)}
              onClick={() => setActive(i)}
              style={{
                zIndex: CARD_TYPES.length - Math.abs(i - front),
                transform: `translateX(calc(-50% + (${n}) * var(--step))) translateY(${arc}px) rotate(${turn}deg)`,
                /* Slower the further out it has to go, staggered, and eased so
                   it carries a shade past where it is going and settles back. A
                   deck opens with some weight in it; a straight ease looks like
                   five panes of glass sliding on a rail. */
                transition: `transform ${470 + out * 90}ms cubic-bezier(0.33, 1.24, 0.46, 1) ${stagger}ms`,
              }}
              className="absolute left-1/2 top-10 h-[var(--card-h)] w-[var(--card-w)] origin-bottom text-left motion-reduce:!transition-none"
            >
              {/* The card itself, which answers to the pointer rather than to
                  the deck. A layer of its own, so that rising and squaring up
                  can be quick while the spread underneath stays slow and
                  staggered. One transform for both meant every hover inherited
                  the spread's delay, and a card that lifts half a second after
                  you reach it is a card that feels stuck. */}
              <div
                style={{
                  transform: `translateY(${lift}px) rotate(${here ? -turn : 0}deg)`,
                  transition:
                    "transform 260ms cubic-bezier(0.22, 1.32, 0.4, 1), box-shadow 260ms ease-out",
                }}
                className={`h-full w-full origin-bottom rounded-[1.35rem] bg-card p-2.5 motion-reduce:!transition-none ${
                  here
                    ? "shadow-[0_2px_5px_-2px_rgba(11,9,10,0.18),0_26px_46px_-18px_rgba(11,9,10,0.5)]"
                    : "shadow-[0_2px_4px_-2px_rgba(11,9,10,0.14),0_14px_28px_-16px_rgba(11,9,10,0.4)]"
                }`}
              >
                {/* The picture sits in a well of its own, a shade down from the
                  card, the way a photograph is mounted rather than printed
                  straight onto the board. */}
                <div
                  className={`relative h-[44%] overflow-hidden rounded-[0.95rem] bg-paper-deep transition-opacity duration-300 motion-reduce:transition-none ${
                    faced ? "opacity-100" : "opacity-0"
                  }`}
                >
                  <div className="absolute inset-0 flex items-center justify-center p-[13%] text-ink">
                    <Drawing />
                  </div>

                  <span
                    aria-hidden="true"
                    className="absolute bottom-2 right-2 rounded-full bg-ink px-2 py-[3px] text-[0.6rem] font-semibold tracking-[0.12em] text-paper"
                  >
                    {face.mark}
                  </span>
                </div>

                <div
                  className={`flex h-[56%] flex-col px-2.5 pb-1 pt-3.5 transition-opacity duration-300 motion-reduce:transition-none ${
                    faced ? "opacity-100" : "opacity-0"
                  }`}
                >
                  <p className="text-[0.6rem] font-semibold uppercase tracking-[0.18em] text-ink-soft/70">
                    {face.kicker}
                  </p>
                  <h3 className="mt-1 font-reading text-[1.2rem] leading-tight text-ink">
                    {MODE_LABELS[type]}
                  </h3>
                  <p className="mt-2 text-[0.78rem] leading-relaxed text-ink-soft">
                    {MODE_BLURBS[type]}
                  </p>
                  <div className="mt-auto border-t border-rule-soft pt-2.5">
                    <p className="text-[0.58rem] font-semibold uppercase tracking-[0.18em] text-ink-soft/60">
                      {face.foot}
                    </p>
                  </div>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Whichever card is at the front, said once in full. The cards carry the
          short version; this is the line that decides it for you. */}
      <div
        role="tabpanel"
        aria-live="polite"
        className="mx-auto mt-6 max-w-[54ch] text-center"
      >
        <p className="font-hand text-xl text-ink-faint">{FACES[chosen].use}</p>
      </div>
    </div>
  );
}
