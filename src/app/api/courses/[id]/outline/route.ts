import { NextResponse } from "next/server";

import { generateOutline } from "@/lib/ai";
import { chunkDocuments } from "@/lib/chunk";
import { createClient } from "@/lib/supabase/server";
import { planCardRestore, planProgressRestore } from "@/lib/rebuild";
import type { Card, CardProgress } from "@/lib/types";

export const maxDuration = 300;

type Supabase = Awaited<ReturnType<typeof createClient>>;

type Snapshot = {
  oldTopics: { id: string; title: string }[];
  cardsByTopic: Map<string, Card[]>;
  progressByCard: Map<string, CardProgress>;
};

/** Everything worth keeping if a topic survives the rebuild. */
async function snapshot(supabase: Supabase, courseId: string): Promise<Snapshot> {
  const [{ data: topics }, { data: cards }, { data: progress }] = await Promise.all([
    supabase.from("topics").select("id, title").eq("course_id", courseId),
    supabase.from("cards").select("*").eq("course_id", courseId),
    supabase.from("card_progress").select("*").eq("course_id", courseId),
  ]);

  const cardsByTopic = new Map<string, Card[]>();
  for (const card of (cards ?? []) as Card[]) {
    const list = cardsByTopic.get(card.topic_id) ?? [];
    list.push(card);
    cardsByTopic.set(card.topic_id, list);
  }

  return {
    oldTopics: (topics ?? []) as { id: string; title: string }[],
    cardsByTopic,
    progressByCard: new Map(
      ((progress ?? []) as CardProgress[]).map((p) => [p.card_id, p]),
    ),
  };
}

/**
 * Re-attaches the old cards to whichever new topics kept the same title, and
 * carries their review schedule across. Without this, adding one document to a
 * course would silently throw away a term's worth of study history.
 */
async function restoreCards(
  supabase: Supabase,
  userId: string,
  courseId: string,
  before: Snapshot,
  newTopics: { id: string; title: string }[],
) {
  const { rows, oldCardByKey } = planCardRestore({
    userId,
    courseId,
    oldTopics: before.oldTopics,
    cardsByTopic: before.cardsByTopic,
    newTopics,
  });

  if (rows.length === 0) return 0;

  const { data: inserted } = await supabase
    .from("cards")
    .insert(rows)
    .select("id, topic_id, type, prompt");

  const progressRows = planProgressRestore({
    userId,
    courseId,
    inserted: (inserted ?? []) as { id: string; topic_id: string; type: string; prompt: string }[],
    oldCardByKey,
    progressByCard: before.progressByCard,
  });

  if (progressRows.length) await supabase.from("card_progress").insert(progressRows);

  // Topics that got their cards back are ready to study immediately.
  const restoredTopicIds = [...new Set((inserted ?? []).map((c) => c.topic_id))];
  if (restoredTopicIds.length) {
    await supabase.from("topics").update({ status: "ready" }).in("id", restoredTopicIds);
  }

  return rows.length;
}

/** Runs the structuring pass: source text in, modules and topics out. */
export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: courseId } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not signed in." }, { status: 401 });

  const { data: course } = await supabase
    .from("courses")
    .select("id, title")
    .eq("id", courseId)
    .single();
  if (!course) return NextResponse.json({ error: "Course not found." }, { status: 404 });

  const { data: docs } = await supabase
    .from("documents")
    .select("id, filename, content")
    .eq("course_id", courseId)
    .eq("status", "extracted")
    .order("position");

  if (!docs?.length) {
    return NextResponse.json({ error: "This course has no readable text." }, { status: 422 });
  }

  // Capture the current cards first: deleting the modules cascades through
  // topics to cards and progress, so this is the only chance to keep them.
  const before = await snapshot(supabase, courseId);

  await supabase.from("courses").update({ status: "structuring", error: null }).eq("id", courseId);

  try {
    const chunks = chunkDocuments(docs);
    const outline = await generateOutline(
      docs.map((d) => d.filename),
      chunks,
    );

    // Only destroy the old structure once the model has returned a new one.
    await supabase.from("modules").delete().eq("course_id", courseId);

    const newTopics: { id: string; title: string }[] = [];

    for (const [modulePosition, mod] of outline.modules.entries()) {
      const { data: insertedModule, error: moduleError } = await supabase
        .from("modules")
        .insert({
          user_id: user.id,
          course_id: courseId,
          title: mod.title,
          summary: mod.summary,
          position: modulePosition,
        })
        .select("id")
        .single();

      if (moduleError || !insertedModule) throw new Error(moduleError?.message);

      const topicRows = mod.topics.map((topic, position) => ({
        user_id: user.id,
        course_id: courseId,
        module_id: insertedModule.id,
        title: topic.title,
        summary: topic.summary,
        key_terms: topic.key_terms,
        chunk_refs: topic.chunk_refs,
        position,
      }));

      if (topicRows.length) {
        const { data: insertedTopics, error: topicError } = await supabase
          .from("topics")
          .insert(topicRows)
          .select("id, title");
        if (topicError) throw new Error(topicError.message);
        newTopics.push(...((insertedTopics ?? []) as { id: string; title: string }[]));
      }
    }

    const keptCards = await restoreCards(supabase, user.id, courseId, before, newTopics);

    await supabase
      .from("courses")
      .update({
        title: outline.title || course.title,
        description: outline.description,
        status: "ready",
        error: null,
      })
      .eq("id", courseId);

    return NextResponse.json({
      modules: outline.modules.length,
      topics: newTopics.length,
      keptCards,
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Structuring failed.";
    await supabase.from("courses").update({ status: "failed", error: message }).eq("id", courseId);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
