import { act, createElement } from "react";
import { createRoot } from "react-dom/client";
import { describe, expect, it, vi } from "vitest";
import {
  initialProgramsStageState,
  isLastChapterDisplayCommitted,
  isProgramsBoundary,
  isProgramsCompositionCentered,
  normalizeWheelDelta,
  programsUsableCenter,
  shouldHandleProgramsStageKey,
  shouldReleaseProgramsWheelBoundary,
  stateAfterFocusExit,
  useProgramsStageController,
} from "../src/components/programs/use-programs-stage-controller";

describe("bounded Programs stage controller", () => {
  it("starts free and only recognizes the centered composition within tolerance", () => {
    expect(initialProgramsStageState).toBe("FREE_BEFORE");
    expect(isProgramsCompositionCentered(0)).toBe(true);
    expect(isProgramsCompositionCentered(6)).toBe(true);
    expect(isProgramsCompositionCentered(6.1)).toBe(false);
    expect(isProgramsCompositionCentered(-7)).toBe(false);
  });

  it("centers against both shared viewport clearances", () => {
    expect(programsUsableCenter(800, 150, 32)).toBe(459);
    expect(programsUsableCenter(800, 150)).toBe(459);
  });

  it("normalizes wheel units consistently", () => {
    expect(normalizeWheelDelta(2, 0, 800)).toBe(2);
    expect(normalizeWheelDelta(2, 1, 800)).toBe(32);
    expect(normalizeWheelDelta(2, 2, 800)).toBe(1600);
  });

  it("only releases native input at a ready boundary", () => {
    expect(isProgramsBoundary(-1, 0, 4, false)).toBe(true);
    expect(isProgramsBoundary(1, 3, 4, false)).toBe(false);
    expect(isProgramsBoundary(1, 3, 4, true)).toBe(true);
    expect(isProgramsBoundary(1, 2, 4, true)).toBe(false);
    expect(shouldReleaseProgramsWheelBoundary(true, 1, 2, 4, true)).toBe(false);
    expect(shouldReleaseProgramsWheelBoundary(true, -1, 0, 4, true)).toBe(
      false,
    );
    expect(shouldReleaseProgramsWheelBoundary(false, 1, 3, 4, true)).toBe(true);
  });

  it("allows keyboard chapter control only when the caller has centered control", () => {
    const timelineButton = {
      editableOrModal: false,
      focusableOutsideStage: false,
      focusableInsideStage: true,
    };
    expect(shouldHandleProgramsStageKey("ArrowDown", timelineButton)).toBe(
      true,
    );
    expect(shouldHandleProgramsStageKey(" ", timelineButton)).toBe(false);
    expect(shouldHandleProgramsStageKey("Enter", timelineButton)).toBe(false);
    expect(
      shouldHandleProgramsStageKey("Escape", {
        ...timelineButton,
        focusableOutsideStage: true,
      }),
    ).toBe(true);
  });

  it("supports directional focus escape and readiness-gated final release", () => {
    expect(stateAfterFocusExit(-1)).toBe("FREE_BEFORE");
    expect(stateAfterFocusExit(1)).toBe("FREE_AFTER");
    expect(isLastChapterDisplayCommitted(2, true, false)).toBe(false);
    expect(isLastChapterDisplayCommitted(3, false, false)).toBe(false);
    expect(isLastChapterDisplayCommitted(3, true, true)).toBe(false);
    expect(isLastChapterDisplayCommitted(3, true, false, true)).toBe(false);
    expect(isLastChapterDisplayCommitted(3, true, false)).toBe(true);
  });
});

it("measures the composition once for a small wheel approach without consuming native input", async () => {
  function Stage() {
    const { stageRef } = useProgramsStageController(4);
    return createElement(
      "section",
      { ref: stageRef },
      createElement("div", { "data-programs-composition": "" }),
    );
  }

  vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
  const host = document.createElement("div");
  document.body.append(host);
  const root = createRoot(host);
  try {
    await act(async () => root.render(createElement(Stage)));
    const composition = host.querySelector("[data-programs-composition]");
    if (!composition) throw new Error("Missing test composition");
    const measure = vi
      .spyOn(composition, "getBoundingClientRect")
      .mockReturnValue(new DOMRect(0, 600, 700, 420));
    const event = new WheelEvent("wheel", {
      bubbles: true,
      cancelable: true,
      deltaY: 20,
    });
    host.dispatchEvent(event);
    expect(event.defaultPrevented).toBe(false);
    expect(measure).toHaveBeenCalledTimes(1);
  } finally {
    await act(async () => root.unmount());
    host.remove();
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  }
});
