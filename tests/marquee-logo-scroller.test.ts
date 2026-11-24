import { act, createElement } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, expect, it, vi } from "vitest";
import { MarqueeLogoScroller } from "@/components/ui/marquee-logo-scroller";

vi.mock("@/lib/motion-preference", () => ({
  getReducedMotion: () => false,
  subscribeReducedMotion: () => () => {},
}));

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

it("does not mutate logo styles again when their animation focus hasn't changed", async () => {
  vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
  const frames = new Map<number, FrameRequestCallback>();
  let sequence = 0;
  vi.stubGlobal("requestAnimationFrame", (callback: FrameRequestCallback) => {
    frames.set(++sequence, callback);
    return sequence;
  });
  vi.stubGlobal("cancelAnimationFrame", (id: number) => frames.delete(id));
  vi.stubGlobal("ResizeObserver", undefined);
  vi.stubGlobal("IntersectionObserver", undefined);
  vi.spyOn(HTMLElement.prototype, "clientWidth", "get").mockReturnValue(800);
  vi.spyOn(HTMLElement.prototype, "getBoundingClientRect").mockReturnValue(
    new DOMRect(0, 0, 1600, 60),
  );
  vi.spyOn(HTMLElement.prototype, "offsetWidth", "get").mockReturnValue(200);
  vi.spyOn(HTMLElement.prototype, "offsetLeft", "get").mockReturnValue(300);
  const clock = { currentTime: 0, cancel() {}, pause() {}, play() {} };
  const previous = Object.getOwnPropertyDescriptor(
    Element.prototype,
    "animate",
  );
  Object.defineProperty(Element.prototype, "animate", {
    configurable: true,
    value: () => clock,
  });
  const host = document.createElement("div");
  document.body.append(host);
  const root = createRoot(host);
  const writeStyle = vi.spyOn(CSSStyleDeclaration.prototype, "setProperty");
  const runFrame = () => {
    const queued = [...frames.values()];
    frames.clear();
    for (const callback of queued) callback(0);
  };
  try {
    await act(async () => root.render(createElement(MarqueeLogoScroller)));
    runFrame();
    const focusWrites = () =>
      writeStyle.mock.calls.filter(([name]) => name === "--focus");
    expect(focusWrites().length).toBeGreaterThan(0);
    writeStyle.mockClear();
    runFrame();
    expect(focusWrites()).toHaveLength(0);
    clock.currentTime = 1_000;
    runFrame();
    expect(focusWrites().length).toBeGreaterThan(0);
  } finally {
    await act(async () => root.unmount());
    host.remove();
    if (previous) Object.defineProperty(Element.prototype, "animate", previous);
    else Reflect.deleteProperty(Element.prototype, "animate");
  }
});
