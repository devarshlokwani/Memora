import { NextResponse } from "next/server";

import { generateCards } from "@/lib/ai";
import { chunkDocuments, gatherSource } from "@/lib/chunk";
import { createClient } from "@/lib/supabase/server";
import { buildCardRows } from "@/lib/cards";

export const maxDuration = 300;

const FALLBACK_SOURCE_CHARS = 20_000;

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

    const rows = buildCardRows(generated, {
      user_id: user.id,
      course_id: topic.course_id,
      topic_id: topicId,
    });

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
