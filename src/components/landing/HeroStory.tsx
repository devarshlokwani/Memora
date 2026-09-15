"use client";

import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useLayoutEffect, useRef } from "react";

import { StoryStage, type Beat } from "@/components/landing/StoryStage";
import { prefersReducedMotion } from "@/lib/motion";

gsap.registerPlugin(ScrollTrigger);

/**
 * The introduction to Memora, told by turning a brain round and labelling it.
 *
 * A tall track with the stage stuck to the top of it: the page scrolls, the
 * stage does not, and how far you have come is what turns the brain and brings
 * each label up. The whole of what Memora does gets said in five stops.
 *
 * The turn is deliberately the slow part. There is no way to read a label on
 * something that is still moving, so each stop holds still while its label is
 * up and only turns once the label has gone.
 */

/* The turn for each stop is the angle that brings its part of the brain round
   to face you: -atan2(x, z) of the anchor. They run in one direction the whole
   way through, because a brain that turns back on itself reads as a mistake
   rather than as a camera move. */
const BEATS: Beat[] = [
  {
    anchor: [0.18, 0.42, 0.85],
    turn: -0.21,
    tilt: 0.06,
    side: "right",
    title: "Hand over the PDF",
    body: "Lecture slides, a textbook chapter, your own half-written notes. Up to twelve files, read together as one body of material.",
    aside: "pdf · docx · pptx · md · txt",
    props: [
      { kind: { art: "sheet", name: "lecture-04.pdf" }, x: 0.1, y: 0.2, size: 0.09, tilt: -7 },
      { kind: { art: "sheet", name: "chapter-9.pdf" }, x: 0.29, y: 0.83, size: 0.085, tilt: 5 },
      { kind: { art: "sheet", name: "my-notes.md" }, x: 0.55, y: 0.12, size: 0.078, tilt: 3 },
    ],
  },
  {
    anchor: [0.92, -0.28, 0.24],
    turn: -1.32,
    tilt: -0.05,
    side: "left",
    title: "Get a course, not a pile",
    body: "Memora finds the themes, orders them the way you should learn them, and splits each into topics worth a single sitting.",
    aside: "modules, then topics",
    props: [
      { kind: { art: "branch" }, x: 0.88, y: 0.24, size: 0.13, tilt: 2 },
      { kind: { art: "sheet", name: "chapter-9.pdf" }, x: 0.7, y: 0.85, size: 0.07, tilt: -6 },
    ],
  },
  {
    anchor: [-0.1, 0.25, -0.92],
    turn: -3.25,
    tilt: 0.02,
    side: "right",
    title: "Five ways to be asked",
    body: "Flashcards, multiple choice, fill-in-the-blank, matching, jargon drills. One topic, five different demands on you.",
    aside: "recognition is not recall",
    props: [
      { kind: { art: "format", label: "Flashcard" }, x: 0.11, y: 0.18, size: 0.1, tilt: -6 },
      { kind: { art: "format", label: "Multiple choice", inverted: true }, x: 0.3, y: 0.85, size: 0.1, tilt: 4 },
      { kind: { art: "format", label: "Match" }, x: 0.56, y: 0.11, size: 0.085, tilt: 7 },
    ],
  },
  {
    anchor: [0, -0.5, -0.78],
    turn: -3.4,
    tilt: -0.42,
    side: "left",
    title: "Answers from your own words",
    body: "Your documents are split into numbered passages, and every card is written from the ones its topic came out of.",
    aside: "traced, not invented",
    props: [
      { kind: { art: "passage" }, x: 0.87, y: 0.2, size: 0.14, tilt: 3 },
      { kind: { art: "format", label: "Flashcard" }, x: 0.72, y: 0.84, size: 0.085, tilt: -5 },
    ],
  },
  {
    anchor: [-0.35, 0.88, -0.1],
    turn: -4.43,
    tilt: 0.45,
    side: "right",
    title: "Back the day you would forget",
    body: "Answer a card and Memora schedules it for the day it was about to slip away from you — and not a day before.",
    aside: "1d · 3d · 8d · 21d",
    props: [
      { kind: { art: "curve" }, x: 0.13, y: 0.2, size: 0.155, tilt: -2 },
      { kind: { art: "format", label: "Jargon" }, x: 0.34, y: 0.85, size: 0.085, tilt: 6 },
    ],
  },
];

