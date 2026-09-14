import { BrainScene } from "@/components/layout/BrainScene";
import { DashedRule } from "@/components/ui/DashedRule";

/**
 * Who made this, above the footer proper. One person's reason for building it
 * carries further on a page like this than another list of features does.
 */
export function MeetTheCreator() {
  return (
    <section className="pb-4 pt-6">
      <DashedRule />

      <div className="mt-12 grid items-center gap-10 lg:grid-cols-[1.05fr_0.95fr] lg:gap-16">
        <div>
          <p className="font-hand text-2xl text-ink-soft">Meet the creator,</p>
          <h2 className="mt-3 max-w-[18ch] font-reading text-[2.1rem] leading-[1.15] tracking-[-0.015em] text-ink sm:text-[2.6rem]">
            Memora exists because revision week does
          </h2>

          <div className="mt-5 max-w-[52ch] space-y-4 text-[1rem] leading-relaxed text-ink-soft">
            <p>
              I kept ending up in the same place: a term of slides, a week to go, and no real idea
              which twenty things needed drilling. Making cards by hand took the evening I did not
              have, and the ones I made tended to test what I already knew.
            </p>
            <p>
              So Memora does the part that is not studying. Hand it the material and it works out
              the structure, writes the cards from your own passages, and keeps count of what you
              keep missing. What is left is the part that actually moves the needle.
            </p>
          </div>

          <p className="mt-7 flex flex-wrap items-baseline gap-x-3 gap-y-1">
            <span className="font-reading text-xl text-ink">Devarsh Lokwani</span>
            <span className="font-hand text-lg text-ink-faint">building Memora, one exam at a time</span>
          </p>
        </div>

        <div className="flex justify-center lg:justify-end">
          <BrainScene />
        </div>
      </div>
    </section>
  );
}
