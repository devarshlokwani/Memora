export type CardType = "flashcard" | "mcq" | "fill_blank" | "match" | "jargon";

export const CARD_TYPES: CardType[] = ["flashcard", "mcq", "fill_blank", "match", "jargon"];

export const MODE_LABELS: Record<CardType, string> = {
  flashcard: "Flashcards",
  mcq: "Multiple choice",
  fill_blank: "Fill in the blanks",
  match: "Match the pairs",
  jargon: "Jargon drill",
};

export const MODE_BLURBS: Record<CardType, string> = {
  flashcard: "Prompt on the front, answer on the back. Grade yourself.",
  mcq: "Four options, one right. Instant feedback with an explanation.",
  fill_blank: "Type the missing word into the sentence.",
  match: "Drag-free pairing: tap a term, then tap its partner.",
  jargon: "Type the definition of each technical term from memory.",
};

export type CourseStatus = "draft" | "extracting" | "structuring" | "ready" | "failed";
export type TopicStatus = "pending" | "generating" | "ready" | "failed";

export type Course = {
  id: string;
  user_id: string;
  title: string;
  description: string;
  status: CourseStatus;
  error: string | null;
  created_at: string;
};

export type DocumentRow = {
  id: string;
  course_id: string;
  filename: string;
  mime_type: string;
  size_bytes: number;
  content: string;
  char_count: number;
  page_count: number | null;
  status: "uploaded" | "extracted" | "failed";
  error: string | null;
  position: number;
};

export type Module = {
  id: string;
  course_id: string;
  title: string;
  summary: string;
  position: number;
};

export type Topic = {
  id: string;
  course_id: string;
  module_id: string;
  title: string;
  summary: string;
  key_terms: string[];
  chunk_refs: number[];
  status: TopicStatus;
  error: string | null;
  position: number;
};

export type MatchPair = { left: string; right: string };

export type Card = {
  id: string;
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

export type CardProgress = {
  card_id: string;
  ease: number;
  interval_days: number;
  repetitions: number;
  lapses: number;
  due_at: string;
  total_reviews: number;
  correct_reviews: number;
};

/** 0 = blanked out, 1 = shaky, 2 = got it, 3 = instant. */
export type Grade = 0 | 1 | 2 | 3;

/** Kept here rather than in extract.ts so the client upload form can read it. */
export const ACCEPTED_FILE_TYPES = ".pdf,.docx,.txt,.md,.markdown,.csv";
