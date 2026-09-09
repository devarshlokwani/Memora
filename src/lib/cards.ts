import type { GeneratedCards } from "./ai-schema";
import type { CardType, MatchPair } from "./types";

export type CardRow = {
  user_id: string;
  course_id: string;
  topic_id: string;
  type: CardType;
  prompt: string;
  answer: string;
  options: string[];
  correct_index: number | null;
  pairs: MatchPair[];
  explanation: string;
  difficulty: number;
};

export type CardOwner = Pick<CardRow, "user_id" | "course_id" | "topic_id">;

const clampDifficulty = (n: number) => Math.min(3, Math.max(1, Math.round(n) || 2));

const blank = {
  answer: "",
  options: [] as string[],
  correct_index: null,
  pairs: [] as MatchPair[],
  explanation: "",
};

/**
 * Turns a model response into card rows, dropping anything a student could not
 * actually answer. The model is good but not perfect, and a broken card is worse
 * than a missing one -- an MCQ whose key points outside its own options, or a
 * fill-in-the-blank with no blank, would be unanswerable in the UI.
 */
export function buildCardRows(generated: GeneratedCards, owner: CardOwner): CardRow[] {
  const rows: CardRow[] = [];
  const push = (row: Partial<CardRow> & Pick<CardRow, "type" | "prompt">) =>
    rows.push({ ...owner, ...blank, difficulty: 2, ...row } as CardRow);

  for (const c of generated.flashcards) {
    if (!c.front?.trim() || !c.back?.trim()) continue;
    push({
      type: "flashcard",
      prompt: c.front.trim(),
      answer: c.back.trim(),
      difficulty: clampDifficulty(c.difficulty),
    });
  }

  for (const c of generated.mcqs) {
    const options = (c.options ?? []).map((o) => o?.trim()).filter(Boolean) as string[];
    // Fewer than two options is not a choice, and a key outside the list is unanswerable.
    if (options.length < 2 || options.length !== c.options.length) continue;
    if (!Number.isInteger(c.correct_index)) continue;
    if (c.correct_index < 0 || c.correct_index >= options.length) continue;
    if (new Set(options.map((o) => o.toLowerCase())).size !== options.length) continue;
    if (!c.question?.trim()) continue;

    push({
      type: "mcq",
      prompt: c.question.trim(),
      answer: options[c.correct_index],
      options,
      correct_index: c.correct_index,
      explanation: c.explanation?.trim() ?? "",
      difficulty: clampDifficulty(c.difficulty),
    });
  }

  for (const c of generated.fill_blanks) {
    if (!c.sentence?.includes("___") || !c.answer?.trim()) continue;
    // Two blanks means the student cannot know which one the answer belongs to.
    if (c.sentence.split("___").length !== 2) continue;

    push({
      type: "fill_blank",
      prompt: c.sentence.trim(),
      answer: c.answer.trim(),
      options: (c.accepted ?? []).map((a) => a?.trim()).filter(Boolean) as string[],
      difficulty: clampDifficulty(c.difficulty),
    });
  }

  for (const c of generated.match_sets) {
    const pairs = (c.pairs ?? []).filter((p) => p?.left?.trim() && p?.right?.trim());
    // Duplicate right-hand items make a pairing ambiguous, so the set is unusable.
    const rights = new Set(pairs.map((p) => p.right.trim().toLowerCase()));
    if (pairs.length < 3 || rights.size !== pairs.length) continue;

    push({
      type: "match",
      prompt: c.instruction?.trim() || "Match each item to its partner.",
      pairs: pairs.map((p) => ({ left: p.left.trim(), right: p.right.trim() })),
    });
  }

  for (const c of generated.jargon) {
    if (!c.term?.trim() || !c.definition?.trim()) continue;
    push({
      type: "jargon",
      prompt: c.term.trim(),
      answer: c.definition.trim(),
      difficulty: clampDifficulty(c.difficulty),
    });
  }

  return rows;
}
