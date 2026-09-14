import Link from "next/link";
import { redirect } from "next/navigation";
import { Suspense } from "react";

import { DemoCard } from "@/components/landing/DemoCard";
import { Faq } from "@/components/landing/Faq";
import { LandingShell } from "@/components/landing/LandingShell";
import { SketchCard } from "@/components/ui/SketchFrame";
import { CARD_TYPES, MODE_BLURBS, MODE_LABELS } from "@/lib/types";
import { getUser } from "@/server/db/client";

const STEPS = [
  {
    title: "Drop in your material",
    body: "Lecture slides, a textbook chapter, your own notes. Up to twelve files at once — Memora reads them together as one body of material rather than one file at a time.",
  },
  {
    title: "Get a course, not a pile",
    body: "It works out the themes, orders them the way you should learn them, and splits each into topics worth a single sitting.",
  },
  {
    title: "Drill it your way",
    body: "Every topic becomes cards in five formats. Answer them and Memora schedules each card for the day you were about to forget it.",
  },
];

/** What each format is actually good for — the part a student has to decide. */
const FORMAT_USES: Record<string, string> = {
  flashcard: "Best for the ideas you have to be able to explain, not just recognise.",
  mcq: "Closest to how most exams ask. The wrong options are real misconceptions.",
  fill_blank: "For the sentence you need word-perfect — a definition, a law, a formula.",
  match: "For sets that blur together: structures and functions, terms and dates.",
  jargon: "For vocabulary you must produce from memory, not pick from a list.",
};

function Fact({ figure, label }: { figure: string; label: string }) {
  return (
    <div>
      <p className="font-reading text-[2rem] leading-none text-ink">{figure}</p>
      <p className="mt-2 text-[0.9rem] leading-relaxed text-ink-soft">{label}</p>
    </div>
  );
}

function TrySection() {
  return (
    <div className="text-center">
      <p className="font-hand text-2xl text-ink-soft">Dear crammers,</p>
      <h1 className="mx-auto mt-3 max-w-[18ch] font-reading text-[2.6rem] leading-[1.05] tracking-[-0.015em] text-ink sm:text-[3.6rem]">
        Hand over the PDF. Get back a way to <span className="marked">study it</span>.
      </h1>
      <p className="mx-auto mt-5 max-w-[46ch] text-[1.05rem] leading-relaxed text-ink-soft">
        Memora reads your course material, builds the structure your lecturer never gave you, and
        turns every topic into cards you can actually drill.
      </p>
      <Link
        href="/signup"
        className="mt-7 inline-block rounded-full bg-ink px-8 py-3.5 text-[1rem] font-medium text-paper transition-opacity hover:opacity-90"
      >
        Build my first course
      </Link>

      <div className="mt-14 flex justify-center">
        <DemoCard />
      </div>

      <dl className="mx-auto mt-16 grid max-w-3xl gap-10 border-t border-rule pt-10 text-left sm:grid-cols-3">
        <Fact figure="5" label="card formats per topic, so a topic you keep missing can be attacked from another side." />
        <Fact figure="12" label="documents to a course. Slides and the chapter they came from end up in the same topics." />
        <Fact figure="20" label="cards a sitting, drawn due-first — short enough to actually finish on a bad day." />
      </dl>
    </div>
  );
}

function HowSection() {
  return (
    <div>
      <h2 className="text-center font-reading text-[2.2rem] leading-tight text-ink">
        How a course gets made
      </h2>
      <p className="mx-auto mt-3 max-w-[54ch] text-center text-[0.95rem] leading-relaxed text-ink-soft">
        Two passes over your material: one to work out the shape of it, then one per topic to
        write the cards.
      </p>

      <ol className="mx-auto mt-14 grid max-w-4xl gap-10 sm:grid-cols-3">
        {STEPS.map((step, i) => (
          <li key={step.title}>
            <span className="font-hand text-3xl text-ink-faint">{i + 1}</span>
            <h3 className="mt-1 text-[1.05rem] font-semibold text-ink">{step.title}</h3>
            <p className="mt-2 text-[0.95rem] leading-relaxed text-ink-soft">{step.body}</p>
          </li>
        ))}
      </ol>

      <div className="mx-auto mt-16 grid max-w-4xl gap-8 border-t border-rule pt-12 sm:grid-cols-2">
        <div>
          <h3 className="font-reading text-xl text-ink">Cards come from your source, not the web</h3>
          <p className="mt-2.5 text-[0.95rem] leading-relaxed text-ink-soft">
            Your documents are split into numbered passages, and the structuring pass records which
            passages each topic came from. Writing the cards for a topic then means reading those
            passages back — so an answer traces to something in your material rather than to
            general knowledge about the subject.
          </p>
        </div>
        <div>
          <h3 className="font-reading text-xl text-ink">You can start before it has finished</h3>
          <p className="mt-2.5 text-[0.95rem] leading-relaxed text-ink-soft">
            Cards are written one topic at a time with a progress bar, so the first module is ready
            to study while the last is still being written. A topic that comes out weak can be
            rewritten on its own, and any card can be edited or thrown away.
          </p>
        </div>
      </div>

      <div className="mt-14 text-center">
        <Link
          href="/signup"
          className="inline-block rounded-full bg-ink px-8 py-3.5 text-[1rem] font-medium text-paper transition-opacity hover:opacity-90"
        >
          Build my first course
        </Link>
      </div>
    </div>
  );
}

function FormatsSection() {
  return (
    <div>
      <h2 className="text-center font-reading text-[2.2rem] leading-tight text-ink">
        Five ways through the same topic
      </h2>
      <p className="mx-auto mt-3 max-w-[54ch] text-center text-[0.95rem] leading-relaxed text-ink-soft">
        Recognition and recall are different skills, and exams test both. Switch formats when a
        topic stops sinking in — the material is the same, the demand on you is not.
      </p>

      <ul className="mx-auto mt-14 grid max-w-4xl gap-5 sm:grid-cols-2">
        {CARD_TYPES.map((type, i) => {
          // Alternating ink and paper, so a grid of cards reads as a stack of them.
          const inverted = i % 2 === 1;
          return (
            <li key={type}>
              <SketchCard seed={`mode-${type}`} invert={inverted}>
                <div className="p-6">
                  <h3
                    className={`font-reading text-xl ${inverted ? "text-paper" : "text-ink"}`}
                  >
                    {MODE_LABELS[type]}
                  </h3>
                  <p
                    className={`mt-2 text-[0.9rem] leading-relaxed ${
                      inverted ? "text-paper/75" : "text-ink-soft"
                    }`}
                  >
                    {MODE_BLURBS[type]}
                  </p>
                  <p
                    className={`mt-4 font-hand text-lg leading-snug ${
                      inverted ? "text-paper/60" : "text-ink-faint"
                    }`}
                  >
                    {FORMAT_USES[type]}
                  </p>
                </div>
              </SketchCard>
            </li>
          );
        })}
      </ul>

      <p className="mx-auto mt-12 max-w-[58ch] border-t border-rule pt-10 text-center text-[0.95rem] leading-relaxed text-ink-soft">
        Or mix all five in one sitting. However you answer, the card is rescheduled the same way —
        the format changes what is being asked of you, not how Memora tracks whether it stuck.
      </p>
    </div>
  );
}

export default async function LandingPage() {
  if (await getUser()) redirect("/dashboard");

  return (
    // LandingShell reads the section from the query string.
    <Suspense>
      <LandingShell
        sections={{
          try: <TrySection />,
          how: <HowSection />,
          formats: <FormatsSection />,
          faq: <Faq />,
        }}
      />
    </Suspense>
  );
}
