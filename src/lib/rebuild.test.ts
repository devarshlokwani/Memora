import { describe, expect, it } from "vitest";

import { cardKey, planCardRestore, planProgressRestore, titleKey } from "./rebuild";
import type { Card, CardProgress } from "./types";

const card = (id: string, topicId: string, prompt: string): Card => ({
  id,
  course_id: "course",
  topic_id: topicId,
  type: "flashcard",
  prompt,
  answer: `answer for ${prompt}`,
  options: [],
  correct_index: null,
  pairs: [],
  explanation: "",
  difficulty: 2,
});

const plan = (args: {
  oldTopics: { id: string; title: string }[];
  cards: Card[];
  newTopics: { id: string; title: string }[];
}) => {
  const cardsByTopic = new Map<string, Card[]>();
  for (const c of args.cards) {
    cardsByTopic.set(c.topic_id, [...(cardsByTopic.get(c.topic_id) ?? []), c]);
  }
  return planCardRestore({
    userId: "u",
    courseId: "course",
    oldTopics: args.oldTopics,
    cardsByTopic,
    newTopics: args.newTopics,
  });
};

describe("titleKey", () => {
  it("matches titles that differ only in case or spacing", () => {
    expect(titleKey("  Membrane   Transport ")).toBe(titleKey("membrane transport"));
  });

  it("does not match genuinely different titles", () => {
    expect(titleKey("Membrane transport")).not.toBe(titleKey("Membrane potential"));
  });
});

describe("planCardRestore", () => {
  it("moves the cards of a surviving topic onto its new id", () => {
    const { rows } = plan({
      oldTopics: [{ id: "old1", title: "Membrane transport" }],
      cards: [card("c1", "old1", "Why ATP?"), card("c2", "old1", "How many ions?")],
      newTopics: [{ id: "new1", title: "membrane  transport" }],
    });

    expect(rows).toHaveLength(2);
    expect(rows.every((r) => r.topic_id === "new1")).toBe(true);
    expect(rows.map((r) => r.prompt)).toEqual(["Why ATP?", "How many ions?"]);
  });

  it("drops the cards of a topic the new structure no longer has", () => {
    const { rows } = plan({
      oldTopics: [{ id: "old1", title: "Removed topic" }],
      cards: [card("c1", "old1", "Why ATP?")],
      newTopics: [{ id: "new1", title: "Something else entirely" }],
    });

    expect(rows).toHaveLength(0);
  });

  it("keeps only the topics that survive, and rewrites the rest", () => {
    const { rows } = plan({
      oldTopics: [
        { id: "old1", title: "Kept" },
        { id: "old2", title: "Dropped" },
      ],
      cards: [card("c1", "old1", "kept card"), card("c2", "old2", "lost card")],
      newTopics: [
        { id: "new1", title: "Kept" },
        { id: "new2", title: "Brand new" },
      ],
    });

    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({ topic_id: "new1", prompt: "kept card" });
  });

  it("never lets two new topics claim the same old cards", () => {
    const { rows } = plan({
      oldTopics: [{ id: "old1", title: "Osmosis" }],
      cards: [card("c1", "old1", "What is osmosis?")],
      newTopics: [
        { id: "new1", title: "Osmosis" },
        { id: "new2", title: "osmosis" },
      ],
    });

    expect(rows).toHaveLength(1);
    expect(rows[0].topic_id).toBe("new1");
  });

  it("stamps the restored rows with the current owner", () => {
    const { rows } = plan({
      oldTopics: [{ id: "old1", title: "T" }],
      cards: [card("c1", "old1", "p")],
      newTopics: [{ id: "new1", title: "T" }],
    });

    expect(rows[0]).toMatchObject({ user_id: "u", course_id: "course" });
    expect(rows[0]).not.toHaveProperty("id");
  });

  it("does nothing on a first run, when there is nothing to keep", () => {
    const { rows, oldCardByKey } = plan({
      oldTopics: [],
      cards: [],
      newTopics: [{ id: "new1", title: "Anything" }],
    });

    expect(rows).toHaveLength(0);
    expect(oldCardByKey.size).toBe(0);
  });
});

describe("planProgressRestore", () => {
  const progress = (cardId: string): CardProgress => ({
    card_id: cardId,
    ease: 2.1,
    interval_days: 12,
    repetitions: 4,
    lapses: 1,
    due_at: "2030-01-01T00:00:00.000Z",
    total_reviews: 9,
    correct_reviews: 7,
  });

  it("carries the schedule from the old card onto its replacement", () => {
    const oldCardByKey = new Map([[cardKey("new1", "flashcard", "Why ATP?"), "c1"]]);

    const rows = planProgressRestore({
      userId: "u",
      courseId: "course",
      inserted: [{ id: "fresh1", topic_id: "new1", type: "flashcard", prompt: "Why ATP?" }],
      oldCardByKey,
      progressByCard: new Map([["c1", progress("c1")]]),
    });

    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({
      card_id: "fresh1",
      ease: 2.1,
      interval_days: 12,
      repetitions: 4,
      due_at: "2030-01-01T00:00:00.000Z",
    });
  });

  it("leaves a never-studied card unscheduled rather than inventing history", () => {
    const rows = planProgressRestore({
      userId: "u",
      courseId: "course",
      inserted: [{ id: "fresh1", topic_id: "new1", type: "flashcard", prompt: "Unseen" }],
      oldCardByKey: new Map(),
      progressByCard: new Map(),
    });

    expect(rows).toHaveLength(0);
  });

  it("does not confuse two cards that share a prompt across topics", () => {
    const oldCardByKey = new Map([
      [cardKey("newA", "flashcard", "Same question"), "cA"],
      [cardKey("newB", "flashcard", "Same question"), "cB"],
    ]);

    const rows = planProgressRestore({
      userId: "u",
      courseId: "course",
      inserted: [
        { id: "freshA", topic_id: "newA", type: "flashcard", prompt: "Same question" },
        { id: "freshB", topic_id: "newB", type: "flashcard", prompt: "Same question" },
      ],
      oldCardByKey,
      progressByCard: new Map([
        ["cA", { ...progress("cA"), repetitions: 1 }],
        ["cB", { ...progress("cB"), repetitions: 8 }],
      ]),
    });

    expect(rows.find((r) => r.card_id === "freshA")?.repetitions).toBe(1);
    expect(rows.find((r) => r.card_id === "freshB")?.repetitions).toBe(8);
  });
});
