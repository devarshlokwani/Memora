import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { AppHeader } from "@/components/layout/AppHeader";
import { CourseSettings } from "@/components/course/CourseSettings";
import { GenerateCards } from "@/components/course/GenerateCards";
import { RetryOutline } from "@/components/course/RetryOutline";
import { Swipe } from "@/components/ui/Swipe";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { createClient } from "@/server/db/client";
import type { DocumentRow, Module, Topic } from "@/lib/types";

function formatSize(bytes: number) {
  const mb = bytes / (1024 * 1024);
  return mb >= 1 ? `${mb.toFixed(1)} MB` : `${Math.max(1, Math.round(bytes / 1024))} KB`;
}

export default async function CoursePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  // Unconfigured builds (no env vars) must not crash here: the proxy already
  // sends a signed-out visitor to /setup, but a prerender pass calls this
  // function directly, before the proxy ever runs.
  if (!isSupabaseConfigured()) redirect("/setup");

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: course } = await supabase.from("courses").select("*").eq("id", id).single();
  if (!course) notFound();

  const [{ data: modules }, { data: topics }, { data: cards }, { data: progress }, { data: documents }] =
    await Promise.all([
      supabase.from("modules").select("*").eq("course_id", id).order("position"),
      supabase.from("topics").select("*").eq("course_id", id).order("position"),
      supabase.from("cards").select("id, topic_id").eq("course_id", id),
      supabase.from("card_progress").select("card_id, due_at").eq("course_id", id),
      supabase.from("documents").select("*").eq("course_id", id).order("position"),
    ]);

  const now = Date.now();
  const dueByCard = new Map((progress ?? []).map((p) => [p.card_id, new Date(p.due_at).getTime()]));

  const cardsByTopic = new Map<string, { total: number; due: number }>();
  for (const card of cards ?? []) {
    const entry = cardsByTopic.get(card.topic_id) ?? { total: 0, due: 0 };
    entry.total += 1;
    // A card never answered is due to be learned, so it counts toward the queue.
    const due = dueByCard.get(card.id);
    if (due === undefined || due <= now) entry.due += 1;
    cardsByTopic.set(card.topic_id, entry);
  }

  const allTopics = (topics ?? []) as Topic[];
  const pendingTopics = allTopics.filter((t) => (cardsByTopic.get(t.id)?.total ?? 0) === 0);
  const totalCards = cards?.length ?? 0;
  const seenCount = dueByCard.size;
  const dueTotal = [...cardsByTopic.values()].reduce((n, e) => n + e.due, 0);
  const docs = (documents ?? []) as DocumentRow[];

  return (
    <div className="flex flex-1 flex-col">
      <AppHeader email={user.email} />

      <main className="mx-auto max-w-4xl px-6 py-10">
        <Link href="/dashboard" className="text-sm text-ink-soft hover:text-ink">
          All courses
        </Link>

        <h1 className="mt-3 font-reading text-[2.1rem] leading-tight text-ink">{course.title}</h1>
        {course.description && (
          <p className="mt-2 max-w-[68ch] text-[1rem] leading-relaxed text-ink-soft">
            {course.description}
          </p>
        )}

        {course.status === "failed" && (
          <div className="mt-6 sketch sketch-b hatch p-5">
            <h2 className="font-medium text-ink">Memora could not structure this material</h2>
            <p className="mt-1.5 text-sm leading-relaxed text-ink-soft">
              {course.error ?? "The structuring pass failed."}
            </p>
            <div className="mt-4">
              <RetryOutline courseId={id} />
            </div>
          </div>
        )}

        {totalCards > 0 && (
          <div className="mt-7 flex flex-wrap items-center gap-x-6 gap-y-4">
            <Link
              href={`/courses/${id}/study`}
              className="rounded-full bg-ink px-5 py-2.5 text-[0.95rem] font-medium text-paper hover:opacity-90"
            >
              {dueTotal > 0 ? `Study ${dueTotal} due cards` : "Study anyway"}
            </Link>
            <div className="min-w-48 flex-1">
              <Swipe value={seenCount} total={totalCards} />
              <p className="mt-2 text-sm text-ink-faint">
                {seenCount} of {totalCards} cards seen
              </p>
            </div>
          </div>
        )}

        {pendingTopics.length > 0 && allTopics.length > 0 && (
          <div className="mt-7 sketch sketch-a p-5 shadow-[var(--shadow-card)]">
            <h2 className="font-reading text-xl text-ink">
              {totalCards === 0 ? "No cards yet" : `${pendingTopics.length} topics have no cards`}
            </h2>
            <p className="mt-1.5 max-w-[60ch] text-[0.95rem] leading-relaxed text-ink-soft">
              Memora writes cards one topic at a time so you can start studying the early topics
              while the rest are still being written.
            </p>
            <GenerateCards
              className="mt-4"
              label={totalCards === 0 ? "Write all the cards" : "Write the missing cards"}
              topics={pendingTopics.map((t) => ({ id: t.id, title: t.title }))}
            />
          </div>
        )}

        <div className="mt-12 space-y-10">
          {((modules ?? []) as Module[]).map((mod, index) => {
            const moduleTopics = allTopics.filter((t) => t.module_id === mod.id);
            return (
              <section key={mod.id}>
                {/* Module dividers are numbered because a course genuinely is a sequence. */}
                <div className="flex items-baseline gap-3 border-b-2 border-ink pb-2">
                  <span className="font-reading text-xl text-ink-faint">{index + 1}</span>
                  <h2 className="text-[1.15rem] font-semibold tracking-[-0.02em] text-ink">
                    {mod.title}
                  </h2>
                </div>
                {mod.summary && (
                  <p className="mt-2.5 max-w-[68ch] text-[0.95rem] leading-relaxed text-ink-soft">
                    {mod.summary}
                  </p>
                )}

                <ul className="mt-4 divide-y divide-rule">
                  {moduleTopics.map((topic) => {
                    const stats = cardsByTopic.get(topic.id);
                    return (
                      <li key={topic.id} className="py-4">
                        <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2">
                          <div className="min-w-0 flex-1">
                            <h3 className="font-reading text-lg text-ink">{topic.title}</h3>
                            {topic.summary && (
                              <p className="mt-1 max-w-[64ch] text-[0.9rem] leading-relaxed text-ink-soft">
                                {topic.summary}
                              </p>
                            )}
                            {stats && (
                              <p className="mt-1.5 text-sm text-ink-faint">
                                {stats.total} cards
                                {stats.due > 0 && (
                                  <>
                                    {" · "}
                                    <span className="text-ink">{stats.due} due</span>
                                  </>
                                )}
                                {" · "}
                                <Link
                                  href={`/courses/${id}/topics/${topic.id}`}
                                  className="underline decoration-rule underline-offset-2 hover:text-ink"
                                >
                                  Manage cards
                                </Link>
                              </p>
                            )}
                          </div>

                          {stats ? (
                            <Link
                              href={`/study/${topic.id}`}
                              className="shrink-0 rounded-full border border-ink px-4 py-1.5 text-sm font-medium text-ink hover:bg-card"
                            >
                              Study
                            </Link>
                          ) : topic.status === "failed" ? (
                            <span className="shrink-0 text-sm text-ink-soft">Card writing failed</span>
                          ) : (
                            <span className="shrink-0 text-sm text-ink-faint">No cards yet</span>
                          )}
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </section>
            );
          })}
        </div>

        {allTopics.length === 0 && course.status !== "failed" && (
          <p className="mt-10 text-[0.95rem] text-ink-soft">This course has no topics yet.</p>
        )}

        <section className="mt-14">
          <h2 className="border-b-2 border-ink pb-2 text-[1.15rem] font-semibold tracking-[-0.02em] text-ink">
            Source material
          </h2>
          <ul className="divide-y divide-rule">
            {docs.map((doc) => (
              <li key={doc.id} className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1 py-3">
                <span className="min-w-0 flex-1 truncate text-[0.95rem] text-ink">
                  {doc.filename}
                </span>
                {doc.status === "failed" ? (
                  <span className="shrink-0 text-sm text-ink-soft">Could not be read</span>
                ) : (
                  <span className="shrink-0 text-sm text-ink-faint">
                    {doc.page_count ? `${doc.page_count} pages · ` : ""}
                    {formatSize(doc.size_bytes)}
                  </span>
                )}
              </li>
            ))}
          </ul>
          {docs.some((d) => d.status === "failed") && (
            <p className="mt-3 max-w-[64ch] text-sm leading-relaxed text-ink-soft">
              {docs.find((d) => d.status === "failed")?.error}
            </p>
          )}
        </section>

        <CourseSettings courseId={id} title={course.title} documentCount={docs.length} />
      </main>
    </div>
  );
}
