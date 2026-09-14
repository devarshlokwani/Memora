import { NextResponse } from "next/server";

import { MIN_USEFUL_CHARS, ingestFiles, validateUpload } from "@/server/documents/ingest";
import { createClient } from "@/server/db/client";

export const maxDuration = 300;

/** Creates a course and extracts text from every uploaded document. */
export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not signed in." }, { status: 401 });

  const form = await request.formData();
  const files = form.getAll("files").filter((f): f is File => f instanceof File);
  const providedTitle = (form.get("title") as string | null)?.trim();

  const invalid = validateUpload(files);
  if (invalid) return NextResponse.json({ error: invalid }, { status: 400 });

  const fallbackTitle = files[0].name.replace(/\.[^.]+$/, "");
  const { data: course, error: courseError } = await supabase
    .from("courses")
    .insert({
      user_id: user.id,
      title: providedTitle || fallbackTitle,
      status: "extracting",
    })
    .select()
    .single();

  if (courseError || !course) {
    return NextResponse.json(
      { error: courseError?.message ?? "Could not create the course." },
      { status: 500 },
    );
  }

  const { failures, charsAdded } = await ingestFiles(supabase, user.id, course.id, files);

  if (charsAdded < MIN_USEFUL_CHARS) {
    await supabase
      .from("courses")
      .update({ status: "failed", error: failures.join(" ") || "No readable text found." })
      .eq("id", course.id);
    return NextResponse.json(
      { error: failures.join(" ") || "None of those documents had readable text." },
      { status: 422 },
    );
  }

  await supabase.from("courses").update({ status: "structuring" }).eq("id", course.id);

  return NextResponse.json({ courseId: course.id, warnings: failures });
}
