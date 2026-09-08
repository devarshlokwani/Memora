import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";
import { INITIAL_STATE, schedule } from "@/lib/srs";
import type { Grade } from "@/lib/types";

/** Records one answer and reschedules the card. */
export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not signed in." }, { status: 401 });

  const body = (await request.json()) as {
    cardId?: string;
    grade?: number;
    correct?: boolean;
  };

  const { cardId } = body;
  const grade = body.grade;
  if (!cardId || grade === undefined || grade < 0 || grade > 3) {
    return NextResponse.json({ error: "cardId and a grade of 0-3 are required." }, { status: 400 });
  }

  const { data: card } = await supabase
    .from("cards")
    .select("id, course_id")
    .eq("id", cardId)
    .single();
  if (!card) return NextResponse.json({ error: "Card not found." }, { status: 404 });

  const { data: existing } = await supabase
    .from("card_progress")
    .select("ease, interval_days, repetitions, lapses, total_reviews, correct_reviews")
    .eq("card_id", cardId)
    .eq("user_id", user.id)
    .maybeSingle();

  const state = existing ?? { ...INITIAL_STATE, total_reviews: 0, correct_reviews: 0 };
  const next = schedule(state, grade as Grade);
  const wasCorrect = body.correct ?? grade >= 2;

  const { error } = await supabase.from("card_progress").upsert(
    {
      user_id: user.id,
      card_id: cardId,
      course_id: card.course_id,
      ease: next.ease,
      interval_days: next.interval_days,
      repetitions: next.repetitions,
      lapses: next.lapses,
      due_at: next.due_at,
      last_reviewed_at: new Date().toISOString(),
      total_reviews: state.total_reviews + 1,
      correct_reviews: state.correct_reviews + (wasCorrect ? 1 : 0),
    },
    { onConflict: "user_id,card_id" },
  );

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ dueAt: next.due_at, intervalDays: next.interval_days });
}
