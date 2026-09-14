import { describe, expect, it } from "vitest";

import { brainstemRing, cerebellumPoint, cerebrumPoint, type Vec3 } from "./brain";

const unit = (v: number[]): Vec3 => {
  const length = Math.hypot(v[0], v[1], v[2]);
  return [v[0] / length, v[1] / length, v[2] / length];
};
const radius = (direction: Vec3) => {
  const [x, y, z] = cerebrumPoint(...direction);
  return Math.hypot(x, y, z);
};

describe("cerebrumPoint", () => {
  it("has folds deep enough to see", () => {
    /* The relief is the whole point and it is easy to lose: ridged noise sits
       around 0.8 rather than 0.5, so a fold term built from it without being
       stretched first comes out as a near-constant bulge with a couple of per
       cent of variation, and the brain renders as a smooth pebble. Sampled away
       from the midline and the underside, where the fissure and the flattening
       would account for the difference instead. */
    const relief: number[] = [];
    for (let i = 0; i < 4000; i++) {
      const u = (i * 2.399963) % (Math.PI * 2);
      const v = Math.acos(((i * 0.618034) % 1) * 2 - 1);
      const here = unit([Math.sin(v) * Math.cos(u), Math.cos(v), Math.sin(v) * Math.sin(u)]);
      if (Math.abs(here[0]) < 0.35 || here[1] < 0.1) continue;

      // About half a fold away, so the difference is a gyrus against a sulcus.
      const there = unit([here[0] + 0.07, here[1] + 0.04, here[2] - 0.05]);
      relief.push(Math.abs(radius(here) - radius(there)) / radius(here));
    }

    relief.sort((a, b) => a - b);
    const median = relief[Math.floor(relief.length / 2)];
    const high = relief[Math.floor(relief.length * 0.9)];

    expect(relief.length).toBeGreaterThan(500);
    expect(median).toBeGreaterThan(0.02);
    expect(high).toBeGreaterThan(0.06);
  });

  it("is split down the middle by the fissure", () => {
    const midline = cerebrumPoint(0, 1, 0)[1];
    const beside = cerebrumPoint(...unit([0.4, 1, 0]))[1];
    expect(beside - midline).toBeGreaterThan(0.06);
  });

  it("is longer than it is wide or tall", () => {
    const front = cerebrumPoint(0, 0, 1)[2];
    const side = cerebrumPoint(1, 0, 0)[0];
    const top = cerebrumPoint(0, 1, 0)[1];
    expect(front).toBeGreaterThan(side);
    expect(front).toBeGreaterThan(top);
  });

  it("sits flat underneath rather than coming to a point", () => {
    const bottom = Math.abs(cerebrumPoint(0, -1, 0)[1]);
    const top = cerebrumPoint(0, 1, 0)[1];
    // The fissure takes a bite out of the top, so compare against the side.
    expect(bottom).toBeLessThan(Math.abs(cerebrumPoint(1, 0, 0)[0]));
    expect(top).toBeGreaterThan(0);
  });

  it("draws the same brain every time", () => {
    expect(cerebrumPoint(0.3, 0.5, -0.8)).toEqual(cerebrumPoint(0.3, 0.5, -0.8));
  });
});

describe("the parts underneath", () => {
  it("tucks the cerebellum below and behind", () => {
    const [x, y, z] = cerebellumPoint(0, 0, 0);
    expect(Math.abs(x)).toBeLessThan(0.05);
    expect(y).toBeLessThan(-0.25);
    expect(z).toBeLessThan(-0.4);
  });

  it("runs the brainstem downwards and forwards", () => {
    const top = brainstemRing(0, 0);
    const bottom = brainstemRing(1, 0);
    expect(bottom[1]).toBeLessThan(top[1]);
    expect(bottom[2]).toBeGreaterThan(top[2]);
    // And tapers on the way.
    expect(Math.abs(bottom[0])).toBeLessThan(Math.abs(top[0]));
  });
});
