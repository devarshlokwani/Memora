"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { MODE_LABELS, type Card, type CardType } from "@/lib/types";

const TYPE_ORDER: CardType[] = ["flashcard", "mcq", "fill_blank", "match", "jargon"];

const PROMPT_LABEL: Record<CardType, string> = {
  flashcard: "Question",
  mcq: "Question",
  fill_blank: "Sentence, with ___ where the blank goes",
  match: "Instruction",
  jargon: "Term",
};

export function CardManager({ cards: initial }: { cards: Card[] }) {
  const router = useRouter();
  const [cards, setCards] = useState(initial);
  const [editing, setEditing] = useState<string | null>(null);

  async function remove(id: string) {
    setCards((list) => list.filter((c) => c.id !== id));
    await fetch(`/api/cards/${id}`, { method: "DELETE" });
    router.refresh();
  }

  function replace(updated: Card) {
    setCards((list) => list.map((c) => (c.id === updated.id ? updated : c)));
    setEditing(null);
    router.refresh();
  }

  if (cards.length === 0) {
    return (
      <p className="mt-8 sketch sketch-a p-6 text-[0.95rem] text-ink-soft">
        No cards left for this topic. Write them again from the course page.
      </p>
    );
  }

  return (
    <div className="mt-8 space-y-10">
      {TYPE_ORDER.map((type) => {
        const group = cards.filter((c) => c.type === type);
        if (group.length === 0) return null;

        return (
          <section key={type}>
            <div className="flex items-baseline justify-between border-b-2 border-ink pb-2">
              <h2 className="text-[1.05rem] font-semibold text-ink">{MODE_LABELS[type]}</h2>
              <span className="text-sm text-ink-faint">{group.length}</span>
            </div>

            <ul className="divide-y divide-rule">
              {group.map((card) => (
                <li key={card.id} className="py-4">
                  {editing === card.id ? (
                    <CardEditor card={card} onCancel={() => setEditing(null)} onSaved={replace} />
                  ) : (
                    <CardRow
                      card={card}
                      onEdit={() => setEditing(card.id)}
                      onDelete={() => remove(card.id)}
                    />
                  )}
                </li>
              ))}
            </ul>
          </section>
        );
      })}
    </div>
  );
}

