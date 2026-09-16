import { redirect } from "next/navigation";
import { Suspense } from "react";

import { BuildProgress } from "@/components/landing/BuildProgress";
import { CoursePipeline } from "@/components/landing/CoursePipeline";
import { DemoCard } from "@/components/landing/DemoCard";
import { Faq } from "@/components/landing/Faq";
import { FormatDeck } from "@/components/landing/FormatDeck";
import { LandingShell } from "@/components/landing/LandingShell";
import { SectionIntro } from "@/components/landing/SectionIntro";
import { WaitlistCta } from "@/components/landing/WaitlistCta";
import { ScanDoc } from "@/components/landing/ScanDoc";
import { DashedRule } from "@/components/ui/DashedRule";
import { Marked } from "@/components/ui/Marked";
import { getUser } from "@/server/db/client";


function Fact({ figure, label }: { figure: string; label: string }) {
  return (
    <div>
      <p className="font-reading text-[1.5rem] leading-snug text-ink">{figure}</p>
      <p className="mt-2 text-[0.9rem] leading-relaxed text-ink-soft">{label}</p>
    </div>
  );
}

function TrySection() {
  return (
    <div className="text-center">
      <SectionIntro
        heading="h1"
        eyebrow="Dear crammers,"
        title={<>Hand over the PDF. Get back a way to <Marked>study it</Marked>.</>}
        blurb="Memora reads your course material, builds the structure your lecturer never gave you, and turns every topic into cards you can actually drill."
      />
      <div id="waitlist" className="mt-8 scroll-mt-28">
        <WaitlistCta source="hero" />
      </div>

      <div className="mt-14 flex justify-center">
        <DemoCard />
      </div>

      <div className="mx-auto mt-16 max-w-3xl">
        <DashedRule />
      </div>
      <dl className="mx-auto mt-10 grid max-w-3xl gap-10 text-left sm:grid-cols-3">
        <Fact
          figure="Hand it over"
          label="Slides, a chapter, your own notes. Whatever you have, in whatever state it is in."
        />
        <Fact
          figure="Drill it your way"
          label="Flashcards, multiple choice, fill-ins, matching, jargon. Switch when one stops working."
        />
        <Fact
          figure="Forget nothing"
          label="Every card comes back on the day it was about to slip, and not before."
        />
      </dl>
    </div>
  );
}

function HowSection() {
  return (
    <div>
      <SectionIntro
        eyebrow="Behind the curtain,"
        title={<>How a course <Marked>gets made</Marked></>}
        blurb="Two passes over your material: one to work out the shape of it, then one per topic to write the cards."
      />

      <CoursePipeline />

      <div className="mx-auto mt-20 max-w-5xl">
        <DashedRule />

        <div className="mt-12 grid gap-10 lg:grid-cols-2 lg:items-center">
          <div>
            <h3 className="font-reading text-xl text-ink">
              Cards come from your source, not the web
            </h3>
            <p className="mt-2.5 max-w-[46ch] text-[0.95rem] leading-relaxed text-ink-soft">
              Memora reads the document you handed over, a line at a time, and writes every card out
              of what is actually on the page. An answer traces back to your own material rather
              than to general knowledge about the subject.
            </p>
          </div>
          <ScanDoc />
        </div>

        <div className="mt-16">
          <DashedRule />
        </div>

        <div className="mt-12 grid gap-10 lg:grid-cols-2 lg:items-center">
          <div>
            <h3 className="font-reading text-xl text-ink">You can start before it has finished</h3>
            <p className="mt-2.5 max-w-[46ch] text-[0.95rem] leading-relaxed text-ink-soft">
              Cards are written one topic at a time, so the first module is ready to study while the
              last is still being written. A topic that comes out weak can be rewritten on its own,
              and any card can be edited or thrown away.
            </p>
          </div>
          <BuildProgress />
        </div>
      </div>

      <div className="mx-auto mt-16 max-w-md text-center">
        <p className="font-hand text-2xl text-ink-soft">Not built yet, nearly there,</p>
        <h3 className="mt-2 font-reading text-[1.9rem] leading-snug text-ink">
          Be there when it opens
        </h3>
        <div className="mt-6">
          <WaitlistCta source="how" label="Build my first course" />
        </div>
      </div>
    </div>
  );
}

function FormatsSection() {
  return (
    <div>
      <SectionIntro
        eyebrow="Five ways in,"
        title={<>One topic, <Marked>five ways</Marked> to learn it</>}
        blurb="Recognition and recall are different skills, and exams test both. Switch formats when a topic stops sinking in. The material is the same; the demand on you is not."
      />

      <FormatDeck />

      <p className="mx-auto mt-10 max-w-[58ch] text-center text-[0.95rem] leading-relaxed text-ink-soft">
        Or mix all five in one sitting. However you answer, the card is rescheduled the same way:
        the format changes what is being asked of you, not how Memora tracks whether it stuck.
      </p>

      <div className="mx-auto mt-16 max-w-4xl">
        <DashedRule />
      </div>
      <div className="mt-14">
        <Faq />
      </div>
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