/** Past this the story is told and the way onward is offered. */
const OFFER_AT = 0.9;

export function HeroStory({ onEnd }: { onEnd: (ended: boolean) => void }) {
  const trackRef = useRef<HTMLDivElement>(null);
  const introRef = useRef<HTMLDivElement>(null);
  const outroRef = useRef<HTMLDivElement>(null);
  const progress = useRef(0);
  const ended = useRef(false);

  useLayoutEffect(() => {
    const track = trackRef.current;
    // Nothing to drive when the story is told as plain text below.
    if (!track) return;

    const context = gsap.context(() => {
      ScrollTrigger.create({
        trigger: track,
        start: "top top",
        end: "bottom bottom",
        onUpdate: (self) => {
          const p = self.progress;
          progress.current = p;

          // Written straight onto the nodes: this runs on every scroll event,
          // and putting it through state would re-render the whole story.
          if (introRef.current) {
            introRef.current.style.opacity = String(Math.max(0, 1 - p / 0.06));
          }
          if (outroRef.current) {
            outroRef.current.style.opacity = String(Math.min(1, Math.max(0, (p - 0.88) / 0.06)));
          }

          const offer = p > OFFER_AT;
          if (offer !== ended.current) {
            ended.current = offer;
            onEnd(offer);
          }
        },
      });
    }, track);

    return () => {
      context.revert();
      onEnd(false);
    };
    // onEnd is a setter from the shell and stable for the life of the story.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* Told as a list when animation is switched off. There is no bar at the foot
     of it either: the bar exists to say the story has ended and there is more,
     and a list that simply finishes has already said that. The nav at the top
     of the page is where it always was. */
  if (prefersReducedMotion()) {
    return (
      <div className="mx-auto max-w-3xl px-6 py-16">
        <p className="font-hand text-2xl text-ink-soft">Hand over the PDF,</p>
        <h1 className="mt-3 font-reading text-[2.8rem] leading-[1.06] text-ink">This is Memora</h1>
        <ol className="mt-10 space-y-8">
          {BEATS.map((beat, i) => (
            <li key={beat.title}>
              <p className="font-hand text-lg text-accent">0{i + 1}</p>
              <h2 className="mt-1 font-reading text-[1.6rem] text-ink">{beat.title}</h2>
              <p className="mt-2 text-[0.98rem] leading-relaxed text-ink-soft">{beat.body}</p>
            </li>
          ))}
        </ol>
      </div>
    );
  }

  return (
    <>
      {/* Eight screens of scroll for seven moments — an opening, five stops and
          a close. It was five and a half, which was enough when a stop was a
          brain and a caption; with a stop now being several drawn things writing
          themselves in, the same distance made every one of them a flicker. The
          beats are laid out as fractions of this, so lengthening it slows the
          whole telling evenly rather than stretching any one part of it. */}
      <div ref={trackRef} className="relative h-[800vh]">
        {/* Stuck to the window while the track scrolls past behind it. Nothing
            above this may clip its overflow, or it stops sticking. */}
        <div className="sticky top-0 h-[100svh] overflow-hidden">
          <StoryStage beats={BEATS} progress={progress} className="h-full w-full" />

          <div
            ref={introRef}
            className="pointer-events-none absolute inset-x-0 top-[12%] text-center"
          >
            <p className="font-hand text-2xl text-ink-soft">Hand over the PDF,</p>
            <h1 className="mt-2 font-reading text-[3rem] leading-[1.02] tracking-[-0.02em] text-ink sm:text-[4.6rem]">
              This is Memora
            </h1>
            <p className="mt-6 font-hand text-lg text-ink-faint">scroll &darr;</p>
          </div>

          <div
            ref={outroRef}
            style={{ opacity: 0 }}
            className="pointer-events-none absolute inset-x-0 top-[14%] text-center"
          >
            <p className="font-hand text-2xl text-ink-soft">And that is the whole of it,</p>
            <h2 className="mt-2 font-reading text-[2.4rem] leading-[1.06] tracking-[-0.015em] text-ink sm:text-[3.4rem]">
              Start wherever you like
            </h2>
          </div>
        </div>
      </div>
    </>
  );
}
