import Link from "next/link";
import { redirect } from "next/navigation";

import { AppHeader } from "@/components/layout/AppHeader";
import { Swipe } from "@/components/ui/Swipe";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { createClient } from "@/server/db/client";
import type { Course } from "@/lib/types";

type Stats = {
  course_id: string;
  topic_count: number;
  ready_topic_count: number;
  card_count: number;
  seen_count: number;
  due_count: number;
};

type Session = { answered: number; correct: number; started_at: string };

const STATUS_NOTE: Record<string, string> = {
  extracting: "Reading your documents",
  structuring: "Building the structure",
  failed: "Something went wrong",
};

const dayKey = (iso: string) => new Date(iso).toISOString().slice(0, 10);

/** Consecutive days with at least one session, counting back from today. */
function currentStreak(sessions: Session[]) {
  const days = new Set(sessions.map((s) => dayKey(s.started_at)));
  if (days.size === 0) return 0;

  const today = new Date();
  // A streak survives until today's session is missed, so start from yesterday
  // if nothing has been studied yet today.
  let cursor = new Date(today);
  if (!days.has(dayKey(cursor.toISOString()))) {
    cursor.setDate(cursor.getDate() - 1);
    if (!days.has(dayKey(cursor.toISOString()))) return 0;
  }

  let streak = 0;
  while (days.has(dayKey(cursor.toISOString()))) {
    streak += 1;
    cursor = new Date(cursor.getTime() - 86_400_000);
  }
  return streak;
}

export default async function DashboardPage() {
  // Unconfigured builds (no env vars) must not crash here: the proxy already
  // sends a signed-out visitor to /setup, but a prerender pass calls this
  // function directly, before the proxy ever runs.
  if (!isSupabaseConfigured()) redirect("/setup");

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const sinceIso = new Date(Date.now() - 60 * 86_400_000).toISOString();

  const [{ data: courses }, { data: stats }, { data: sessions }] = await Promise.all([
    supabase.from("courses").select("*").order("created_at", { ascending: false }),
    supabase.from("course_stats").select("*"),
    supabase
      .from("study_sessions")
      .select("answered, correct, started_at")
      .gte("started_at", sinceIso),
  ]);

  const statsById = new Map((stats ?? []).map((s: Stats) => [s.course_id, s]));
  const list = (courses ?? []) as Course[];
  const totalDue = (stats ?? []).reduce((n: number, s: Stats) => n + Number(s.due_count), 0);

  const recent = (sessions ?? []) as Session[];
  const answered = recent.reduce((n, s) => n + s.answered, 0);
  const correct = recent.reduce((n, s) => n + s.correct, 0);
  const accuracy = answered > 0 ? Math.round((correct / answered) * 100) : null;
  const streak = currentStreak(recent);

  return (
    <div className="flex flex-1 flex-col">
      <AppHeader email={user.email} />

      <main className="mx-auto max-w-5xl px-6 py-10">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-[1.9rem] font-semibold tracking-[-0.03em] text-ink">
              Your courses
            </h1>
            <p className="mt-1 text-[0.95rem] text-ink-soft">
              {list.length === 0
                ? "Nothing here yet."
                : totalDue > 0
                  ? `${totalDue} ${totalDue === 1 ? "card is" : "cards are"} due for review.`
                  : "Nothing due right now. Good place to get ahead."}
            </p>
          </div>
          <div className="flex flex-wrap gap-2.5">
            {totalDue > 0 && (
              <Link
                href="/review"
                className="rounded-full bg-ink px-5 py-2.5 text-[0.95rem] font-medium text-paper hover:opacity-90"
              >
                Review {totalDue} due
              </Link>
            )}
            <Link
              href="/courses/new"
              className={`rounded-full px-5 py-2.5 text-[0.95rem] font-medium ${
                totalDue > 0
                  ? "border border-ink text-ink hover:bg-card"
                  : "bg-ink text-paper hover:opacity-90"
              }`}
            >
              New course
            </Link>
          </div>
        </div>

        {answered > 0 && (
          <dl className="mt-8 flex flex-wrap gap-x-10 gap-y-4 border-y border-rule py-4">
            <Figure label="Day streak" value={streak === 0 ? "--" : String(streak)} />
            <Figure label="Cards answered, 60 days" value={String(answered)} />
            <Figure label="Answered right" value={accuracy === null ? "--" : `${accuracy}%`} />
          </dl>
        )}

        {list.length === 0 ? (
          <div className="paper-texture mt-10 sketch sketch-a border-dashed px-8 py-16 text-center">
            <h2 className="font-reading text-2xl text-ink">Start with one document</h2>
            <p className="mx-auto mt-3 max-w-[46ch] text-[0.95rem] leading-relaxed text-ink-soft">
              A chapter, a slide deck, a set of notes. Memora reads it, splits it into topics, and
              writes the cards.
            </p>
            <Link
              href="/courses/new"
              className="mt-6 inline-block rounded-full bg-ink px-5 py-2.5 text-[0.95rem] font-medium text-paper hover:opacity-90"
            >
              Upload your material
            </Link>
          </div>
        ) : (
          <ul className="mt-8 space-y-3">
            {list.map((course) => {
              const s = statsById.get(course.id);
              const cards = Number(s?.card_count ?? 0);
              const seen = Number(s?.seen_count ?? 0);
              const due = Number(s?.due_count ?? 0);
              const note = STATUS_NOTE[course.status];

              return (
                <li key={course.id}>
                  <Link
                    href={`/courses/${course.id}`}
                    className="block sketch sketch-b p-5 shadow-[var(--shadow-card)] transition-colors hover:border-ink"
                  >
                    <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1">
                      <h2 className="font-reading text-xl text-ink">{course.title}</h2>
                      {due > 0 ? (
                        <span className="rounded border border-ink px-2.5 py-0.5 text-sm font-medium text-ink">
                          {due} due
                        </span>
                      ) : note ? (
                        <span className="text-sm text-ink-faint">{note}</span>
                      ) : null}
                    </div>

                    {course.description && (
                      <p className="mt-1.5 line-clamp-2 max-w-[70ch] text-[0.95rem] leading-relaxed text-ink-soft">
                        {course.description}
                      </p>
                    )}

                    <div className="mt-4 flex items-center gap-4">
                      <Swipe value={seen} total={cards} className="max-w-xs" />
                      <span className="text-sm text-ink-faint">
                        {cards === 0
                          ? `${s?.topic_count ?? 0} topics, no cards yet`
                          : `${seen} of ${cards} cards seen`}
                      </span>
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </main>
    </div>
  );
}

function Figure({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-sm text-ink-faint">{label}</dt>
      <dd className="font-reading text-2xl text-ink tabular-nums">{value}</dd>
    </div>
  );
}
