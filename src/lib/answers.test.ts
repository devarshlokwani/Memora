import { describe, expect, it } from "vitest";

import { matchesAnswer, normalize, shuffle } from "./answers";

describe("normalize", () => {
  it("ignores case, accents, punctuation and spacing", () => {
    expect(normalize("  Réd-Blood   Cell!  ")).toBe("red blood cell");
    expect(normalize("ATP/ADP")).toBe("atp adp");
  });
});

describe("matchesAnswer", () => {
  it("accepts the answer however the student punctuates it", () => {
    expect(matchesAnswer("electrogenic", "Electrogenic")).toBe(true);
    expect(matchesAnswer("  sodium-potassium  ", "sodium potassium")).toBe(true);
  });

  it("accepts any of the listed alternatives", () => {
    expect(matchesAnswer("Na+/K+ ATPase", "sodium potassium pump", ["Na+/K+ ATPase"])).toBe(true);
  });

  it("rejects a wrong answer and refuses to pass a blank one", () => {
    expect(matchesAnswer("mitochondria", "ribosome")).toBe(false);
    expect(matchesAnswer("   ", "")).toBe(false);
    expect(matchesAnswer("", "anything")).toBe(false);
  });

  it("does not accept a partial answer", () => {
    expect(matchesAnswer("sodium", "sodium potassium pump")).toBe(false);
  });
});

describe("shuffle", () => {
  it("keeps every item and leaves the input untouched", () => {
    const input = [1, 2, 3, 4, 5];
    const out = shuffle(input);
    expect(out).toHaveLength(5);
    expect([...out].sort()).toEqual(input);
    expect(input).toEqual([1, 2, 3, 4, 5]);
  });
});
