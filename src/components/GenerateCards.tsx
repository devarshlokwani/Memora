"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { Swipe } from "@/components/Swipe";

type Pending = { id: string; title: string };

/**
 * Walks the pending topics one request at a time. Sequential on purpose: each
 * topic is a separate model call, and firing twenty at once just trades a
 * progress bar for a rate-limit error.
 */
export function GenerateCards({
  topics,
  label,
  className = "",
}: {
  topics: Pending[];
  label: string;
  className?: string;
}) {
  const router = useRouter();
  const [done, setDone] = useState(0);
  const [current, setCurrent] = useState<string | null>(null);
  const [running, setRunning] = useState(false);
  const [failed, setFailed] = useState<string[]>([]);

  async function run() {
    setRunning(true);
    setDone(0);
    setFailed([]);

    for (const topic of topics) {
      setCurrent(topic.title);
      try {
        const response = await fetch(`/api/topics/${topic.id}/cards`, { method: "POST" });
        if (!response.ok) throw new Error();
      } catch {
        setFailed((f) => [...f, topic.title]);
      }
      setDone((n) => n + 1);
    }

    setCurrent(null);
    setRunning(false);
    router.refresh();
  }

  if (running) {
    return (
      <div className={`sketch sketch-a p-5 ${className}`}>
        <div className="flex items-baseline justify-between gap-4">
          <p className="text-[0.95rem] font-medium text-ink">Writing cards</p>
          <p className="text-sm text-ink-faint">
            {done} of {topics.length}
          </p>
        </div>
        <Swipe value={done} total={topics.length} className="mt-3" />
        {current && <p className="mt-3 truncate text-sm text-ink-soft">{current}</p>}
      </div>
    );
  }

  return (
    <div className={className}>
      <button
        type="button"
        onClick={run}
        className="rounded-full bg-ink px-5 py-2.5 text-[0.95rem] font-medium text-paper hover:opacity-90"
      >
        {label}
      </button>
      {failed.length > 0 && (
        <p className="mt-3 rounded-full bg-ink-soft px-3 py-2 text-sm text-ink-soft">
          Could not write cards for {failed.length} {failed.length === 1 ? "topic" : "topics"}:{" "}
          {failed.join(", ")}. Try those again.
        </p>
      )}
    </div>
  );
}
