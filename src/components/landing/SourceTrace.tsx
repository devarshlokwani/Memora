"use client";

import gsap from "gsap";
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";

import { SketchCard } from "@/components/ui/SketchFrame";
import { EASE, prefersReducedMotion } from "@/lib/motion";

/**
 * The claim on this part of the page is that an answer traces back to something
 * in your own material. This is that claim, shown: pick a card and the passages
 * it was written from light up, with a line drawn between them.
 *
 * The text is a real worked example rather than lorem — the point does not land
 * if the passage and the answer do not visibly say the same thing.
 */

const HOLD = 5600;
/** Below this the columns stack, and a line between them would cross the text. */
const CONNECT_AT = 880;

const PASSAGES = [
  {
    id: "C0",
    text: "Glycolysis takes place in the cytoplasm and does not require oxygen. One glucose molecule is split into two molecules of pyruvate.",
  },
  {
    id: "C1",
    text: "Four ATP are produced during glycolysis, but two are spent in the preparatory phase, so the net yield is 2 ATP and 2 NADH per glucose.",
  },
  {
    id: "C2",
    text: "Pyruvate then moves into the mitochondrial matrix, where the link reaction converts it to acetyl-CoA and releases carbon dioxide.",
  },
  {
    id: "C3",
    text: "Oxidative phosphorylation accounts for most of the ATP made in aerobic respiration — roughly 26 to 28 of the 30 to 32 produced per glucose.",
  },
];

const CARDS = [
  {
    from: ["C0"],
    question: "Where in the cell does glycolysis happen, and does it need oxygen?",
    answer:
      "In the cytoplasm — and no. Glycolysis is anaerobic; it splits one glucose into two pyruvate without oxygen.",
  },
  {
    from: ["C1"],
    question: "Why is the net ATP yield of glycolysis 2 rather than 4?",
    answer:
      "Two ATP are spent in the preparatory phase. Four made minus two used leaves a net 2 ATP, alongside 2 NADH.",
  },
  {
    from: ["C1", "C3"],
    question: "Where does most of the ATP in aerobic respiration actually come from?",
    answer:
      "Oxidative phosphorylation — about 26 to 28 of the 30 to 32 ATP per glucose. Glycolysis contributes only 2 of them.",
  },
];