function CardRow({
  card,
  onEdit,
  onDelete,
}: {
  card: Card;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const [confirming, setConfirming] = useState(false);

  return (
    <div className="flex flex-wrap items-start justify-between gap-x-6 gap-y-3">
      <div className="min-w-0 flex-1">
        <p className="font-reading text-[1.05rem] leading-snug text-ink">{card.prompt}</p>

        {card.type === "mcq" ? (
          <ul className="mt-2 space-y-1">
            {card.options.map((option, index) => (
              <li
                key={index}
                className={`text-[0.9rem] ${
                  index === card.correct_index ? "text-ink" : "text-ink-soft"
                }`}
              >
                {option}
              </li>
            ))}
          </ul>
        ) : card.type === "match" ? (
          <ul className="mt-2 space-y-1">
            {card.pairs.map((pair, index) => (
              <li key={index} className="text-[0.9rem] text-ink-soft">
                {pair.left} &rarr; {pair.right}
              </li>
            ))}
          </ul>
        ) : (
          card.answer && (
            <p className="mt-1.5 text-[0.9rem] leading-relaxed text-ink-soft">{card.answer}</p>
          )
        )}

        {card.explanation && (
          <p className="mt-1.5 text-[0.85rem] leading-relaxed text-ink-faint">
            {card.explanation}
          </p>
        )}
      </div>

      <div className="flex shrink-0 gap-3 text-sm">
        {card.type !== "match" && (
          <button type="button" onClick={onEdit} className="text-ink-soft hover:text-ink">
            Edit
          </button>
        )}
        {confirming ? (
          <>
            <button type="button" onClick={onDelete} className="font-medium text-ink">
              Delete
            </button>
            <button
              type="button"
              onClick={() => setConfirming(false)}
              className="text-ink-soft hover:text-ink"
            >
              Keep
            </button>
          </>
        ) : (
          <button
            type="button"
            onClick={() => setConfirming(true)}
            className="text-ink-soft hover:text-ink"
          >
            Remove
          </button>
        )}
      </div>
    </div>
  );
}

function CardEditor({
  card,
  onCancel,
  onSaved,
}: {
  card: Card;
  onCancel: () => void;
  onSaved: (card: Card) => void;
}) {
  const [prompt, setPrompt] = useState(card.prompt);
  const [answer, setAnswer] = useState(card.answer);
  const [explanation, setExplanation] = useState(card.explanation);
  const [options, setOptions] = useState(card.options);
  const [correctIndex, setCorrectIndex] = useState(card.correct_index ?? 0);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const isMcq = card.type === "mcq";

  async function save() {
    setBusy(true);
    setError(null);

    const body = isMcq
      ? { prompt, options, correct_index: correctIndex, explanation }
      : { prompt, answer, options };

    const response = await fetch(`/api/cards/${card.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const result = await response.json();

    if (!response.ok) {
      setError(result.error ?? "Could not save that.");
      setBusy(false);
      return;
    }

    onSaved({
      ...card,
      prompt,
      explanation,
      options,
      answer: isMcq ? options[correctIndex] : answer,
      correct_index: isMcq ? correctIndex : card.correct_index,
    });
  }

  return (
    <div className="rounded-full border border-ink bg-paper p-4">
      <label className="block">
        <span className="text-sm font-medium text-ink">{PROMPT_LABEL[card.type]}</span>
        <textarea
          value={prompt}
          rows={2}
          onChange={(e) => setPrompt(e.target.value)}
          className="mt-1.5 w-full resize-none rounded-2xl border border-rule bg-card px-3 py-2 text-[0.95rem] text-ink outline-none focus:border-ink"
        />
      </label>

      {isMcq ? (
        <fieldset className="mt-4">
          <legend className="text-sm font-medium text-ink">
            Options &mdash; select the right one
          </legend>
          <div className="mt-1.5 space-y-2">
            {options.map((option, index) => (
              <div key={index} className="flex items-center gap-2.5">
                <input
                  type="radio"
                  name={`correct-${card.id}`}
                  checked={index === correctIndex}
                  onChange={() => setCorrectIndex(index)}
                />
                <input
                  type="text"
                  value={option}
                  onChange={(e) =>
                    setOptions(options.map((o, i) => (i === index ? e.target.value : o)))
                  }
                  className="w-full rounded-2xl border border-rule bg-card px-3 py-2 text-[0.9rem] text-ink outline-none focus:border-ink"
                />
              </div>
            ))}
          </div>
        </fieldset>
      ) : (
        <label className="mt-4 block">
          <span className="text-sm font-medium text-ink">
            {card.type === "jargon" ? "Definition" : "Answer"}
          </span>
          <textarea
            value={answer}
            rows={2}
            onChange={(e) => setAnswer(e.target.value)}
            className="mt-1.5 w-full resize-none rounded-2xl border border-rule bg-card px-3 py-2 text-[0.95rem] text-ink outline-none focus:border-ink"
          />
        </label>
      )}

      {card.type === "fill_blank" && (
        <label className="mt-4 block">
          <span className="text-sm font-medium text-ink">Also accept (comma separated)</span>
          <input
            type="text"
            value={options.join(", ")}
            onChange={(e) =>
              setOptions(
                e.target.value
                  .split(",")
                  .map((o) => o.trim())
                  .filter(Boolean),
              )
            }
            className="mt-1.5 w-full rounded-2xl border border-rule bg-card px-3 py-2 text-[0.9rem] text-ink outline-none focus:border-ink"
          />
        </label>
      )}

      {isMcq && (
        <label className="mt-4 block">
          <span className="text-sm font-medium text-ink">Explanation</span>
          <textarea
            value={explanation}
            rows={2}
            onChange={(e) => setExplanation(e.target.value)}
            className="mt-1.5 w-full resize-none rounded-2xl border border-rule bg-card px-3 py-2 text-[0.9rem] text-ink outline-none focus:border-ink"
          />
        </label>
      )}

      {error && <p className="mt-3 text-sm text-ink-soft">{error}</p>}

      <div className="mt-4 flex gap-2.5">
        <button
          type="button"
          onClick={save}
          disabled={busy}
          className="rounded-full bg-ink px-4 py-2 text-sm font-medium text-paper hover:opacity-90 disabled:opacity-50"
        >
          {busy ? "Saving" : "Save card"}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="rounded-full border border-rule px-4 py-2 text-sm text-ink hover:border-ink"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
