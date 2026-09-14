import "server-only";

import type { createClient } from "@/server/db/client";

import { UnsupportedFileError, extractDocument } from "@/server/documents/extract";

type Supabase = Awaited<ReturnType<typeof createClient>>;

export const MAX_FILES = 12;
export const MAX_FILE_BYTES = 25 * 1024 * 1024;
export const MIN_USEFUL_CHARS = 200;

export type IngestResult = {
  failures: string[];
  charsAdded: number;
  filesAdded: number;
};

/** Rejects the upload before any of it is written, so a course is never half-made. */
export function validateUpload(files: File[], existingCount = 0): string | null {
  if (files.length === 0) return "Upload at least one document.";
  if (files.length + existingCount > MAX_FILES) {
    return `Up to ${MAX_FILES} documents per course.`;
  }
  const tooBig = files.find((f) => f.size > MAX_FILE_BYTES);
  if (tooBig) return `${tooBig.name} is larger than 25 MB.`;
  return null;
}

/**
 * Extracts every file to text and stores both the text and the original. A file
 * that cannot be read is recorded as failed rather than aborting the batch --
 * one scanned PDF should not cost a student the other five documents.
 */
export async function ingestFiles(
  supabase: Supabase,
  userId: string,
  courseId: string,
  files: File[],
  startPosition = 0,
): Promise<IngestResult> {
  const failures: string[] = [];
  let charsAdded = 0;
  let filesAdded = 0;

  for (const [offset, file] of files.entries()) {
    const position = startPosition + offset;
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

    // Keep the original so the student can re-download it; a storage failure
    // must not lose the text we already extracted.
    const storagePath = `${userId}/${courseId}/${position}-${file.name}`;
    const { error: uploadError } = await supabase.storage
      .from("documents")
      .upload(storagePath, buffer, {
        contentType: file.type || "application/octet-stream",
        upsert: true,
      });

    await supabase.from("documents").insert({
      user_id: userId,
      course_id: courseId,
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

    charsAdded += text.length;
    if (status === "extracted") filesAdded += 1;
  }

  return { failures, charsAdded, filesAdded };
}
