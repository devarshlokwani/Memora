import { NextResponse } from "next/server";

import { generateCards } from "@/lib/ai";
import { chunkDocuments, gatherSource } from "@/lib/chunk";
import { createClient } from "@/lib/supabase/server";
import type { CardType } from "@/lib/types";

export const maxDuration = 300;

const FALLBACK_SOURCE_CHARS = 20_000;

type CardRow = {
  user_id: string;
  course_id: string;
  topic_id: string;
  type: CardType;
  prompt: string;
  answer: string;
  options: string[];
  correct_index: number | null;
  pairs: { left: string; right: string }[];
  explanation: string;
  difficulty: number;
};

const clampDifficulty = (n: number) => Math.min(3, Math.max(1, Math.round(n || 2)));

/** Generates every card format for one topic. Called once per topic by the client. */
export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: topicId } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not signed in." }, { status: 401 });

  const { data: topic } = await supabase
    .from("topics")
    .select("id, course_id, module_id, title, summary, key_terms, chunk_refs")
    .eq("id", topicId)
    .single();
  if (!topic) return NextResponse.json({ error: "Topic not found." }, { status: 404 });

  const [{ data: course }, { data: courseModule }, { data: docs }] = await Promise.all([
    supabase.from("courses").select("title").eq("id", topic.course_id).single(),
    supabase.from("modules").select("title").eq("id", topic.module_id).single(),
    supabase
      .from("documents")
      .select("id, filename, content")
      .eq("course_id", topic.course_id)
      .eq("status", "extracted")
      .order("position"),
  ]);

  if (!docs?.length) {
    return NextResponse.json({ error: "Source documents are missing." }, { status: 422 });
  }

  await supabase.from("topics").update({ status: "generating", error: null }).eq("id", topicId);

  try {
    const chunks = chunkDocuments(docs);
    const refs: number[] = Array.isArray(topic.chunk_refs) ? topic.chunk_refs : [];
    const source = refs.length
      ? gatherSource(chunks, refs)
      : chunks
          .map((c) => c.text)
          .join("\n\n")
          .slice(0, FALLBACK_SOURCE_CHARS);

    const generated = await generateCards({
      courseTitle: course?.title ?? "",
      moduleTitle: courseModule?.title ?? "",
      topicTitle: topic.title,
      topicSummary: topic.summary,
      keyTerms: Array.isArray(topic.key_terms) ? topic.key_terms : [],
      source,
    });

    const base = { user_id: user.id, course_id: topic.course_id, topic_id: topicId };
    const rows: CardRow[] = [];

    for (const c of generated.flashcards) {
      if (!c.front?.trim() || !c.back?.trim()) continue;
      rows.push({
        ...base,
        type: "flashcard",
        prompt: c.front,
        answer: c.back,
        options: [],
        correct_index: null,
        pairs: [],
        explanation: "",
        difficulty: clampDifficulty(c.difficulty),
      });
    }

    for (const c of generated.mcqs) {
      // A question whose key points outside its own options is unanswerable.
      if (c.options.length < 2 || c.correct_index < 0 || c.correct_index >= c.options.length) {
        continue;
      }
      rows.push({
        ...base,
        type: "mcq",
        prompt: c.question,
        answer: c.options[c.correct_index],
        options: c.options,
        correct_index: c.correct_index,
        pairs: [],
        explanation: c.explanation ?? "",
        difficulty: clampDifficulty(c.difficulty),
      });
    }

    for (const c of generated.fill_blanks) {
      if (!c.sentence.includes("___") || !c.answer?.trim()) continue;
      rows.push({
        ...base,
        type: "fill_blank",
        prompt: c.sentence,
        answer: c.answer,
        options: c.accepted ?? [],
        correct_index: null,
        pairs: [],
        explanation: "",
        difficulty: clampDifficulty(c.difficulty),
      });
    }

    for (const c of generated.match_sets) {
      const pairs = c.pairs.filter((p) => p.left?.trim() && p.right?.trim());
      if (pairs.length < 3) continue;
      rows.push({
        ...base,
        type: "match",
        prompt: c.instruction || `Match each item to its partner`,
        answer: "",
        options: [],
        correct_index: null,
        pairs,
        explanation: "",
        difficulty: 2,
      });
    }

    for (const c of generated.jargon) {
      if (!c.term?.trim() || !c.definition?.trim()) continue;
      rows.push({
        ...base,
        type: "jargon",
        prompt: c.term,
        answer: c.definition,
        options: [],
        correct_index: null,
        pairs: [],
        explanation: "",
        difficulty: clampDifficulty(c.difficulty),
      });
    }

    if (!rows.length) throw new Error("No usable cards came back for this topic.");

    // Replace rather than append so a regenerate does not leave stale duplicates.
    await supabase.from("cards").delete().eq("topic_id", topicId);
    const { error: insertError } = await supabase.from("cards").insert(rows);
    if (insertError) throw new Error(insertError.message);

    await supabase.from("topics").update({ status: "ready", error: null }).eq("id", topicId);

    return NextResponse.json({ cards: rows.length });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Card generation failed.";
    await supabase.from("topics").update({ status: "failed", error: message }).eq("id", topicId);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
