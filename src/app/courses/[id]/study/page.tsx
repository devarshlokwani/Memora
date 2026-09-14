import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { AppHeader } from "@/components/layout/AppHeader";
import { StudySession } from "@/components/study/StudySession";
import { createClient } from "@/server/db/client";
import type { Card } from "@/lib/types";

/** A review session drawn from every topic in the course, not just one. */
export default async function CourseStudyPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: course } = await supabase
    .from("courses")
    .select("id, title")
    .eq("id", id)
    .single();
  if (!course) notFound();

  const [{ data: cards }, { data: progress }] = await Promise.all([
    supabase.from("cards").select("*").eq("course_id", id),
    supabase.from("card_progress").select("card_id, due_at").eq("course_id", id),
  ]);

  const dueByCard = new Map((progress ?? []).map((p) => [p.card_id, p.due_at as string]));

  return (
    <div className="min-h-dvh">
      <AppHeader email={user.email} />
      <main className="mx-auto max-w-3xl px-6 py-8">
        <Link href={`/courses/${id}`} className="text-sm text-ink-soft hover:text-ink">
          {course.title}
        </Link>

        <StudySession
          topicTitle="Everything in this course"
          courseId={id}
          cards={((cards ?? []) as Card[]).map((card) => ({
            ...card,
            dueAt: dueByCard.get(card.id) ?? null,
          }))}
        />
      </main>
    </div>
  );
}
