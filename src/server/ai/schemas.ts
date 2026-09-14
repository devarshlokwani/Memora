import * as z from "zod/v4";

/**
 * Output schemas for both model passes. Kept apart from ai.ts so pure consumers
 * (card validation, tests) can import the types without pulling in the SDK or
 * the server-only guard.
 */

export const OutlineSchema = z.object({
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

export const CardsSchema = z.object({
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
