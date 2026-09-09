import type { Card, Grade } from "@/lib/types";

export { matchesAnswer, normalize, shuffle } from "@/lib/answers";

export type StudyCard = Card & { dueAt: string | null };

export type AnswerHandler = (result: { grade: Grade; correct: boolean }) => void;

export type ModeProps = {
  card: StudyCard;
  onAnswer: AnswerHandler;
};

export function CardShell({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`rounded-card border border-rule bg-card p-7 shadow-[var(--shadow-card)] ${className}`}
    >
      {children}
    </div>
  );
}

export function Verdict({ correct, children }: { correct: boolean; children?: React.ReactNode }) {
  return (
    <div
      className={`mt-6 rounded-md px-4 py-3 ${correct ? "bg-correct-soft" : "bg-wrong-soft"}`}
    >
      <p className={`font-medium ${correct ? "text-correct" : "text-wrong"}`}>
        {correct ? "Correct" : "Not quite"}
      </p>
      {children && (
        <div className="mt-1.5 text-[0.95rem] leading-relaxed text-ink-soft">{children}</div>
      )}
    </div>
  );
}

export function ContinueButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      autoFocus
      className="mt-5 w-full rounded-md bg-ink px-4 py-3 text-[0.95rem] font-medium text-paper hover:opacity-90"
    >
      Next card
    </button>
  );
}
