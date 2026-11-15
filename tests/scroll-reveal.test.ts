import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { bootstrapScrollReveals } from "@/lib/reveal-bootstrap";
import { installScrollReveals } from "@/lib/scroll-reveal";

const motion = vi.hoisted(() => ({ animate: vi.fn() }));
vi.mock("motion/react", () => ({ animateMini: motion.animate }));
let enter: IntersectionObserverCallback;
let observerCount: number;
let observed: Set<Element>;
let finish: (() => void)[];
let cleanup: (() => void) | undefined;
let cancelHold: ReturnType<typeof vi.fn>;

beforeEach(() => {
  observerCount = 0;
  observed = new Set();
  finish = [];
  cancelHold = vi.fn();
  vi.stubGlobal(
    "IntersectionObserver",
    class {
      constructor(
        callback: IntersectionObserverCallback,
        options: IntersectionObserverInit,
      ) {
        enter = callback;
        observerCount++;
        expect(options.rootMargin).toBe("0px 0px 120px 0px");
      }
      observe(el: Element) {
        observed.add(el);
      }
      unobserve(el: Element) {
        observed.delete(el);
      }
      disconnect() {
        observed.clear();
      }
    },
  );
  Object.defineProperty(Element.prototype, "animate", {
    configurable: true,
    value: vi.fn(() => ({ pause: vi.fn(), cancel: cancelHold })),
  });
  vi.spyOn(Element.prototype, "getBoundingClientRect").mockReturnValue({
    top: 1500,
    bottom: 1700,
    height: 200,
  } as DOMRect);
  motion.animate.mockReset().mockImplementation(() => ({
    cancel: vi.fn(),
    // biome-ignore lint/suspicious/noThenProperty: Motion controls are promise-like.
    then: (resolve: () => void) => finish.push(resolve),
  }));
  document.body.innerHTML =
    '<main data-reveal-group><h2 data-reveal="heading">Heading</h2><div data-reveal="image">Image</div><div data-reveal="section">Card</div></main>';
});

afterEach(async () => {
  cleanup?.();
  cleanup = undefined;
  await Promise.resolve();
  window.__ASTRA_REVEALS__?.recover();
  delete window.__ASTRA_REVEALS__;
  document.body.innerHTML = "";
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

function start() {
  bootstrapScrollReveals();
  cleanup = installScrollReveals(document);
}

function approach(
  elements = [...document.querySelectorAll<HTMLElement>("[data-reveal]")],
) {
  elements.forEach((el) => {
    vi.spyOn(el, "getBoundingClientRect").mockReturnValue({
      top: innerHeight + 40,
      bottom: innerHeight + 240,
      height: 200,
    } as DOMRect);
  });
  enter(
    elements.map(
      (target) =>
        ({
          target,
          isIntersecting: true,
        }) as unknown as IntersectionObserverEntry,
    ),
    {} as IntersectionObserver,
  );
}

describe("once-only shared entrances", () => {
  it("shares one observer across callers and never rearms on viewport exits", () => {
    start();
    const second = installScrollReveals(document);
    approach();
    approach();
    expect(motion.animate).toHaveBeenCalledTimes(6);
    expect(observerCount).toBe(1);
    expect(observed.size).toBe(0);
    second();
  });

  it("uses short whole-surface heading/image/card variants and stagger", () => {
    start();
    approach();
    const opacityCalls = motion.animate.mock.calls.filter(
      (call) => "opacity" in call[1],
    );
    expect(opacityCalls.map((call) => call[2].duration)).toEqual([
      0.55, 0.6, 0.62,
    ]);
    expect(opacityCalls.map((call) => call[2].delay)).toEqual([0, 0.07, 0.14]);
    for (const [, frames] of opacityCalls) {
      expect(frames.opacity).toEqual([0, 1]);
    }
    for (const [, frames] of motion.animate.mock.calls.filter(
      (call) => "transform" in call[1],
    )) {
      expect(frames.transform[0]).toMatch(/translateY\((24|28)px\)/);
    }
  });

  it("does not hide or animate initial viewport content", () => {
    vi.spyOn(Element.prototype, "getBoundingClientRect").mockReturnValue({
      top: 20,
      bottom: 220,
      height: 200,
    } as DOMRect);
    start();
    expect(window.__ASTRA_REVEALS__?.pending.size).toBe(0);
    expect(Element.prototype.animate).not.toHaveBeenCalled();
  });

  it("fast jumps and excess concurrent entrances fail open immediately", () => {
    document.body.innerHTML = `<main data-reveal-group>${"<div data-reveal>Card</div>".repeat(8)}</main>`;
    start();
    approach();
    expect(motion.animate).toHaveBeenCalledTimes(8);
    expect(window.__ASTRA_REVEALS__?.pending.size).toBe(0);
    expect(cancelHold).toHaveBeenCalledTimes(8);
  });

  it("restores only entrance-owned styles and releases finished controllers", () => {
    start();
    const target = document.querySelector<HTMLElement>("[data-reveal]");
    if (!target) throw new Error("Fixture missing");
    approach([target]);
    target.style.setProperty("--pointer-x", "30px");
    target.style.opacity = "1";
    target.style.transform = "translateY(0px)";
    for (const complete of finish) complete();
    expect(target.style.opacity).toBe("");
    expect(target.style.transform).toBe("");
    expect(target.style.getPropertyValue("--pointer-x")).toBe("30px");
    expect(window.__ASTRA_REVEALS__?.active.size).toBe(0);
  });

  it("exposes content when Motion throws rather than retaining its hold", () => {
    start();
    motion.animate.mockImplementation(() => {
      throw new Error("Unsupported animation");
    });
    approach();
    expect(window.__ASTRA_REVEALS__?.pending.size).toBe(0);
    expect(window.__ASTRA_REVEALS__?.active.size).toBe(0);
  });

  it("never restores transforms that the entrance did not own", () => {
    const target = document.querySelector<HTMLElement>("[data-reveal]");
    if (!target) throw new Error("Fixture missing");
    target.dataset.reveal = "fade";
    start();
    approach([target]);
    target.style.transform = "translateY(-3px)";
    for (const complete of finish) complete();
    expect(target.style.transform).toBe("translateY(-3px)");
  });

  it("never introduces late hidden styles if the bootstrap was blocked", () => {
    cleanup = installScrollReveals(document);
    expect(motion.animate).not.toHaveBeenCalled();
    expect(Element.prototype.animate).not.toHaveBeenCalled();
  });

  it("filters nested targets and editable areas", () => {
    document.body.innerHTML =
      "<div data-reveal><h2 data-reveal>Nested</h2></div><form><div data-reveal>Form</div></form><div data-reveal><input /></div>";
    start();
    expect(observed.size).toBe(1);
  });

  it("keeps content readable without IntersectionObserver", () => {
    vi.stubGlobal("IntersectionObserver", undefined);
    start();
    expect(window.__ASTRA_REVEALS__).toBeUndefined();
    expect(Element.prototype.animate).not.toHaveBeenCalled();
  });
});