export function SourceTrace() {
  const [index, setIndex] = useState(0);
  const [auto, setAuto] = useState(true);
  const [seen, setSeen] = useState(false);

  const hostRef = useRef<HTMLDivElement>(null);
  const passageRefs = useRef<Record<string, HTMLElement | null>>({});
  const cardRef = useRef<HTMLDivElement>(null);
  const linesRef = useRef<SVGSVGElement>(null);

  const card = CARDS[index];
  const cited = new Set(card.from);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    const observer = new IntersectionObserver(([entry]) => setSeen(entry.isIntersecting), {
      threshold: 0.3,
    });
    observer.observe(host);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!auto || !seen || prefersReducedMotion()) return;
    const timer = window.setInterval(() => setIndex((i) => (i + 1) % CARDS.length), HOLD);
    return () => window.clearInterval(timer);
  }, [auto, seen]);

  /**
   * The line is drawn from the live positions of the two ends rather than from
   * fixed coordinates: the passage a card cites changes, the text rewraps at
   * every width, and both columns move when it does.
   */
  const drawLines = useCallback(() => {
    const host = hostRef.current;
    const svg = linesRef.current;
    const target = cardRef.current;
    if (!host || !svg || !target) return;

    const box = host.getBoundingClientRect();
    svg.setAttribute("viewBox", `0 0 ${box.width} ${box.height}`);

    if (box.width < CONNECT_AT) {
      svg.replaceChildren();
      return;
    }

    const card = target.getBoundingClientRect();
    const x2 = card.left - box.left - 2;
    const y2 = card.top - box.top + card.height / 2;

    const paths = CARDS[index].from.flatMap((id) => {
      const node = passageRefs.current[id];
      if (!node) return [];
      const from = node.getBoundingClientRect();
      const x1 = from.right - box.left + 2;
      const y1 = from.top - box.top + from.height / 2;
      const bend = (x2 - x1) * 0.55;

      const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
      path.setAttribute("d", `M${x1} ${y1}C${x1 + bend} ${y1} ${x2 - bend} ${y2} ${x2} ${y2}`);
      path.setAttribute("fill", "none");
      path.setAttribute("stroke", "var(--color-accent)");
      path.setAttribute("stroke-width", "1.4");
      path.setAttribute("stroke-dasharray", "5 6");
      path.setAttribute("stroke-linecap", "round");
      path.setAttribute("opacity", "0.75");
      return [path];
    });

    svg.replaceChildren(...paths);
  }, [index]);

  useLayoutEffect(() => {
    drawLines();
    const host = hostRef.current;
    if (!host) return;
    const observer = new ResizeObserver(drawLines);
    observer.observe(host);
    window.addEventListener("resize", drawLines);
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", drawLines);
    };
  }, [drawLines]);

  // The card is replaced outright when it changes, so it should arrive rather
  // than have its words swapped underneath a frame that never moved.
  useLayoutEffect(() => {
    const target = cardRef.current;
    const svg = linesRef.current;
    if (!target || prefersReducedMotion()) return;

    const context = gsap.context(() => {
      gsap.fromTo(target, { opacity: 0, y: 12 }, { opacity: 1, y: 0, duration: 0.45, ease: EASE });
      if (svg) {
        gsap.fromTo(
          svg,
          { clipPath: "inset(0 100% 0 0)" },
          { clipPath: "inset(0 0% 0 0)", duration: 0.6, ease: "power2.out", delay: 0.1 },
        );
      }
    });

    return () => context.revert();
  }, [index]);

  const choose = (next: number) => {
    setIndex(next);
    setAuto(false);
  };

  return (
    <div ref={hostRef} className="relative mt-10">
      <svg
        ref={linesRef}
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 h-full w-full overflow-visible"
        preserveAspectRatio="none"
      />

      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.92fr)] lg:gap-14 lg:items-center">
        <div>
          <p className="font-hand text-lg text-ink-soft">Your material, split into passages</p>
          <ul className="mt-4 space-y-2">
            {PASSAGES.map((passage) => {
              const on = cited.has(passage.id);
              // The card that cites this passage, so a passage is a way in too.
              const owner = CARDS.findIndex((c) => c.from.includes(passage.id));
              return (
                <li
                  key={passage.id}
                  ref={(el) => {
                    passageRefs.current[passage.id] = el;
                  }}
                >
                  <button
                    type="button"
                    onClick={() => choose(owner === -1 ? index : owner)}
                    aria-pressed={on}
                    className={`flex w-full gap-3 rounded-2xl border px-3.5 py-3 text-left transition-colors duration-300 ${
                      on
                        ? "border-accent/60 bg-card text-ink"
                        : "border-dashed border-rule bg-transparent text-ink-soft/80 hover:border-rule hover:text-ink-soft"
                    }`}
                  >
                    <span
                      className={`mt-px shrink-0 font-hand text-base ${
                        on ? "text-accent" : "text-ink-faint/70"
                      }`}
                    >
                      [{passage.id}]
                    </span>
                    <span className="text-[0.9rem] leading-relaxed">{passage.text}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>

        <div>
          <div className="flex items-baseline justify-between">
            <p className="font-hand text-lg text-ink-soft">The card it wrote</p>
            <p className="text-[0.8rem] text-ink-soft/70">
              {index + 1} of {CARDS.length}
            </p>
          </div>

          <div ref={cardRef} className="mt-4">
            <SketchCard seed={`trace-${index}`} tilt={false}>
              <div className="px-6 py-6">
                <p className="font-hand text-base text-ink-faint">Question</p>
                <p className="mt-1 font-reading text-[1.2rem] leading-snug text-ink">
                  {card.question}
                </p>
                <p className="mt-5 font-hand text-base text-ink-faint">Answer</p>
                <p className="mt-1 text-[0.95rem] leading-relaxed text-ink-soft">{card.answer}</p>
                <p className="mt-5 border-t border-dashed border-rule pt-3 text-[0.82rem] text-ink-soft">
                  traced to{" "}
                  <span className="text-accent">
                    {card.from.map((id) => `[${id}]`).join(" and ")}
                  </span>{" "}
                  in your material
                </p>
              </div>
            </SketchCard>
          </div>

          <div className="mt-4 flex items-center gap-2">
            {CARDS.map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => choose(i)}
                aria-label={`Card ${i + 1}`}
                aria-pressed={i === index}
                className={`h-2.5 w-2.5 rounded-full border transition-colors ${
                  i === index
                    ? "border-accent bg-accent"
                    : "border-rule bg-transparent hover:border-ink"
                }`}
              />
            ))}
            <span className="ml-2 text-[0.82rem] text-ink-soft/70">
              or click a passage to see what it produced
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
