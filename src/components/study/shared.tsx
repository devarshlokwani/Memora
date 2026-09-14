import { CheckMark, CrossMark } from "@/components/ui/Marks";
import { SketchCard } from "@/components/ui/SketchFrame";
import type { Card, Grade } from "@/lib/types";

export { matchesAnswer, normalize, shuffle } from "@/lib/answers";

export type StudyCard = Card & { dueAt: string | null };

export type AnswerHandler = (result: { grade: Grade; correct: boolean }) => void;

export type ModeProps = {
  card: StudyCard;
  onAnswer: AnswerHandler;
};

/** The drawn card every mode sits inside. Its edge and angle come from its id. */
export function CardShell({
  seed,
  children,
  className = "",
}: {
  seed: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <SketchCard seed={seed} className={className}>
      <div className="p-7">{children}</div>
    </SketchCard>
  );
}

export function Verdict({ correct, children }: { correct: boolean; children?: React.ReactNode }) {
  return (
    <div
      className={`mt-6 flex gap-3 rounded-2xl px-4 py-3 ${
        correct ? "bg-correct-soft" : "hatch border border-dashed border-rule"
      }`}
    >
      <span className={correct ? "text-ink" : "text-ink-soft"}>
        {correct ? <CheckMark /> : <CrossMark />}
      </span>
      <div>
        <p className={`font-medium ${correct ? "text-ink" : "text-ink-soft"}`}>
          {correct ? "Correct" : "Not quite"}
        </p>
        {children && (
          <div className="mt-1 text-[0.95rem] leading-relaxed text-ink-soft">{children}</div>
        )}
      </div>
    </div>
  );
}

export function ContinueButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      autoFocus
      className="mt-5 w-full rounded-full bg-ink px-4 py-3 text-[0.95rem] font-medium text-paper hover:opacity-90"
    >
      Next card
    </button>
  );
}
