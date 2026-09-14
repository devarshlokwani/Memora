import Link from "next/link";
import { redirect } from "next/navigation";

import { AppHeader } from "@/components/layout/AppHeader";
import { StudySession } from "@/components/study/StudySession";
import { createClient } from "@/server/db/client";
import type { Card } from "@/lib/types";

/** A session's worth of whatever is due, drawn from every course at once. */
const REVIEW_POOL = 120;

export default async function ReviewPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: due } = await supabase.from("due_cards").select("*").limit(REVIEW_POOL);

  const cards = (due ?? []) as (Card & { due_at: string | null })[];

  return (
    <div className="min-h-dvh">
      <AppHeader email={user.email} />
      <main className="mx-auto max-w-3xl px-6 py-8">
        <Link href="/dashboard" className="text-sm text-ink-soft hover:text-ink">
          All courses
        </Link>

        {cards.length === 0 ? (
          <div className="mt-10 sketch sketch-a p-8 text-center shadow-[var(--shadow-card)]">
            <h1 className="font-reading text-[1.8rem] leading-tight text-ink">
              Nothing is due
            </h1>
            <p className="mx-auto mt-2 max-w-[44ch] text-[0.95rem] leading-relaxed text-ink-soft">
              You are ahead of the schedule. Open a course if you want to work through cards
              early anyway.
            </p>
            <Link
              href="/dashboard"
              className="mt-6 inline-block rounded-full bg-ink px-5 py-2.5 text-[0.95rem] font-medium text-paper hover:opacity-90"
            >
              Back to your courses
            </Link>
          </div>
        ) : (
          <StudySession
            topicTitle="Everything due today"
            courseId={null}
            cards={cards.map((card) => ({ ...card, dueAt: card.due_at ?? null }))}
          />
        )}
      </main>
    </div>
  );
}
