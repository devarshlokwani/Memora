import { describe, expect, it } from "vitest";

import { MARK_BAND, paperStrokes } from "./sketch";

describe("paperStrokes", () => {
  it("holds every existing mark still when the page gets longer", () => {
    const short = paperStrokes(1440, MARK_BAND * 2);
    const long = paperStrokes(1440, MARK_BAND * 4);

    // The whole point of drawing them a band at a time: a section that changes
    // the length of the page must not slide the marks already on it.
    expect(long.slice(0, short.length)).toEqual(short);
    expect(long.length).toBeGreaterThan(short.length);
  });

  it("does not repeat itself down a long page", () => {
    const strokes = paperStrokes(1440, MARK_BAND * 6);
    const shapes = strokes.map((stroke) => stroke.d);
    expect(new Set(shapes).size).toBe(shapes.length);
  });

  it("draws the same page the same way twice", () => {
    expect(paperStrokes(1024, 2000)).toEqual(paperStrokes(1024, 2000));
  });

  it("keeps every mark faint enough to stay behind the text", () => {
    for (const stroke of paperStrokes(1440, MARK_BAND * 3)) {
      expect(stroke.opacity).toBeLessThanOrEqual(0.18);
      expect(stroke.opacity).toBeGreaterThan(0);
    }
  });

  it("has nothing to draw before the page has been measured", () => {
    expect(paperStrokes(0, 0)).toEqual([]);
  });
});
