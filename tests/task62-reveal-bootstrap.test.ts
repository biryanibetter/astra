import { afterEach, expect, it, vi } from "vitest";
import { bootstrapScrollReveals } from "@/lib/reveal-bootstrap";

afterEach(() => {
  window.__ASTRA_REVEALS__?.recover();
  delete window.__ASTRA_REVEALS__;
  document.body.innerHTML = "";
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

it("prepares only below-fold surfaces without mutating hydration attributes", () => {
  document.body.innerHTML =
    '<h2 data-reveal="heading">Visible</h2><div data-reveal="image">Below</div>';
  const elements = [...document.querySelectorAll<HTMLElement>("[data-reveal]")];
  elements.forEach((el, index) => {
    vi.spyOn(el, "getBoundingClientRect").mockReturnValue({
      top: index ? 1500 : 50,
      bottom: index ? 1700 : 150,
      height: 100,
    } as DOMRect);
  });
  vi.stubGlobal(
    "IntersectionObserver",
    class {
      observe() {}
      unobserve() {}
      disconnect() {}
    },
  );
  const cancel = vi.fn();
  const animate = vi.fn(() => ({ pause: vi.fn(), cancel }));
  vi.stubGlobal("Animation", class {});
  Object.defineProperty(Element.prototype, "animate", {
    configurable: true,
    value: animate,
  });
  const html = document.body.innerHTML;
  bootstrapScrollReveals();
  expect(animate).toHaveBeenCalledTimes(1);
  const below = elements[1];
  if (!below) throw new Error("Fixture missing");
  expect(window.__ASTRA_REVEALS__?.pending.has(below)).toBe(true);
  expect(document.body.innerHTML).toBe(html);
  window.__ASTRA_REVEALS__?.prepare();
  expect(animate).toHaveBeenCalledTimes(1);
  window.__ASTRA_REVEALS__?.recover();
  expect(cancel).toHaveBeenCalledTimes(1);
});
