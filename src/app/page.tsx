import Link from "next/link";
import { redirect } from "next/navigation";
import { Suspense } from "react";

import { DemoCard } from "@/components/landing/DemoCard";
import { LandingShell } from "@/components/landing/LandingShell";
import { SketchCard } from "@/components/ui/SketchFrame";
import { CARD_TYPES, MODE_BLURBS, MODE_LABELS } from "@/lib/types";
import { getUser } from "@/server/db/client";

const STEPS = [
  {
    title: "Drop in your material",
    body: "Lecture slides, a textbook chapter, your own notes. Several files at once — Memora reads them as one body of material.",
  },
  {
    title: "Get a course, not a pile",
    body: "It works out the themes, orders them the way you should learn them, and splits each into topics worth one sitting.",
  },
  {
    title: "Drill it your way",
    body: "Every topic becomes cards in five formats. Answer them and Memora schedules each card for the day you're about to forget it.",
  },
];

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

      <div className="mt-12 flex justify-center">
        <DemoCard />
      </div>
      <p className="mt-5 font-hand text-lg text-ink-faint">
        A real card. Click it to turn it over.
      </p>
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
      <ol className="mx-auto mt-12 grid max-w-4xl gap-10 sm:grid-cols-3">
        {STEPS.map((step, i) => (
          <li key={step.title}>
            <span className="font-hand text-3xl text-ink-faint">{i + 1}</span>
            <h3 className="mt-1 text-[1.05rem] font-semibold text-ink">{step.title}</h3>
            <p className="mt-2 text-[0.95rem] leading-relaxed text-ink-soft">{step.body}</p>
          </li>
        ))}
      </ol>
      <div className="mt-12 text-center">
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
        topic stops sinking in.
      </p>
      <ul className="mx-auto mt-12 grid max-w-4xl gap-4 sm:grid-cols-2">
        {CARD_TYPES.map((type) => (
          <li key={type}>
            <SketchCard seed={`mode-${type}`}>
              <div className="p-5">
                <h3 className="font-reading text-xl text-ink">{MODE_LABELS[type]}</h3>
                <p className="mt-1.5 text-[0.9rem] leading-relaxed text-ink-soft">
                  {MODE_BLURBS[type]}
                </p>
              </div>
            </SketchCard>
          </li>
        ))}
      </ul>
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
        }}
      />
    </Suspense>
  );
}
