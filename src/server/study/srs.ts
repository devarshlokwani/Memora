import type { CardProgress, Grade } from "@/lib/types";

/**
 * SM-2 with the usual practical tweaks: sub-day relearning steps for lapses and
 * a small fuzz factor so a big first session does not all come due on one day.
 */
const MIN_EASE = 1.3;
const MAX_EASE = 3.0;
const RELEARN_MINUTES = 10;

export type SrsState = Pick<
  CardProgress,
  "ease" | "interval_days" | "repetitions" | "lapses"
>;

export const INITIAL_STATE: SrsState = {
  ease: 2.5,
  interval_days: 0,
  repetitions: 0,
  lapses: 0,
};

const EASE_DELTA: Record<Grade, number> = { 0: -0.2, 1: -0.15, 2: 0, 3: 0.15 };

function clamp(n: number, lo: number, hi: number) {
  return Math.min(hi, Math.max(lo, n));
}

/** ±5% so cards introduced together drift apart over time. */
function fuzz(days: number) {
  return days * (0.95 + Math.random() * 0.1);
}

export function schedule(state: SrsState, grade: Grade): SrsState & { due_at: string } {
  const ease = clamp(state.ease + EASE_DELTA[grade], MIN_EASE, MAX_EASE);

  if (grade === 0) {
    const due = new Date(Date.now() + RELEARN_MINUTES * 60_000);
    return {
      ease,
      interval_days: 0,
      repetitions: 0,
      lapses: state.lapses + 1,
      due_at: due.toISOString(),
    };
  }

  let interval: number;
  if (state.repetitions === 0) {
    interval = grade === 1 ? 0.5 : grade === 2 ? 1 : 3;
  } else if (state.repetitions === 1) {
    interval = grade === 1 ? 2 : grade === 2 ? 3 : 6;
  } else {
    const multiplier = grade === 1 ? 1.2 : grade === 2 ? ease : ease * 1.3;
    interval = Math.max(1, state.interval_days * multiplier);
  }

  interval = Math.min(interval, 365);
  const due = new Date(Date.now() + fuzz(interval) * 86_400_000);

  return {
    ease,
    interval_days: interval,
    repetitions: state.repetitions + 1,
    lapses: state.lapses,
    due_at: due.toISOString(),
  };
}

/** Objective modes have no self-grading, so map right/wrong onto a grade. */
export function gradeFromCorrectness(correct: boolean): Grade {
  return correct ? 2 : 0;
}

export function formatInterval(days: number): string {
  if (days <= 0) return "10m";
  if (days < 1) return `${Math.round(days * 24)}h`;
  if (days < 30) return `${Math.round(days)}d`;
  if (days < 365) return `${Math.round(days / 30)}mo`;
  return `${(days / 365).toFixed(1)}y`;
}
