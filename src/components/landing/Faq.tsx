"use client";

import gsap from "gsap";
import { useRef, useState } from "react";

import { SectionIntro } from "@/components/landing/SectionIntro";
import { Marked } from "@/components/ui/Marked";
import { EASE, prefersReducedMotion } from "@/lib/motion";

type Entry = { question: string; answer: string };

/** Answers describe what Memora actually does; none of it is aspirational. */
const ENTRIES: Entry[] = [
  {
    question: "Do I have to organise my notes first?",
    answer:
      "No. Drop in whatever you have — lecture slides, a textbook chapter, your own half-written notes — and Memora reads them together as one body of material. Working out the order is the job it is doing for you.",
  },
  {
    question: "What can I upload?",
    answer:
      "PDF, DOCX, TXT and Markdown, up to twelve files and 25 MB each per course. A scanned PDF with no text layer cannot be read; Memora tells you which file it could not open rather than failing the whole upload.",
  },
  {
    question: "How long does it take?",
    answer:
      "Working out the structure takes a minute or two for a long document. Cards are then written one topic at a time, so you can start studying the first module while the rest is still being written.",
  },
  {
    question: "What if a card is wrong?",
    answer:
      "Edit it or delete it. Open any topic from your course page to see every card it holds. Generated cards are usually right and occasionally not, and one wrong card you keep answering is worse than no card at all.",
  },
  {
    question: "If I add a document later, do I lose my progress?",
    answer:
      "Not for anything that survives. Adding material rebuilds the structure around it; topics that keep their name keep their cards and the review schedule attached to them. Only topics the new structure renames or drops are written again.",
  },
  {
    question: "How does it decide when to show me a card again?",
    answer:
      "Spaced repetition. Every answer adjusts how long that card waits — a card you find easy comes back in weeks, one you miss comes back within the hour. The aim is to meet each card just before you would have forgotten it.",
  },
  {
    question: "Who can see my material?",
    answer:
      "Only you. Every table is protected by a row-level security policy that matches rows to your account, and uploaded files live in a private bucket scoped to your user id.",
  },
];

export function Faq() {
  const [open, setOpen] = useState<number | null>(0);
  const panels = useRef<(HTMLDivElement | null)[]>([]);

  const toggle = (index: number) => {
    const next = open === index ? null : index;
    setOpen(next);

    for (let i = 0; i < ENTRIES.length; i++) {
      const panel = panels.current[i];
      if (!panel) continue;
      const target = i === next ? panel.scrollHeight : 0;

      if (prefersReducedMotion()) {
        gsap.set(panel, { height: target });
      } else {
        gsap.to(panel, { height: target, duration: 0.42, ease: EASE });
      }
    }
  };

  return (
    <div className="mx-auto max-w-3xl">
      <SectionIntro
        eyebrow="Before you ask,"
        title={<>Questions, <Marked>answered</Marked></>}
        blurb="The things people want to know before they hand over a term's worth of notes."
      />

      <ul className="mt-12 border-t border-dashed border-rule">
        {ENTRIES.map((entry, index) => {
          const isOpen = open === index;
          return (
            <li key={entry.question} className="border-b border-dashed border-rule">
              <h3>
                <button
                  type="button"
                  onClick={() => toggle(index)}
                  aria-expanded={isOpen}
                  className="flex w-full items-center justify-between gap-6 py-5 text-left"
                >
                  <span className="text-[1.05rem] leading-snug text-ink">{entry.question}</span>
                  <PlusMark open={isOpen} />
                </button>
              </h3>

              <div
                ref={(el) => {
                  panels.current[index] = el;
                }}
                className="overflow-hidden"
                style={{ height: index === 0 ? "auto" : 0 }}
              >
                <p className="max-w-[62ch] pb-6 text-[0.95rem] leading-relaxed text-ink-soft">
                  {entry.answer}
                </p>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

/** A drawn plus that turns into a cross when its answer is open. */
function PlusMark({ open }: { open: boolean }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-5 w-5 shrink-0 text-ink transition-transform duration-300"
      style={{ transform: open ? "rotate(135deg)" : "rotate(0deg)" }}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      aria-hidden="true"
    >
      <path d="M12 3.4c.3 5.6.2 11.4-.1 17.2" />
      <path d="M3.3 11.8c5.7-.3 11.5-.2 17.4.1" />
    </svg>
  );
}
