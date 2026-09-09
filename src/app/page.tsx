import Link from "next/link";
import { redirect } from "next/navigation";

import { DemoCard } from "@/components/DemoCard";
import { Logo } from "@/components/Logo";
import { getUser } from "@/lib/supabase/server";
import { CARD_TYPES, MODE_BLURBS, MODE_LABELS } from "@/lib/types";

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

export default async function LandingPage() {
  if (await getUser()) redirect("/dashboard");

  return (
    <div className="paper-grid min-h-dvh">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
        <Logo />
        <nav className="flex items-center gap-5 text-[0.95rem]">
          <Link href="/login" className="text-ink-soft hover:text-ink">
            Sign in
          </Link>
          <Link
            href="/signup"
            className="rounded-md bg-ink px-4 py-2 font-medium text-paper hover:opacity-90"
          >
            Get started
          </Link>
        </nav>
      </header>

      <main className="mx-auto max-w-6xl px-6">
        <section className="grid items-center gap-14 py-14 md:grid-cols-[1.05fr_1fr] md:py-20">
          <div>
            <h1 className="max-w-[15ch] text-[2.75rem] font-semibold leading-[1.05] tracking-[-0.035em] text-ink sm:text-[3.4rem]">
              Hand over the PDF. Get back a way to <span className="marked">study it</span>.
            </h1>
            <p className="mt-6 max-w-[52ch] text-[1.05rem] leading-relaxed text-ink-soft">
              Memora reads your course material, builds the structure your lecturer never gave
              you, and turns every topic into cards you can actually drill — flashcards, multiple
              choice, fill-in-the-blanks, matching pairs, and the technical vocabulary you have to
              know cold.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-4">
              <Link
                href="/signup"
                className="rounded-md bg-ink px-6 py-3 text-[0.95rem] font-medium text-paper hover:opacity-90"
              >
                Build my first course
              </Link>
              <span className="text-sm text-ink-faint">PDF, DOCX, TXT and Markdown</span>
            </div>
          </div>

          <div className="flex justify-center md:justify-end">
            <DemoCard />
          </div>
        </section>

        <section className="border-t border-rule py-16">
          <h2 className="font-reading text-[1.75rem] text-ink">How a course gets made</h2>
          <ol className="mt-8 grid gap-8 sm:grid-cols-3">
            {STEPS.map((step, i) => (
              <li key={step.title} className="border-t-2 border-ink pt-4">
                <span className="font-reading text-2xl text-ink-faint">{i + 1}</span>
                <h3 className="mt-2 text-[1.05rem] font-semibold text-ink">{step.title}</h3>
                <p className="mt-2 text-[0.95rem] leading-relaxed text-ink-soft">{step.body}</p>
              </li>
            ))}
          </ol>
        </section>

        <section className="border-t border-rule py-16">
          <h2 className="font-reading text-[1.75rem] text-ink">Five ways through the same topic</h2>
          <p className="mt-2 max-w-[60ch] text-[0.95rem] leading-relaxed text-ink-soft">
            Recognition and recall are different skills, and exams test both. Switch formats when a
            topic stops sinking in.
          </p>
          <ul className="mt-8 divide-y divide-rule border-y border-rule">
            {CARD_TYPES.map((type) => (
              <li key={type} className="flex flex-col gap-1 py-4 sm:flex-row sm:items-baseline sm:gap-8">
                <span className="w-48 shrink-0 font-medium text-ink">{MODE_LABELS[type]}</span>
                <span className="text-[0.95rem] text-ink-soft">{MODE_BLURBS[type]}</span>
              </li>
            ))}
          </ul>
        </section>

        <section className="border-t border-rule py-20 text-center">
          <h2 className="mx-auto max-w-[20ch] text-[2rem] font-semibold leading-tight tracking-[-0.03em] text-ink">
            Your notes are already written. Start studying them.
          </h2>
          <Link
            href="/signup"
            className="mt-7 inline-block rounded-md bg-ink px-6 py-3 text-[0.95rem] font-medium text-paper hover:opacity-90"
          >
            Create an account
          </Link>
        </section>
      </main>

      <footer className="border-t border-rule py-8">
        <p className="mx-auto max-w-6xl px-6 text-sm text-ink-faint">Memora</p>
      </footer>
    </div>
  );
}
