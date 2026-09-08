import "server-only";

import Anthropic from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import * as z from "zod/v4";

import { renderChunks, type Chunk } from "./chunk";
import { CARDS_SYSTEM, OUTLINE_SYSTEM, cardsUserPrompt, outlineUserPrompt } from "./prompts";

export const MODEL = process.env.ANTHROPIC_MODEL ?? "claude-opus-5";

/** Roughly 100k tokens of source before we fall back to per-chunk excerpts. */
const CORPUS_CHAR_BUDGET = 350_000;
const MIN_EXCERPT_CHARS = 300;
const MAX_EXCERPT_CHARS = 900;

let client: Anthropic | null = null;

function anthropic() {
  if (!process.env.ANTHROPIC_API_KEY) {
    throw new Error(
      "ANTHROPIC_API_KEY is not set. Add it to .env.local -- Memora cannot generate anything without it.",
    );
  }
  client ??= new Anthropic();
  return client;
}

// ------------------------------------------------------------------ schemas

const OutlineSchema = z.object({
  title: z.string(),
  description: z.string(),
  modules: z.array(
    z.object({
      title: z.string(),
      summary: z.string(),
      topics: z.array(
        z.object({
          title: z.string(),
          summary: z.string(),
          key_terms: z.array(z.string()),
          chunk_refs: z.array(z.number().int()),
        }),
      ),
    }),
  ),
});

export type Outline = z.infer<typeof OutlineSchema>;

const CardsSchema = z.object({
  flashcards: z.array(
    z.object({ front: z.string(), back: z.string(), difficulty: z.number().int() }),
  ),
  mcqs: z.array(
    z.object({
      question: z.string(),
      options: z.array(z.string()),
      correct_index: z.number().int(),
      explanation: z.string(),
      difficulty: z.number().int(),
    }),
  ),
  fill_blanks: z.array(
    z.object({
      sentence: z.string(),
      answer: z.string(),
      accepted: z.array(z.string()),
      difficulty: z.number().int(),
    }),
  ),
  match_sets: z.array(
    z.object({
      instruction: z.string(),
      pairs: z.array(z.object({ left: z.string(), right: z.string() })),
    }),
  ),
  jargon: z.array(
    z.object({ term: z.string(), definition: z.string(), difficulty: z.number().int() }),
  ),
});

export type GeneratedCards = z.infer<typeof CardsSchema>;

// ------------------------------------------------------------------ outline

/**
 * Builds the corpus the outline pass sees. Under budget the model gets the full
 * text; over it, every chunk is still listed (so every index stays citable) but
 * only as an opening excerpt.
 */
function buildCorpus(chunks: Chunk[]): { corpus: string; truncated: boolean } {
  const total = chunks.reduce((sum, c) => sum + c.text.length, 0);
  if (total <= CORPUS_CHAR_BUDGET) {
    return { corpus: renderChunks(chunks), truncated: false };
  }

  const perChunk = Math.max(
    MIN_EXCERPT_CHARS,
    Math.min(MAX_EXCERPT_CHARS, Math.floor(CORPUS_CHAR_BUDGET / Math.max(chunks.length, 1))),
  );
  return { corpus: renderChunks(chunks, perChunk), truncated: true };
}

export async function generateOutline(
  filenames: string[],
  chunks: Chunk[],
): Promise<Outline> {
  const { corpus, truncated } = buildCorpus(chunks);

  const response = await anthropic().messages.parse({
    model: MODEL,
    max_tokens: 32_000,
    system: OUTLINE_SYSTEM,
    messages: [{ role: "user", content: outlineUserPrompt(filenames, corpus, truncated) }],
    output_config: { effort: "high", format: zodOutputFormat(OutlineSchema) },
  });

  const outline = response.parsed_output;
  if (!outline) throw new Error("The model did not return a usable course structure.");

  // Drop hallucinated citations rather than letting them break source lookup later.
  for (const mod of outline.modules) {
    for (const topic of mod.topics) {
      topic.chunk_refs = topic.chunk_refs.filter((i) => i >= 0 && i < chunks.length);
    }
  }

  return outline;
}

// ------------------------------------------------------------------ cards

export async function generateCards(args: {
  courseTitle: string;
  moduleTitle: string;
  topicTitle: string;
  topicSummary: string;
  keyTerms: string[];
  source: string;
}): Promise<GeneratedCards> {
  // No prompt caching here on purpose: each topic sends a different slice of source,
  // so there is no shared prefix long enough to cache, and paying the 1.25x write
  // cost per topic would be strictly worse than sending the slice uncached.
  const response = await anthropic().messages.parse({
    model: MODEL,
    max_tokens: 32_000,
    system: CARDS_SYSTEM,
    messages: [{ role: "user", content: cardsUserPrompt(args) }],
    output_config: { effort: "medium", format: zodOutputFormat(CardsSchema) },
  });

  const cards = response.parsed_output;
  if (!cards) throw new Error("The model did not return usable cards for this topic.");
  return cards;
}
