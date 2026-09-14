"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function RetryOutline({ courseId }: { courseId: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function retry() {
    setBusy(true);
    setError(null);
    try {
      const response = await fetch(`/api/courses/${courseId}/outline`, { method: "POST" });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error ?? "Structuring failed.");
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Structuring failed.");
    }
    setBusy(false);
  }

  return (
    <div>
      <button
        type="button"
        onClick={retry}
        disabled={busy}
        className="rounded-full bg-ink px-5 py-2.5 text-[0.95rem] font-medium text-paper hover:opacity-90 disabled:opacity-50"
      >
        {busy ? "Building the structure" : "Build the structure again"}
      </button>
      {error && <p className="mt-3 text-sm text-ink-soft">{error}</p>}
    </div>
  );
}
