import { NextResponse } from "next/server";

import { generateOutline } from "@/lib/ai";
import { chunkDocuments } from "@/lib/chunk";
import { createClient } from "@/lib/supabase/server";

export const maxDuration = 300;

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

  // Regenerating replaces the structure wholesale; cards cascade away with topics.
  await supabase.from("modules").delete().eq("course_id", courseId);
  await supabase.from("courses").update({ status: "structuring", error: null }).eq("id", courseId);

  try {
    const chunks = chunkDocuments(docs);
    const outline = await generateOutline(
      docs.map((d) => d.filename),
      chunks,
    );

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
        const { error: topicError } = await supabase.from("topics").insert(topicRows);
        if (topicError) throw new Error(topicError.message);
      }
    }

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
      topics: outline.modules.reduce((n, m) => n + m.topics.length, 0),
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Structuring failed.";
    await supabase.from("courses").update({ status: "failed", error: message }).eq("id", courseId);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
