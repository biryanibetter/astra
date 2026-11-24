"use client";

import type Lenis from "lenis";
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";

const getLenis = () => (window as Window & { __LENIS__?: Lenis }).__LENIS__;

export type ProgramsStageState =
  | "FREE_BEFORE"
  | "CENTERING_FROM_ABOVE"
  | "LOCKED"
  | "CENTERING_FROM_BELOW"
  | "FREE_AFTER";

export const initialProgramsStageState: ProgramsStageState = "FREE_BEFORE";
export type ProgramsBoundaryState =
  | "NONE"
  | "FIRST_READY"
  | "FINAL_HOLD"
  | "FINAL_READY";
export const PROGRAMS_CENTER_TOLERANCE = 6;

export const isProgramsCompositionCentered = (
  centerError: number,
  tolerance = PROGRAMS_CENTER_TOLERANCE,
) => Math.abs(centerError) <= tolerance;
export const programsUsableCenter = (
  viewportHeight: number,
  topClearance: number,
  bottomClearance = 32,
) => (topClearance + viewportHeight - bottomClearance) / 2;
export const isProgramsBoundary = (
  direction: -1 | 1,
  chapterIndex: number,
  total: number,
  canReleaseAfterLast: boolean,
) =>
  (direction < 0 && chapterIndex === 0) ||
  (direction > 0 &&
    chapterIndex >= Math.min(4, total) - 1 &&
    canReleaseAfterLast);
export const shouldReleaseProgramsWheelBoundary = (
  gestureSpent: boolean,
  direction: -1 | 1,
  chapterIndex: number,
  total: number,
  canReleaseAfterLast: boolean,
) =>
  !gestureSpent &&
  isProgramsBoundary(direction, chapterIndex, total, canReleaseAfterLast);

export function normalizeWheelDelta(
  deltaY: number,
  deltaMode: number,
  viewportHeight: number,
) {
  if (deltaMode === 1) return deltaY * 16;
  if (deltaMode === 2) return deltaY * viewportHeight;
  return deltaY;
}

export function accumulateProgramsWheelGesture(
  accumulated: number,
  delta: number,
  threshold = 48,
) {
  const nextAmount = accumulated + delta;
  if (Math.abs(nextAmount) < threshold)
    return { amount: nextAmount, direction: 0 as const };
  return { amount: 0, direction: (nextAmount > 0 ? 1 : -1) as -1 | 1 };
}

export type ProgramsStageKeyboardContext = {
  editableOrModal: boolean;
  focusableOutsideStage: boolean;
  focusableInsideStage: boolean;
};

export function shouldHandleProgramsStageKey(
  key: string,
  context: ProgramsStageKeyboardContext,
) {
  if (context.editableOrModal) return false;
  if (key === "Escape") return true;
  if (context.focusableOutsideStage) return false;
  if (["ArrowDown", "ArrowUp", "PageDown", "PageUp"].includes(key)) return true;
  return key === " " && !context.focusableInsideStage;
}

export function stateAfterFocusExit(direction: -1 | 1): ProgramsStageState {
  return direction < 0 ? "FREE_BEFORE" : "FREE_AFTER";
}

export function isLastChapterDisplayCommitted(
  displayedIndex: number,
  imageReady: boolean,
  transitioning: boolean,
  revealing = false,
) {
  return displayedIndex === 3 && imageReady && !transitioning && !revealing;
}

const editable = (target: EventTarget | null) =>
  target instanceof Element &&
  Boolean(
    target.closest(
      'input, textarea, select, [contenteditable="true"], [role="dialog"]',
    ),
  );
const chapterCount = 4;
const GESTURE_COOLDOWN_MS = 100;

/**
 * The sticky CSS plateau makes the composition center reachable with native
 * scrolling in either direction. We only take ownership once it is actually
 * centered; all entry travel remains native.
 */
