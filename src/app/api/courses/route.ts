import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";
import { UnsupportedFileError, extractDocument } from "@/lib/extract";

export const maxDuration = 300;

const MAX_FILES = 12;
const MAX_FILE_BYTES = 25 * 1024 * 1024;
const MIN_USEFUL_CHARS = 200;

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

  if (files.length === 0) {
    return NextResponse.json({ error: "Upload at least one document." }, { status: 400 });
  }
  if (files.length > MAX_FILES) {
    return NextResponse.json(
      { error: `Up to ${MAX_FILES} documents per course.` },
      { status: 400 },
    );
  }
  const tooBig = files.find((f) => f.size > MAX_FILE_BYTES);
  if (tooBig) {
    return NextResponse.json(
      { error: `${tooBig.name} is larger than 25 MB.` },
      { status: 400 },
    );
  }

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

  const failures: string[] = [];
  let totalChars = 0;

  for (const [position, file] of files.entries()) {
    const buffer = await file.arrayBuffer();

    let text = "";
    let pageCount: number | null = null;
    let status: "extracted" | "failed" = "extracted";
    let error: string | null = null;

    try {
      const extraction = await extractDocument(file.name, file.type, buffer);
      text = extraction.text;
      pageCount = extraction.pageCount;
      if (text.length < MIN_USEFUL_CHARS) {
        throw new Error(
          `${file.name}: almost no text came out. Scanned pages need OCR before Memora can read them.`,
        );
      }
    } catch (e) {
      status = "failed";
      error =
        e instanceof UnsupportedFileError || e instanceof Error
          ? e.message
          : `${file.name}: could not be read.`;
      failures.push(error);
    }

    // Keep the original around so the student can re-download it; a storage
    // failure must not lose the text we already extracted.
    const storagePath = `${user.id}/${course.id}/${position}-${file.name}`;
    const { error: uploadError } = await supabase.storage
      .from("documents")
      .upload(storagePath, buffer, {
        contentType: file.type || "application/octet-stream",
        upsert: true,
      });

    await supabase.from("documents").insert({
      user_id: user.id,
      course_id: course.id,
      filename: file.name,
      storage_path: uploadError ? null : storagePath,
      mime_type: file.type,
      size_bytes: file.size,
      content: text,
      char_count: text.length,
      page_count: pageCount,
      status,
      error,
      position,
    });

    totalChars += text.length;
  }

  if (totalChars < MIN_USEFUL_CHARS) {
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
