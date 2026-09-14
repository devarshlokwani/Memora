import { describe, expect, it } from "vitest";

import { INITIAL_STATE, formatInterval, gradeFromCorrectness, schedule } from "./srs";

const daysUntil = (iso: string) => (new Date(iso).getTime() - Date.now()) / 86_400_000;

describe("schedule", () => {
  it("introduces a new card at one day when it is answered correctly", () => {
    const next = schedule(INITIAL_STATE, 2);
    expect(next.repetitions).toBe(1);
    expect(daysUntil(next.due_at)).toBeGreaterThan(0.9);
    expect(daysUntil(next.due_at)).toBeLessThan(1.1);
  });

  it("sends a failed card back within the hour and counts a lapse", () => {
    const state = { ease: 2.5, interval_days: 30, repetitions: 5, lapses: 1 };
    const next = schedule(state, 0);

    expect(next.repetitions).toBe(0);
    expect(next.interval_days).toBe(0);
    expect(next.lapses).toBe(2);
    expect(daysUntil(next.due_at)).toBeLessThan(1 / 24);
  });

  it("grows the interval by the ease factor once a card is established", () => {
    const state = { ease: 2.5, interval_days: 10, repetitions: 3, lapses: 0 };
    const next = schedule(state, 2);
    // 10 * 2.5 = 25, before the +/-5% fuzz.
    expect(next.interval_days).toBeCloseTo(25, 5);
  });

  it("moves ease down on failure and up on an instant answer", () => {
    expect(schedule(INITIAL_STATE, 0).ease).toBeCloseTo(2.3, 5);
    expect(schedule(INITIAL_STATE, 3).ease).toBeCloseTo(2.65, 5);
  });

  it("never lets ease leave the 1.3 - 3.0 band", () => {
    let state = { ...INITIAL_STATE };
    for (let i = 0; i < 20; i++) state = schedule(state, 0);
    expect(state.ease).toBe(1.3);

    state = { ...INITIAL_STATE };
    for (let i = 0; i < 20; i++) state = schedule(state, 3);
    expect(state.ease).toBe(3);
  });

  it("caps a runaway interval at a year", () => {
    const state = { ease: 3, interval_days: 900, repetitions: 12, lapses: 0 };
    expect(schedule(state, 3).interval_days).toBe(365);
  });

  it("fuzzes the due date so cards learned together drift apart", () => {
    const state = { ease: 2.5, interval_days: 20, repetitions: 4, lapses: 0 };
    const dues = new Set(Array.from({ length: 12 }, () => schedule(state, 2).due_at));
    expect(dues.size).toBeGreaterThan(1);
  });
});

describe("gradeFromCorrectness", () => {
  it("maps objective answers onto pass and fail grades", () => {
    expect(gradeFromCorrectness(true)).toBe(2);
    expect(gradeFromCorrectness(false)).toBe(0);
  });
});

describe("formatInterval", () => {
  it("reads as a student would say it", () => {
    expect(formatInterval(0)).toBe("10m");
    expect(formatInterval(0.5)).toBe("12h");
    expect(formatInterval(3)).toBe("3d");
    expect(formatInterval(60)).toBe("2mo");
    expect(formatInterval(730)).toBe("2.0y");
  });
});
