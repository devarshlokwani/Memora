import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";

/** Rename a course. */
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not signed in." }, { status: 401 });

  const { title } = (await request.json()) as { title?: string };
  if (!title?.trim()) {
    return NextResponse.json({ error: "Give the course a name." }, { status: 400 });
  }

  const { error } = await supabase
    .from("courses")
    .update({ title: title.trim() })
    .eq("id", id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ title: title.trim() });
}

/** Delete a course, its cards and progress (via cascade), and its stored files. */
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not signed in." }, { status: 401 });

  // Storage has no foreign key to the course, so its objects go first and by hand.
  const { data: docs } = await supabase
    .from("documents")
    .select("storage_path")
    .eq("course_id", id);

  const paths = (docs ?? []).map((d) => d.storage_path).filter(Boolean) as string[];
  if (paths.length) await supabase.storage.from("documents").remove(paths);

  const { error } = await supabase.from("courses").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ deleted: true });
}
