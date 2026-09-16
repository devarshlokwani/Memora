"use client";

import gsap from "gsap";
import { useEffect, useLayoutEffect, useRef, useState } from "react";

import { CARD, CARD_QUIET, CARD_REST } from "@/components/ui/card";
import { prefersReducedMotion } from "@/lib/motion";

/**
 * A course being written, one module at a time, so "you can start before it has
 * finished" is something you watch happen rather than a sentence to take on
 * trust. It runs on a loop while it is on screen and stops when it is not.
 */

const MODULES = [
  { title: "Cell structure", cards: 24 },
  { title: "Respiration", cards: 31 },
  { title: "Photosynthesis", cards: 27 },
];

const WRITE = 2.1;
const PAUSE = 0.5;

type State = "done" | "writing" | "queued";

export function BuildProgress() {
  const hostRef = useRef<HTMLDivElement>(null);
  const barRefs = useRef<(HTMLDivElement | null)[]>([]);
  const [states, setStates] = useState<State[]>(["queued", "queued", "queued"]);
  const [seen, setSeen] = useState(false);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    const observer = new IntersectionObserver(
      ([entry]) => setSeen(entry.isIntersecting),
      {
        threshold: 0.4,
      },
    );
    observer.observe(host);
    return () => observer.disconnect();
  }, []);

  // With animation switched off there is nothing to wait for: show a course
  // mid-build as a still, rather than three rows that say queued for ever.
  useLayoutEffect(() => {
    if (!prefersReducedMotion()) return;
    setStates(["done", "writing", "queued"]);
    barRefs.current.forEach((bar, i) => {
      if (bar) gsap.set(bar, { scaleX: i === 0 ? 1 : i === 1 ? 0.55 : 0 });
    });
  }, []);

  useLayoutEffect(() => {
    if (!seen || prefersReducedMotion()) return;

    const mark = (i: number, state: State) =>
      setStates((current) =>
        current.map((value, n) => (n === i ? state : value)),
      );

    const timeline = gsap.timeline({ repeat: -1, repeatDelay: 1.4 });

    timeline.call(() => {
      setStates(["queued", "queued", "queued"]);
      barRefs.current.forEach((bar) => bar && gsap.set(bar, { scaleX: 0 }));
    });

    MODULES.forEach((_, i) => {
      timeline
        .call(() => mark(i, "writing"))
        .to(barRefs.current[i], {
          scaleX: 1,
          duration: WRITE,
          ease: "power1.inOut",
        })
        .call(() => mark(i, "done"))
        .to({}, { duration: PAUSE });
    });

    return () => {
      timeline.kill();
    };
  }, [seen]);

  return (
    <div ref={hostRef} className="mt-8">
      <ul className="space-y-2.5">
        {MODULES.map((module, i) => {
          const state = states[i];
          return (
            <li
              key={module.title}
              /* Same card as everywhere else, lying flat until it is being
                 written and picked up off the page once it is. */
              className={`px-4 py-3 transition-shadow duration-500 motion-reduce:transition-none ${CARD} ${
                state === "queued" ? CARD_QUIET : CARD_REST
              }`}
            >
              <div className="flex items-baseline justify-between gap-3">
                <p
                  className={`text-[0.95rem] ${
                    state === "queued" ? "text-ink-soft/70" : "text-ink"
                  }`}
                >
                  <span className="font-hand text-base text-ink-faint">
                    Module {i + 1}
                  </span>{" "}
                  {module.title}
                </p>
                <p className="shrink-0 text-[0.8rem] text-ink-soft">
                  {state === "done"
                    ? `${module.cards} cards · ready`
                    : state === "writing"
                      ? "writing…"
                      : "queued"}
                </p>
              </div>

              {/* A track that is always there, so a queued module reads as
                  waiting its turn rather than as nothing at all. */}
              <div className="mt-2.5 h-[3px] w-full overflow-hidden rounded-full bg-rule-soft">
                <div
                  ref={(el) => {
                    barRefs.current[i] = el;
                  }}
                  className="h-full w-full origin-left rounded-full bg-ink"
                  style={{ transform: "scaleX(0)" }}
                />
              </div>
            </li>
          );
        })}
      </ul>

      <p className="mt-4 font-hand text-lg text-ink-soft">
        Module 1 is drillable while module 3 is still being written.
      </p>
    </div>
  );
}
