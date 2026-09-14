import Link from "next/link";
import { redirect } from "next/navigation";

import { DemoCard } from "@/components/DemoCard";
import { HeroReveal } from "@/components/HeroReveal";
import { SiteNav } from "@/components/SiteNav";
import { SketchCard } from "@/components/SketchFrame";
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
    <div className="min-h-dvh">
      <SiteNav />

      <main>
        <HeroReveal>
          <section className="mx-auto max-w-3xl px-6 pb-8 pt-14 text-center sm:pt-20">
            <p data-reveal className="font-hand text-2xl text-ink-soft">
              Dear crammers,
            </p>
            <h1
              data-reveal
              className="mt-3 font-reading text-[3rem] leading-[1.04] tracking-[-0.015em] text-ink sm:text-[4.2rem]"
            >
              Hand over the PDF.
              <br />
              Get back a way to <span className="marked">study it</span>.
            </h1>
            <p
              data-reveal
              className="mx-auto mt-6 max-w-[46ch] text-[1.05rem] leading-relaxed text-ink-soft"
            >
              Memora reads your course material, builds the structure your lecturer never gave
              you, and turns every topic into cards you can actually drill.
            </p>
            <div data-reveal className="mt-8">
              <Link
                href="/signup"
                className="inline-block rounded-full bg-ink px-8 py-3.5 text-[1rem] font-medium text-paper transition-opacity hover:opacity-90"
              >
                Build my first course
              </Link>
            </div>
            <p data-reveal className="mt-4 font-hand text-lg text-ink-faint">
              PDF, DOCX, TXT and Markdown
            </p>
          </section>

          {/* The product moment: a real card, sitting on the desk at an angle. */}
          <section id="try" className="scroll-mt-24 px-6 pb-20 pt-6">
            <div className="mx-auto flex max-w-5xl justify-center rounded-[2.5rem] bg-paper-deep px-6 py-16 sm:py-20">
              <div data-reveal-card>
                <DemoCard />
              </div>
            </div>
          </section>
        </HeroReveal>

        <section id="how" className="mx-auto max-w-4xl scroll-mt-24 px-6 py-16">
          <h2 className="text-center font-reading text-[2.2rem] leading-tight text-ink">
            How a course gets made
          </h2>
          <ol className="mt-10 grid gap-10 sm:grid-cols-3">
            {STEPS.map((step, i) => (
              <li key={step.title}>
                <span className="font-hand text-3xl text-ink-faint">{i + 1}</span>
                <h3 className="mt-1 text-[1.05rem] font-semibold text-ink">{step.title}</h3>
                <p className="mt-2 text-[0.95rem] leading-relaxed text-ink-soft">{step.body}</p>
              </li>
            ))}
          </ol>
        </section>

        <section id="formats" className="mx-auto max-w-4xl scroll-mt-24 px-6 py-16">
          <h2 className="text-center font-reading text-[2.2rem] leading-tight text-ink">
            Five ways through the same topic
          </h2>
          <p className="mx-auto mt-3 max-w-[54ch] text-center text-[0.95rem] leading-relaxed text-ink-soft">
            Recognition and recall are different skills, and exams test both. Switch formats when
            a topic stops sinking in.
          </p>
          <ul className="mt-10 grid gap-4 sm:grid-cols-2">
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
        </section>

        <section className="mx-auto max-w-3xl px-6 py-20 text-center">
          <h2 className="mx-auto max-w-[18ch] font-reading text-[2.6rem] leading-[1.08] text-ink">
            Your notes are already written. Start studying them.
          </h2>
          <Link
            href="/signup"
            className="mt-8 inline-block rounded-full bg-ink px-8 py-3.5 text-[1rem] font-medium text-paper transition-opacity hover:opacity-90"
          >
            Create an account
          </Link>
        </section>
      </main>

      <footer className="border-t border-rule py-8">
        <p className="mx-auto max-w-5xl px-6 font-hand text-lg text-ink-faint">Memora</p>
      </footer>
    </div>
  );
}
