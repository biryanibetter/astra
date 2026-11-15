import { describe, expect, it } from "vitest";
import { resolveReducedMotion } from "@/lib/motion-policy";

describe("unified motion policy", () => {
  it.each([
    [false, false],
    [true, false], // OS animation effects must not suppress ASTRA motion
  ] as const)(
    "resolveReducedMotion keeps full site motion regardless of OS preference",
    (system, expected) => {
      expect(resolveReducedMotion(system)).toBe(expected);
    },
  );
});
