import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { AppHeader } from "@/components/AppHeader";
import { CardManager } from "@/components/CardManager";
import { GenerateCards } from "@/components/GenerateCards";
import { createClient } from "@/lib/supabase/server";
import type { Card } from "@/lib/types";

export default async function TopicCardsPage({
  params,
}: {
  params: Promise<{ id: string; topicId: string }>;
}) {
  const { id, topicId } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: topic } = await supabase
    .from("topics")
    .select("id, title, summary, key_terms, course_id")
    .eq("id", topicId)
    .single();
  if (!topic || topic.course_id !== id) notFound();

  const { data: cards } = await supabase
    .from("cards")
    .select("*")
    .eq("topic_id", topicId)
    .order("created_at");

  const keyTerms = (Array.isArray(topic.key_terms) ? topic.key_terms : []) as string[];

  return (
    <div className="min-h-dvh">
      <AppHeader email={user.email} />

      <main className="mx-auto max-w-3xl px-6 py-10">
        <Link href={`/courses/${id}`} className="text-sm text-ink-soft hover:text-ink">
          Back to the course
        </Link>

        <h1 className="mt-3 font-reading text-[2rem] leading-tight text-ink">{topic.title}</h1>
        {topic.summary && (
          <p className="mt-2 max-w-[66ch] text-[0.95rem] leading-relaxed text-ink-soft">
            {topic.summary}
          </p>
        )}

        {keyTerms.length > 0 && (
          <p className="mt-3 max-w-[66ch] text-[0.9rem] leading-relaxed text-ink-faint">
            Key terms: {keyTerms.join(", ")}
          </p>
        )}

        <div className="mt-6 flex flex-wrap items-center gap-3">
          <Link
            href={`/study/${topicId}`}
            className="rounded-full bg-ink px-5 py-2.5 text-[0.95rem] font-medium text-paper hover:opacity-90"
          >
            Study this topic
          </Link>
          <GenerateCards
            label={cards?.length ? "Write these cards again" : "Write the cards"}
            topics={[{ id: topicId, title: topic.title }]}
          />
        </div>

        {cards && cards.length > 0 && (
          <p className="mt-6 text-sm text-ink-faint">
            Writing them again replaces every card here, and clears the review history that
            went with them.
          </p>
        )}

        <CardManager cards={(cards ?? []) as Card[]} />
      </main>
    </div>
  );
}
