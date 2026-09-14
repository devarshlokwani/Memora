"use client";

import { useRouter } from "next/navigation";
import { useRef, useState } from "react";

import { ACCEPTED_FILE_TYPES } from "@/lib/types";

type Panel = "none" | "rename" | "documents" | "delete";

export function CourseSettings({
  courseId,
  title,
  documentCount,
}: {
  courseId: string;
  title: string;
  documentCount: number;
}) {
  const router = useRouter();
  const [panel, setPanel] = useState<Panel>("none");

  return (
    <div className="mt-8 sketch sketch-a">
      <div className="flex flex-wrap gap-x-5 gap-y-2 px-5 py-3 text-sm">
        <Tab active={panel === "rename"} onClick={() => setPanel(panel === "rename" ? "none" : "rename")}>
          Rename
        </Tab>
        <Tab
          active={panel === "documents"}
          onClick={() => setPanel(panel === "documents" ? "none" : "documents")}
        >
          Add documents
        </Tab>
        <Tab active={panel === "delete"} onClick={() => setPanel(panel === "delete" ? "none" : "delete")}>
          Delete course
        </Tab>
      </div>

      {panel !== "none" && (
        <div className="border-t border-rule px-5 py-5">
          {panel === "rename" && (
            <RenamePanel courseId={courseId} title={title} onDone={() => setPanel("none")} />
          )}
          {panel === "documents" && (
            <AddDocumentsPanel
              courseId={courseId}
              documentCount={documentCount}
              onDone={() => setPanel("none")}
            />
          )}
          {panel === "delete" && (
            <DeletePanel courseId={courseId} onCancel={() => setPanel("none")} router={router} />
          )}
        </div>
      )}
    </div>
  );
}

function Tab({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={active ? "font-medium text-ink" : "text-ink-soft hover:text-ink"}
    >
      {children}
    </button>
  );
}

function RenamePanel({
  courseId,
  title,
  onDone,
}: {
  courseId: string;
  title: string;
  onDone: () => void;
}) {
  const router = useRouter();
  const [value, setValue] = useState(title);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function save() {
    setBusy(true);
    setError(null);
    const response = await fetch(`/api/courses/${courseId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: value }),
    });
    const result = await response.json();
    if (!response.ok) {
      setError(result.error ?? "Could not rename it.");
      setBusy(false);
      return;
    }
    onDone();
    router.refresh();
  }

  return (
    <div>
      <label className="block">
        <span className="text-sm font-medium text-ink">Course name</span>
        <input
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          className="mt-1.5 w-full max-w-md rounded-2xl border border-rule bg-paper px-3 py-2.5 text-[0.95rem] text-ink outline-none focus:border-ink"
        />
      </label>
      {error && <p className="mt-3 text-sm text-ink-soft">{error}</p>}
      <button
        type="button"
        onClick={save}
        disabled={busy || !value.trim()}
        className="mt-4 rounded-full bg-ink px-4 py-2 text-sm font-medium text-paper hover:opacity-90 disabled:opacity-50"
      >
        {busy ? "Saving" : "Save name"}
      </button>
    </div>
  );
}

function AddDocumentsPanel({
  courseId,
  documentCount,
  onDone,
}: {
  courseId: string;
  documentCount: number;
  onDone: () => void;
}) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [files, setFiles] = useState<File[]>([]);
  const [stage, setStage] = useState<"idle" | "reading" | "structuring">("idle");
  const [error, setError] = useState<string | null>(null);

  async function upload() {
    if (files.length === 0) return;
    setError(null);
    setStage("reading");

    try {
      const form = new FormData();
      for (const file of files) form.append("files", file);

      const response = await fetch(`/api/courses/${courseId}/documents`, {
        method: "POST",
        body: form,
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error ?? "Upload failed.");

      // New material changes what the topics should be, so the structure is rebuilt.
      // The outline route carries cards across for topics that keep their title.
      setStage("structuring");
      const outline = await fetch(`/api/courses/${courseId}/outline`, { method: "POST" });
      const outlineResult = await outline.json();
      if (!outline.ok) throw new Error(outlineResult.error ?? "Structuring failed.");

      setFiles([]);
      setStage("idle");
      onDone();
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
      setStage("idle");
    }
  }

  if (stage !== "idle") {
    return (
      <div className="flex items-center gap-3">
        <span className="h-2 w-2 animate-pulse rounded-full bg-ink" />
        <p className="text-[0.95rem] text-ink">
          {stage === "reading"
            ? "Reading the new documents"
            : "Rebuilding the structure around the new material"}
        </p>
      </div>
    );
  }

  return (
    <div>
      <p className="max-w-[60ch] text-[0.95rem] leading-relaxed text-ink-soft">
        Adding material rebuilds the course structure so the new topics slot into the right
        modules. Topics that keep their name keep their cards and your progress on them; any
        topic the new structure renames or drops needs its cards written again.
      </p>

      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        className="mt-4 rounded-full border border-ink px-4 py-2 text-sm font-medium text-ink hover:bg-paper"
      >
        Choose files
      </button>
      <input
        ref={inputRef}
        type="file"
        multiple
        accept={ACCEPTED_FILE_TYPES}
        onChange={(e) => setFiles(Array.from(e.target.files ?? []))}
        className="hidden"
      />

      {files.length > 0 && (
        <ul className="mt-4 space-y-1 text-[0.9rem] text-ink">
          {files.map((file) => (
            <li key={file.name}>{file.name}</li>
          ))}
        </ul>
      )}

      {error && <p className="mt-3 text-sm text-ink-soft">{error}</p>}

      <button
        type="button"
        onClick={upload}
        disabled={files.length === 0}
        className="mt-4 block rounded-full bg-ink px-4 py-2 text-sm font-medium text-paper hover:opacity-90 disabled:opacity-40"
      >
        Add {files.length || ""} {files.length === 1 ? "document" : "documents"}
      </button>

      <p className="mt-3 text-sm text-ink-faint">
        This course has {documentCount} of 12 documents.
      </p>
    </div>
  );
}

function DeletePanel({
  courseId,
  onCancel,
  router,
}: {
  courseId: string;
  onCancel: () => void;
  router: ReturnType<typeof useRouter>;
}) {
  const [busy, setBusy] = useState(false);

  async function remove() {
    setBusy(true);
    await fetch(`/api/courses/${courseId}`, { method: "DELETE" });
    router.push("/dashboard");
    router.refresh();
  }

  return (
    <div>
      <p className="max-w-[60ch] text-[0.95rem] leading-relaxed text-ink-soft">
        This removes the course, every card in it, your review history, and the uploaded files.
        It cannot be undone.
      </p>
      <div className="mt-4 flex gap-2.5">
        <button
          type="button"
          onClick={remove}
          disabled={busy}
          className="rounded-full bg-ink px-4 py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50"
        >
          {busy ? "Deleting" : "Delete this course"}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="rounded-full border border-rule px-4 py-2 text-sm text-ink hover:border-ink"
        >
          Keep it
        </button>
      </div>
    </div>
  );
}
