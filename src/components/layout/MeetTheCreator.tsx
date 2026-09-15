import { Portrait } from "@/components/layout/Portrait";
import { DashedRule } from "@/components/ui/DashedRule";
import { Marked } from "@/components/ui/Marked";
import { PushButton } from "@/components/ui/PushButton";

/**
 * Who made this, sitting above the footer proper. One person's reason for
 * building something carries further on a page like this than another list of
 * features does.
 *
 * Set the way every other section on the site is set: a handwritten aside, the
 * reading face for the headline, a drawn mark under the phrase that matters,
 * and laid out left against a portrait rather than centred, because it is the
 * end of the page rather than the start of another section.
 *
 * Two columns at every width. Stacking the portrait underneath on a phone put
 * a face on its own below a block of text and read as a second section; kept
 * beside the words it stays part of the same thought. It shrinks to an avatar
 * rather than dropping, and the type steps down with it so the column it leaves
 * behind is still wide enough to set.
 */
export function MeetTheCreator() {
  return (
    <section className="pb-6 pt-8">
      <DashedRule />

      <div className="mt-12 grid grid-cols-[minmax(0,1fr)_minmax(4.5rem,0.42fr)] items-center gap-5 sm:mt-16 sm:grid-cols-[minmax(0,1fr)_minmax(0,0.55fr)] sm:gap-10 lg:grid-cols-[1.15fr_0.85fr] lg:gap-20">
        <div>
          <p className="font-hand text-xl text-ink-soft sm:text-2xl">And that&apos;s Memora,</p>

          <h2 className="mt-2 font-reading text-[1.85rem] leading-[1.12] tracking-[-0.015em] text-ink sm:mt-3 sm:text-[2.6rem] lg:text-[3.4rem]">
            Meet the <Marked>creator</Marked>
          </h2>

          <p className="mt-4 max-w-[46ch] text-[0.95rem] leading-relaxed text-ink-soft sm:mt-5 sm:text-[1.05rem]">
            Memora came out of my own revision week: a term of slides, seven days left, and no
            real idea what to drill first. I built the thing I wanted to exist, and I am still
            building it.
          </p>

          <div className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-3 sm:mt-8">
            <PushButton href="https://devarshlokwani.com" external>
              Visit
            </PushButton>
            <span className="font-hand text-base text-ink-faint sm:text-lg">
              Devarsh Lokwani. Everything else I have built
            </span>
          </div>
        </div>

        <div className="flex justify-end">
          <Portrait className="max-w-[20rem] sm:max-w-[23rem]" />
        </div>
      </div>
    </section>
  );
}
