import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { AppHeader } from "@/components/layout/AppHeader";
import { StudySession } from "@/components/study/StudySession";
import { createClient } from "@/server/db/client";
import type { Card } from "@/lib/types";

export default async function StudyPage({ params }: { params: Promise<{ topicId: string }> }) {
  const { topicId } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: topic } = await supabase
    .from("topics")
    .select("id, title, summary, course_id")
    .eq("id", topicId)
    .single();
  if (!topic) notFound();

  const [{ data: course }, { data: cards }, { data: progress }] = await Promise.all([
    supabase.from("courses").select("id, title").eq("id", topic.course_id).single(),
    supabase.from("cards").select("*").eq("topic_id", topicId),
    supabase.from("card_progress").select("card_id, due_at").eq("course_id", topic.course_id),
  ]);

  const dueByCard = new Map((progress ?? []).map((p) => [p.card_id, p.due_at as string]));

  return (
    <div className="flex flex-1 flex-col">
      <AppHeader email={user.email} />
      <main className="mx-auto max-w-3xl px-6 py-8">
        <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1 text-sm">
          <Link href={`/courses/${topic.course_id}`} className="text-ink-soft hover:text-ink">
            {course?.title ?? "Course"}
          </Link>
          <span className="text-ink-faint">/</span>
          <span className="text-ink-faint">{topic.title}</span>
        </div>

        <StudySession
          topicTitle={topic.title}
          courseId={topic.course_id}
          topicId={topic.id}
          cards={((cards ?? []) as Card[]).map((card) => ({
            ...card,
            dueAt: dueByCard.get(card.id) ?? null,
          }))}
        />
      </main>
    </div>
  );
}
