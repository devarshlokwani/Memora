import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";

/** Records a finished study session so the dashboard can show real activity. */
export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not signed in." }, { status: 401 });

  const body = (await request.json()) as {
    courseId?: string | null;
    topicId?: string | null;
    mode?: string;
    answered?: number;
    correct?: number;
    startedAt?: string;
  };

  if (!body.mode) {
    return NextResponse.json({ error: "mode is required." }, { status: 400 });
  }
  if (!body.answered) return NextResponse.json({ recorded: false });

  const { error } = await supabase.from("study_sessions").insert({
    user_id: user.id,
    course_id: body.courseId ?? null,
    topic_id: body.topicId ?? null,
    mode: body.mode,
    answered: body.answered,
    correct: body.correct ?? 0,
    started_at: body.startedAt ?? new Date().toISOString(),
    ended_at: new Date().toISOString(),
  });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ recorded: true });
}
