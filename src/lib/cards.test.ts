import { describe, expect, it } from "vitest";

import type { GeneratedCards } from "./ai-schema";
import { buildCardRows } from "./cards";

const owner = { user_id: "u", course_id: "c", topic_id: "t" };

const empty: GeneratedCards = {
  flashcards: [],
  mcqs: [],
  fill_blanks: [],
  match_sets: [],
  jargon: [],
};

const build = (partial: Partial<GeneratedCards>) =>
  buildCardRows({ ...empty, ...partial }, owner);

describe("flashcards", () => {
  it("keeps a well-formed card and stamps it with the owner", () => {
    const rows = build({
      flashcards: [{ front: "  Why? ", back: " Because. ", difficulty: 2 }],
    });
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({
      ...owner,
      type: "flashcard",
      prompt: "Why?",
      answer: "Because.",
    });
  });

  it("drops a card with an empty side", () => {
    expect(
      build({
        flashcards: [
          { front: "Question", back: "   ", difficulty: 2 },
          { front: "", back: "Answer", difficulty: 2 },
        ],
      }),
    ).toHaveLength(0);
  });
});

describe("mcqs", () => {
  const good = {
    question: "How many?",
    options: ["one", "two", "three", "four"],
    correct_index: 1,
    explanation: "Because two.",
    difficulty: 2,
  };

  it("stores the keyed option as the answer", () => {
    const rows = build({ mcqs: [good] });
    expect(rows[0]).toMatchObject({ type: "mcq", answer: "two", correct_index: 1 });
  });

  it("drops a question whose key points outside its own options", () => {
    expect(build({ mcqs: [{ ...good, correct_index: 9 }] })).toHaveLength(0);
    expect(build({ mcqs: [{ ...good, correct_index: -1 }] })).toHaveLength(0);
  });

  it("drops a question with duplicate options, which has two right answers", () => {
    expect(
      build({ mcqs: [{ ...good, options: ["one", "One", "three", "four"] }] }),
    ).toHaveLength(0);
  });

  it("drops a question that is not actually a choice", () => {
    expect(build({ mcqs: [{ ...good, options: ["only"], correct_index: 0 }] })).toHaveLength(0);
  });

  it("drops a question with a blank option, since the index would shift", () => {
    expect(
      build({ mcqs: [{ ...good, options: ["one", "  ", "three", "four"] }] }),
    ).toHaveLength(0);
  });
});

describe("fill_blanks", () => {
  it("keeps a sentence with exactly one blank and trims the alternatives", () => {
    const rows = build({
      fill_blanks: [
        { sentence: "It is ___ transport.", answer: " active ", accepted: [" primary "], difficulty: 1 },
      ],
    });
    expect(rows[0]).toMatchObject({
      type: "fill_blank",
      answer: "active",
      options: ["primary"],
    });
  });

  it("drops a sentence with no blank in it", () => {
    expect(
      build({ fill_blanks: [{ sentence: "No blank here.", answer: "x", accepted: [], difficulty: 1 }] }),
    ).toHaveLength(0);
  });

  it("drops a sentence with two blanks, which is ambiguous to answer", () => {
    expect(
      build({
        fill_blanks: [{ sentence: "___ and ___ differ.", answer: "x", accepted: [], difficulty: 1 }],
      }),
    ).toHaveLength(0);
  });
});

describe("match_sets", () => {
  const pairs = [
    { left: "a", right: "1" },
    { left: "b", right: "2" },
    { left: "c", right: "3" },
  ];

  it("keeps a coherent set", () => {
    const rows = build({ match_sets: [{ instruction: "Match them.", pairs }] });
    expect(rows[0]).toMatchObject({ type: "match", prompt: "Match them." });
    expect(rows[0].pairs).toHaveLength(3);
  });

  it("supplies an instruction when the model leaves it blank", () => {
    const rows = build({ match_sets: [{ instruction: "", pairs }] });
    expect(rows[0].prompt).toBe("Match each item to its partner.");
  });

  it("drops a set with a duplicated right-hand item, which is unsolvable", () => {
    expect(
      build({
        match_sets: [
          { instruction: "", pairs: [...pairs, { left: "d", right: "1" }] },
        ],
      }),
    ).toHaveLength(0);
  });

  it("drops a set too small to be worth pairing", () => {
    expect(
      build({ match_sets: [{ instruction: "", pairs: pairs.slice(0, 2) }] }),
    ).toHaveLength(0);
  });
});

describe("jargon", () => {
  it("keeps a term with a definition and drops one without", () => {
    const rows = build({
      jargon: [
        { term: "Osmosis", definition: "Water movement.", difficulty: 1 },
        { term: "Empty", definition: "  ", difficulty: 1 },
      ],
    });
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({ type: "jargon", prompt: "Osmosis" });
  });
});

describe("difficulty", () => {
  it("clamps whatever the model returns into the 1-3 the schema allows", () => {
    const rows = build({
      flashcards: [
        { front: "a", back: "a", difficulty: 99 },
        { front: "b", back: "b", difficulty: -4 },
        { front: "c", back: "c", difficulty: 0 },
      ],
    });
    expect(rows.map((r) => r.difficulty)).toEqual([3, 1, 2]);
  });
});
