import { SketchCard } from "@/components/ui/SketchFrame";

/**
 * One passage in, one card out, with the words they share marked in both.
 *
 * It replaced a version you had to operate: four passages, three cards, dots to
 * click and a line that redrew itself as you went. Everything in it was true and
 * almost none of it was read, because the claim it was making (an answer comes
 * out of your own material) is one you either see at a glance or not at all.
 * Two panels and a marked phrase say it without asking anything of anybody.
 */

const MARK = "bg-accent/15 decoration-accent/60 underline decoration-2 underline-offset-4";

export function SourceProof() {
  return (
    <div className="mt-10 grid items-start gap-6 lg:grid-cols-[1fr_auto_1fr] lg:gap-8">
      <div>
        <p className="mb-3 font-hand text-lg text-ink-soft">Page 4 of your handout</p>
        <SketchCard seed="proof-source" tilt={false}>
          <div className="px-6 py-5">
            <p className="font-hand text-base text-accent">[C1]</p>
            <p className="mt-2 text-[0.95rem] leading-relaxed text-ink-soft">
              Four ATP are produced during glycolysis, but{" "}
              <span className={MARK}>two are spent in the preparatory phase</span>, so the net yield
              is 2 ATP and 2 NADH per glucose.
            </p>
          </div>
        </SketchCard>
      </div>

      {/* Which way it went, drawn. Turns to point downward once the two panels
          stack, because an arrow aimed off the side of a phone says nothing. */}
      <svg
        viewBox="0 0 64 40"
        aria-hidden="true"
        className="mx-auto h-10 w-16 rotate-90 self-center overflow-visible lg:mt-16 lg:rotate-0"
      >
        <path
          d="M4 20C22 17 38 23 56 20"
          fill="none"
          stroke="var(--color-rule)"
          strokeWidth="1.6"
          strokeDasharray="6 7"
          strokeLinecap="round"
        />
        <path
          d="M48 13L57 20L48 27"
          fill="none"
          stroke="var(--color-rule)"
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>

      <div>
        <p className="mb-3 font-hand text-lg text-ink-soft">The card it wrote</p>
        <SketchCard seed="proof-card" tilt={false}>
          <div className="px-6 py-5">
            <p className="font-reading text-[1.15rem] leading-snug text-ink">
              Why is the net ATP yield of glycolysis 2 rather than 4?
            </p>
            <p className="mt-3 text-[0.95rem] leading-relaxed text-ink-soft">
              Because <span className={MARK}>two are spent in the preparatory phase</span>. Four made
              minus two used leaves 2, alongside 2 NADH.
            </p>
            <p className="mt-4 border-t border-dashed border-rule pt-3 text-[0.82rem] text-ink-soft">
              traced to <span className="text-accent">[C1]</span> in your material
            </p>
          </div>
        </SketchCard>
      </div>
    </div>
  );
}