export function useProgramsStageController(
  total: number,
  canReleaseAfterLast = true,
) {
  const stageRef = useRef<HTMLElement | null>(null);
  const [state, setState] = useState<ProgramsStageState>(
    initialProgramsStageState,
  );
  const [activeIndex, setActiveIndex] = useState(0);
  const stateRef = useRef(state);
  const chapterRef = useRef(0);
  const [boundary, setBoundary] = useState<ProgramsBoundaryState>("NONE");
  const releaseReady = useRef(false);
  const gesture = useRef({
    amount: 0,
    direction: 0 as -1 | 0 | 1,
    spent: false,
    timer: 0,
  });
  const touchY = useRef<number | null>(null);
  const pendingTab = useRef<-1 | 1 | null>(null);
  const lastScrollY = useRef(0);
  const restoreDocument = useRef<(() => void) | null>(null);
  const prevErrorRef = useRef<number | null>(null);
  const approachDirectionRef = useRef<0 | 1 | -1>(0);

  // Freeze native document movement, not its measured position. Restoring a
  // scroll coordinate on every scroll event caused visible inertia snap-back.
  // Reserve the gutter throughout this route, not at the lock boundary: changing
  // it there changes viewport-unit widths and visibly shifts the composition.
  useLayoutEffect(() => {
    const root = document.documentElement;
    const gutter = root.style.scrollbarGutter;
    root.style.scrollbarGutter = "stable";
    return () => {
      root.style.scrollbarGutter = gutter;
    };
  }, []);

  useLayoutEffect(() => {
    if (state !== "LOCKED") return;
    const root = document.documentElement;
    const overflow = root.style.overflow;
    root.style.overflow = "hidden";
    const restore = () => {
      root.style.overflow = overflow;
    };
    restoreDocument.current = restore;
    // Cancel Lenis inertia when entering LOCKED state
    const lenis = getLenis();
    if (lenis) {
      lenis.scrollTo(lenis.animatedScroll, { immediate: true, force: true });
    }
    return () => {
      restore();
      restoreDocument.current = null;
    };
  }, [state]);

  useEffect(() => {
    if (
      state !== "LOCKED" ||
      activeIndex !== Math.min(chapterCount, total) - 1
    ) {
      releaseReady.current = false;
      setBoundary(
        state === "LOCKED" && activeIndex === 0 ? "FIRST_READY" : "NONE",
      );
      return;
    }
    // At the last chapter. If the chapter is already display-committed (image
    // ready, not transitioning), allow immediate release on the next deliberate
    // scroll. Otherwise, wait for the commit to complete, then allow release.
    if (canReleaseAfterLast) {
      releaseReady.current = true;
      setBoundary("FINAL_READY");
      return;
    }
    setBoundary("FINAL_HOLD");
    // Start the viewing interval AFTER the photograph is committed. A failed
    // image must not trap scrolling: the bounded fallback still permits exit.
    const timer = window.setTimeout(() => {
      releaseReady.current = true;
      setBoundary("FINAL_READY");
    }, 4000);
    return () => window.clearTimeout(timer);
  }, [activeIndex, canReleaseAfterLast, state, total]);

  const update = useCallback((next: ProgramsStageState) => {
    if (next !== "LOCKED") restoreDocument.current?.();
    const wasLocked = stateRef.current === "LOCKED";
    stateRef.current = next;
    setState(next);
    // Reset Lenis when exiting LOCKED state to clear any residual state
    if (wasLocked && next !== "LOCKED") {
      const lenis = getLenis();
      if (lenis) {
        lenis.scrollTo(lenis.animatedScroll, { immediate: true, force: true });
      }
    }
  }, []);
  const composition = useCallback(
    () =>
      stageRef.current?.querySelector<HTMLElement>(
        "[data-programs-composition]",
      ) ?? null,
    [],
  );
  const centerError = useCallback(() => {
    const shell = composition();
    if (!shell) return Number.POSITIVE_INFINITY;
    const style = getComputedStyle(shell);
    const clearance =
      Number.parseFloat(
        style.getPropertyValue("--programs-header-clearance"),
      ) || 0;
    const rect = shell.getBoundingClientRect();
    const configuredBottomClearance = Number.parseFloat(
      style.getPropertyValue("--programs-bottom-clearance"),
    );
    const bottomClearance = Number.isFinite(configuredBottomClearance)
      ? configuredBottomClearance
      : 32;
    const usableCenter = programsUsableCenter(
      window.visualViewport?.height ?? window.innerHeight,
      clearance,
      bottomClearance,
    );
    return rect.top + rect.height / 2 - usableCenter;
  }, [composition]);
  const lockAtCurrentPosition = useCallback(
    (advanceChapter = false) => {
      const fromBelow = stateRef.current === "CENTERING_FROM_BELOW";
      chapterRef.current = fromBelow
        ? Math.min(chapterCount, total) - 1
        : advanceChapter
          ? 1
          : 0;
      setActiveIndex(chapterRef.current);
      // The gesture that enters the plateau belongs to native scrolling. Absorb
      // its remaining inertia instead of spending it on the first chapter.
      gesture.current.spent = true;
      window.clearTimeout(gesture.current.timer);
      gesture.current.timer = window.setTimeout(() => {
        gesture.current = { amount: 0, direction: 0, spent: false, timer: 0 };
      }, GESTURE_COOLDOWN_MS);
      update("LOCKED");
    },
    [total, update],
  );
  const moveChapter = useCallback(
    (direction: -1 | 1) => {
      const next = chapterRef.current + direction;
      if (next < 0) {
        update("FREE_BEFORE");
        return;
      }
      if (next >= Math.min(chapterCount, total)) {
        if (releaseReady.current) {
          update("FREE_AFTER");
        }
        return;
      }
      chapterRef.current = next;
      releaseReady.current = false;
      setActiveIndex(next);
    },
    [total, update],
  );

  const goTo = useCallback(
    (index: number) => {
      const next = Math.min(
        Math.max(index, 0),
        Math.min(chapterCount, total) - 1,
      );
      if (next === chapterRef.current) return;
      chapterRef.current = next;
      setActiveIndex(chapterRef.current);
      releaseReady.current = false;
      update(stateRef.current === "LOCKED" ? "LOCKED" : stateRef.current);
    },
    [total, update],
  );

  useEffect(() => {
    const captureOversizedApproach = (
      travel: number,
      beforeScroll?: () => void,
    ): "centered" | "centering" | null => {
      const direction = travel > 0 ? 1 : -1;
      const fromAbove = stateRef.current === "FREE_BEFORE" && direction > 0;
      const fromBelow = stateRef.current === "FREE_AFTER" && direction < 0;
      if (!fromAbove && !fromBelow) return null;
      const error = centerError();
      if (error * direction < 0) return null;
      approachDirectionRef.current = direction;
      // If the wheel delta is large enough to reach the lock position (error)
      // plus a buffer, trigger instant centering. This handles large wheel
      // gestures that would otherwise require many scroll events.
      const approachBuffer = 200;
      if (Math.abs(travel) < Math.abs(error) + approachBuffer) return null;
      beforeScroll?.();
      update(fromAbove ? "CENTERING_FROM_ABOVE" : "CENTERING_FROM_BELOW");
      window.scrollBy({ top: error, behavior: "instant" });
      // Only remeasure after a scroll write; sticky geometry can then change.
      if (isProgramsCompositionCentered(centerError())) {
        lockAtCurrentPosition(direction > 0);
        return "centered";
      }
      return "centering";
    };

    const onScroll = () => {
      const current = stateRef.current;
      const scrollY = window.scrollY;
      const scrollDirection =
        scrollY > lastScrollY.current
          ? 1
          : scrollY < lastScrollY.current
            ? -1
            : 0;
      lastScrollY.current = scrollY;
      if (current === "LOCKED") {
        prevErrorRef.current = null;
        approachDirectionRef.current = 0;
        return;
      }
      const error = centerError();
      // Detect center crossing: error changed sign while approaching.
      // This catches fast scrolls that bypass the centered check in a single frame.
      const prevError = prevErrorRef.current;
      const crossedCenter =
        prevError !== null &&
        prevError * error < 0 &&
        ((approachDirectionRef.current > 0 && scrollDirection > 0) ||
          (approachDirectionRef.current < 0 && scrollDirection < 0));
      prevErrorRef.current = error;
      const allowedApproach =
        (current === "FREE_BEFORE" && scrollDirection > 0) ||
        (current === "FREE_AFTER" && scrollDirection < 0) ||
        (current === "CENTERING_FROM_ABOVE" && scrollDirection >= 0) ||
        (current === "CENTERING_FROM_BELOW" && scrollDirection <= 0);
      if (crossedCenter) {
        // We crossed the center point during approach - lock immediately.
        update(
          approachDirectionRef.current > 0
            ? "CENTERING_FROM_ABOVE"
            : "CENTERING_FROM_BELOW",
        );
        // Snap to exact center and lock.
        window.scrollBy({ top: error, behavior: "instant" });
        if (isProgramsCompositionCentered(centerError())) {
          lockAtCurrentPosition(approachDirectionRef.current > 0);
        }
        approachDirectionRef.current = 0;
        return;
      }
      if (isProgramsCompositionCentered(error) && allowedApproach) {
        update(
          current === "FREE_AFTER" || current === "CENTERING_FROM_BELOW"
            ? "CENTERING_FROM_BELOW"
            : "CENTERING_FROM_ABOVE",
        );
        if (isProgramsCompositionCentered(centerError()))
          lockAtCurrentPosition(false);
      } else if (
        current.startsWith("CENTERING") &&
        (Math.abs(error) > PROGRAMS_CENTER_TOLERANCE || scrollDirection !== 0)
      ) {
        update(
          current === "CENTERING_FROM_ABOVE" ? "FREE_BEFORE" : "FREE_AFTER",
        );
        approachDirectionRef.current = 0;
      }
    };
    const onWheel = (event: WheelEvent) => {
      if (event.ctrlKey || event.metaKey || editable(event.target)) return;
      const delta = normalizeWheelDelta(
        event.deltaY,
        event.deltaMode,
        window.innerHeight,
      );
      if (!delta) return;
      if (stateRef.current !== "LOCKED") {
        if (captureOversizedApproach(delta, () => event.preventDefault())) {
          // The large wheel gesture belongs to entry, not the next chapter.
          gesture.current.spent = true;
          window.clearTimeout(gesture.current.timer);
          gesture.current.timer = window.setTimeout(() => {
            gesture.current = {
              amount: 0,
              direction: 0,
              spent: false,
              timer: 0,
            };
          }, GESTURE_COOLDOWN_MS);
        }
        return;
      }
      const direction = delta > 0 ? 1 : -1;
      if (gesture.current.direction !== direction) {
        gesture.current.amount = 0;
      }
      gesture.current.direction = direction;
      if (gesture.current.spent) {
        event.preventDefault();
        window.clearTimeout(gesture.current.timer);
        gesture.current.timer = window.setTimeout(() => {
          gesture.current.amount = 0;
          gesture.current.direction = 0;
          gesture.current.spent = false;
        }, GESTURE_COOLDOWN_MS);
        return;
      }
      const result = accumulateProgramsWheelGesture(
        gesture.current.amount,
        delta,
      );
      gesture.current.amount = result.amount;
      const releasing =
        result.direction &&
        shouldReleaseProgramsWheelBoundary(
          gesture.current.spent,
          result.direction,
          chapterRef.current,
          total,
          releaseReady.current,
        );
      event.preventDefault();
      if (result.direction) {
        moveChapter(result.direction);
        gesture.current.spent = true;
        // The browser chose a non-scrollable root before this event. Forward
        // only the deliberate release input, never a corrective anchor jump.
        if (releasing) window.scrollBy({ top: delta, behavior: "instant" });
      }
      window.clearTimeout(gesture.current.timer);
      gesture.current.timer = window.setTimeout(() => {
        gesture.current.amount = 0;
        gesture.current.direction = 0;
        gesture.current.spent = false;
      }, GESTURE_COOLDOWN_MS);
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Tab") {
        pendingTab.current = event.shiftKey ? -1 : 1;
        if (stateRef.current === "LOCKED") {
          update(stateAfterFocusExit(pendingTab.current));
        }
        return;
      }
      const stage = stageRef.current;
      const target = event.target instanceof Element ? event.target : null;
      const context = {
        editableOrModal: editable(event.target),
        focusableOutsideStage: Boolean(
          target?.closest("nav, button, a[href]") && !stage?.contains(target),
        ),
        focusableInsideStage: Boolean(
          target?.closest("nav, button, a[href]") && stage?.contains(target),
        ),
      };
      if (event.key === "Escape") {
        if (
          stateRef.current === "LOCKED" ||
          stateRef.current.startsWith("CENTERING")
        ) {
          update("FREE_AFTER");
        }
        return;
      }
      if (!shouldHandleProgramsStageKey(event.key, context)) return;
      const keyDirection =
        ["ArrowDown", "PageDown"].includes(event.key) ||
        (event.key === " " && !event.shiftKey)
          ? 1
          : -1;
      if (stateRef.current !== "LOCKED") {
        const travel =
          keyDirection *
          (event.key.startsWith("Arrow") ? 40 : window.innerHeight * 0.85);
        if (captureOversizedApproach(travel) === "centered")
          event.preventDefault();
        return;
      }
      if (event.repeat) {
        event.preventDefault();
        return;
      }
      const direction =
        ["ArrowDown", "PageDown"].includes(event.key) ||
        (event.key === " " && !event.shiftKey)
          ? 1
          : ["ArrowUp", "PageUp"].includes(event.key) ||
              (event.key === " " && event.shiftKey)
            ? -1
            : 0;
      if (!direction) return;
      if (
        isProgramsBoundary(
          direction as -1 | 1,
          chapterRef.current,
          total,
          releaseReady.current,
        )
      ) {
        event.preventDefault();
        moveChapter(direction as -1 | 1);
        window.scrollBy({
          top:
            direction *
            (event.key.startsWith("Arrow") ? 40 : window.innerHeight * 0.85),
          behavior: "instant",
        });
        return;
      }
      event.preventDefault();
      moveChapter(direction as -1 | 1);
    };
    const onTouchStart = (event: TouchEvent) => {
      touchY.current = null;
      if (stateRef.current === "LOCKED")
        touchY.current = event.touches[0]?.clientY ?? null;
    };
    const onTouchMove = (event: TouchEvent) => {
      if (stateRef.current !== "LOCKED" || editable(event.target)) return;
      const start = touchY.current;
      const currentY = event.touches[0]?.clientY;
      if (
        start !== null &&
        start !== undefined &&
        currentY !== undefined &&
        Math.abs(start - currentY) >= 48
      ) {
        const direction = start > currentY ? 1 : -1;
        if (
          isProgramsBoundary(
            direction,
            chapterRef.current,
            total,
            releaseReady.current,
          )
        ) {
          moveChapter(direction);
          touchY.current = null;
          window.scrollBy({ top: start - currentY, behavior: "instant" });
          return;
        }
      }
      event.preventDefault();
    };
    const onTouchEnd = (event: TouchEvent) => {
      const start = touchY.current;
      touchY.current = null;
      if (start === null || stateRef.current !== "LOCKED") return;
      const end = event.changedTouches[0]?.clientY ?? start;
      if (Math.abs(start - end) >= 48) {
        const direction = start > end ? 1 : -1;
        moveChapter(direction);
      }
    };
    const onFocus = (event: FocusEvent) => {
      const stage = stageRef.current;
      if (
        stage &&
        event.target instanceof Node &&
        !stage.contains(event.target) &&
        stateRef.current === "LOCKED"
      ) {
        update(stateAfterFocusExit(pendingTab.current ?? 1));
      }
      pendingTab.current = null;
    };
    const onResize = () => {
      if (stateRef.current !== "LOCKED") return;
      const error = centerError();
      if (!isProgramsCompositionCentered(error))
        update(error > 0 ? "FREE_BEFORE" : "FREE_AFTER");
    };
    lastScrollY.current = window.scrollY;
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("wheel", onWheel, { passive: false });
    window.addEventListener("keydown", onKey, true);
    window.addEventListener("focusin", onFocus, true);
    window.addEventListener("resize", onResize, { passive: true });
    const stage = stageRef.current;
    stage?.addEventListener("touchstart", onTouchStart, { passive: true });
    stage?.addEventListener("touchmove", onTouchMove, { passive: false });
    stage?.addEventListener("touchend", onTouchEnd, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("wheel", onWheel);
      window.removeEventListener("keydown", onKey, true);
      window.removeEventListener("focusin", onFocus, true);
      window.removeEventListener("resize", onResize);
      stage?.removeEventListener("touchstart", onTouchStart);
      stage?.removeEventListener("touchmove", onTouchMove);
      stage?.removeEventListener("touchend", onTouchEnd);
      window.clearTimeout(gesture.current.timer);
    };
  }, [centerError, lockAtCurrentPosition, moveChapter, total, update]);

  return {
    stageRef,
    state,
    activeIndex: Math.min(activeIndex, Math.max(0, total - 1)),
    boundary,
    goTo,
    next: () => moveChapter(1),
    previous: () => moveChapter(-1),
  };
}
