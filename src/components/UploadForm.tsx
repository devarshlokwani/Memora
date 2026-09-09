"use client";

import { useRouter } from "next/navigation";
import { useRef, useState } from "react";

import { ACCEPTED_FILE_TYPES } from "@/lib/types";

type Stage = "idle" | "reading" | "structuring";

const STAGE_COPY: Record<Exclude<Stage, "idle">, { title: string; body: string }> = {
  reading: {
    title: "Reading your documents",
    body: "Pulling the text out of every file.",
  },
  structuring: {
    title: "Building the structure",
    body: "Working out the themes and splitting them into topics. This is the slow part — a minute or two for a long document.",
  },
};

function formatSize(bytes: number) {
  const mb = bytes / (1024 * 1024);
  return mb >= 1 ? `${mb.toFixed(1)} MB` : `${Math.max(1, Math.round(bytes / 1024))} KB`;
}

export function UploadForm() {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);

  const [files, setFiles] = useState<File[]>([]);
  const [title, setTitle] = useState("");
  const [stage, setStage] = useState<Stage>("idle");
  const [error, setError] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);

  function addFiles(incoming: FileList | null) {
    if (!incoming) return;
    const next = [...files];
    for (const file of Array.from(incoming)) {
      if (!next.some((f) => f.name === file.name && f.size === file.size)) next.push(file);
    }
    setFiles(next.slice(0, 12));
    setError(null);
  }

  function removeFile(index: number) {
    setFiles(files.filter((_, i) => i !== index));
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (files.length === 0) {
      setError("Add at least one document.");
      return;
    }

    setError(null);
    setStage("reading");

    try {
      const form = new FormData();
      for (const file of files) form.append("files", file);
      if (title.trim()) form.append("title", title.trim());

      const createResponse = await fetch("/api/courses", { method: "POST", body: form });
      const created = await createResponse.json();
      if (!createResponse.ok) throw new Error(created.error ?? "Upload failed.");

      setStage("structuring");

      const outlineResponse = await fetch(`/api/courses/${created.courseId}/outline`, {
        method: "POST",
      });
      const outlined = await outlineResponse.json();
      // The course exists either way, so send them to it and show the failure there.
      if (!outlineResponse.ok) throw new Error(outlined.error ?? "Structuring failed.");

      router.push(`/courses/${created.courseId}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
      setStage("idle");
    }
  }

  if (stage !== "idle") {
    const copy = STAGE_COPY[stage];
    return (
      <div className="mt-10 rounded-card border border-rule bg-card p-8 shadow-[var(--shadow-card)]">
        <div className="flex items-center gap-3">
          <span className="h-2 w-2 animate-pulse rounded-full bg-highlight-deep" />
          <h2 className="font-reading text-xl text-ink">{copy.title}</h2>
        </div>
        <p className="mt-2 max-w-[54ch] text-[0.95rem] leading-relaxed text-ink-soft">
          {copy.body}
        </p>
        <p className="mt-6 text-sm text-ink-faint">Keep this tab open.</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="mt-8">
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          addFiles(e.dataTransfer.files);
        }}
        className={`paper-grid rounded-card border-2 border-dashed px-6 py-12 text-center transition-colors ${
          dragging ? "border-ink bg-card" : "border-rule"
        }`}
      >
        <p className="font-reading text-xl text-ink">Drop your files here</p>
        <p className="mt-1.5 text-sm text-ink-soft">PDF, DOCX, TXT or Markdown, up to 25 MB each</p>
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="mt-5 rounded-md border border-ink px-4 py-2 text-[0.95rem] font-medium text-ink hover:bg-card"
        >
          Choose files
        </button>
        <input
          ref={inputRef}
          type="file"
          multiple
          accept={ACCEPTED_FILE_TYPES}
          onChange={(e) => addFiles(e.target.files)}
          className="hidden"
        />
      </div>

      {files.length > 0 && (
        <ul className="mt-5 divide-y divide-rule border-y border-rule">
          {files.map((file, index) => (
            <li key={`${file.name}-${index}`} className="flex items-center gap-4 py-3">
              <span className="min-w-0 flex-1 truncate text-[0.95rem] text-ink">{file.name}</span>
              <span className="shrink-0 text-sm text-ink-faint">{formatSize(file.size)}</span>
              <button
                type="button"
                onClick={() => removeFile(index)}
                className="shrink-0 text-sm text-ink-soft hover:text-wrong"
              >
                Remove
              </button>
            </li>
          ))}
        </ul>
      )}

      <label className="mt-6 block">
        <span className="text-sm font-medium text-ink">Course name</span>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Leave blank and Memora will name it"
          className="mt-1.5 w-full rounded-md border border-rule bg-card px-3 py-2.5 text-[0.95rem] text-ink outline-none placeholder:text-ink-faint focus:border-ink"
        />
      </label>

      {error && (
        <p className="mt-5 rounded-md bg-wrong-soft px-3 py-2 text-sm text-wrong">{error}</p>
      )}

      <button
        type="submit"
        disabled={files.length === 0}
        className="mt-6 w-full rounded-md bg-ink px-4 py-3 text-[0.95rem] font-medium text-paper hover:opacity-90 disabled:opacity-40"
      >
        Build my course
      </button>
    </form>
  );
}
