import { NextResponse } from "next/server";

import { ingestFiles, validateUpload } from "@/server/documents/ingest";
import { createClient } from "@/server/db/client";

export const maxDuration = 300;

/**
 * Adds documents to an existing course. The structure is left stale on purpose:
 * the client re-runs the outline afterwards, so the student sees it happen.
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not signed in." }, { status: 401 });

  const { data: existing } = await supabase
    .from("documents")
    .select("position")
    .eq("course_id", id)
    .order("position", { ascending: false })
    .limit(1);

  const form = await request.formData();
  const files = form.getAll("files").filter((f): f is File => f instanceof File);

  const { count } = await supabase
    .from("documents")
    .select("id", { count: "exact", head: true })
    .eq("course_id", id);

  const invalid = validateUpload(files, count ?? 0);
  if (invalid) return NextResponse.json({ error: invalid }, { status: 400 });

  const nextPosition = (existing?.[0]?.position ?? -1) + 1;
  const { failures, filesAdded } = await ingestFiles(
    supabase,
    user.id,
    id,
    files,
    nextPosition,
  );

  return NextResponse.json({ filesAdded, warnings: failures });
}
