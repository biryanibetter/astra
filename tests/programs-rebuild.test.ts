import { describe, expect, it } from "vitest";
import {
  accumulateProgramsWheelGesture,
  normalizeWheelDelta,
} from "../src/components/programs/use-programs-stage-controller";

describe("Programs bounded-scroll regressions", () => {
  it("accumulates a centered physical wheel gesture into at most one chapter advance", () => {
    let accumulated = 0;
    let advances = 0;
    for (const delta of [4, 8, 16, 28, 42, 35, 24, 18, 12, 7, 4, 2, 1]) {
      if (advances > 0) continue;
      const result = accumulateProgramsWheelGesture(accumulated, delta);
      accumulated = result.amount;
      if (result.direction) advances++;
    }
    expect(advances).toBe(1);
  });

  it("normalizes line and page units before gesture thresholding", () => {
    expect(normalizeWheelDelta(3, 1, 900)).toBe(48);
    expect(normalizeWheelDelta(1, 2, 900)).toBe(900);
    expect(
      accumulateProgramsWheelGesture(0, normalizeWheelDelta(3, 1, 900)),
    ).toMatchObject({ direction: 1 });
  });
});
