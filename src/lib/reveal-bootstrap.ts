type RevealRuntime = {
  pending: Map<HTMLElement, Animation>;
  active: Map<HTMLElement, () => void>;
  play?: (elements: HTMLElement[]) => void;
  owners: number;
  prepare: () => void;
  recover: () => void;
};

declare global {
  interface Window {
    __ASTRA_REVEALS__?: RevealRuntime;
  }
}

/**
 * Serialized into a synchronous head script. Keep this function self-contained.
 * Native effects, not DOM attributes/styles, hold the pre-paint state: React
 * hydrates exactly the server markup. No script/WAAPI/observer => readable HTML.
 */
export function bootstrapScrollReveals() {
  if (
    window.__ASTRA_REVEALS__ ||
    typeof IntersectionObserver === "undefined" ||
    typeof MutationObserver === "undefined" ||
    !Element.prototype.animate
  )
    return;

  const seen = new WeakSet<HTMLElement>();
  const pending = new Map<HTMLElement, Animation>();
  const active = new Map<HTMLElement, () => void>();
  let disabled = false;
  let timer: ReturnType<typeof setTimeout>;
  const runtime: RevealRuntime = {
    pending,
    active,
    owners: 0,
    prepare,
    recover,
  };
  const observer = new IntersectionObserver(
    (entries) => {
      const entering: HTMLElement[] = [];
      for (const entry of entries) {
        const element = entry.target as HTMLElement;
        if (!entry.isIntersecting || !pending.has(element)) continue;
        observer.unobserve(element);
        entering.push(element);
      }
      if (runtime.play) {
        try {
          runtime.play(entering);
        } catch {
          recover();
        }
      }
      // Before hydration (or on failure), never leave a visible surface waiting
      // for the JS bundle. Once exposed it is in `seen` and cannot be hidden again.
      for (const element of entering) {
        pending.get(element)?.cancel();
        pending.delete(element);
      }
    },
    { rootMargin: "0px 0px 120px 0px", threshold: 0 },
  );
  const mutations = new MutationObserver(() => {
    // Removed route instances must not be retained until their next entrance.
    for (const [element, animation] of pending) {
      if (element.isConnected) continue;
      animation.cancel();
      pending.delete(element);
      observer.unobserve(element);
    }
    for (const [element, finish] of active) {
      if (!element.isConnected) finish();
    }
    prepare();
  });

  function prepare() {
    if (disabled) return;
    const targets = [
      ...document.querySelectorAll<HTMLElement>("[data-reveal]"),
    ].filter(
      (element) =>
        !seen.has(element) &&
        !element.parentElement?.closest("[data-reveal]") &&
        !element.closest("form, [contenteditable='true']") &&
        !element.querySelector(
          "input, textarea, select, [contenteditable='true']",
        ),
    );
    // Batch geometry reads before installing compositor effects.
    const boxes = targets.map((element) => element.getBoundingClientRect());
    targets.forEach((element, index) => {
      const box = boxes[index];
      if (!box || box.height === 0) return;
      seen.add(element);
      // Initial viewport / restored scroll position is already readable.
      if (box.top < innerHeight || element.contains(document.activeElement))
        return;
      try {
        const hold = element.animate(
          { opacity: [0, 0] },
          { duration: 1, fill: "both" },
        );
        pending.set(element, hold);
        hold.pause();
        observer.observe(element);
      } catch {
        pending.get(element)?.cancel();
        pending.delete(element);
      }
    });
  }

  function expose(event: Event) {
    if (!(event.target instanceof Element)) return;
    const element = event.target.closest<HTMLElement>("[data-reveal]");
    if (!element) return;
    pending.get(element)?.cancel();
    pending.delete(element);
    observer.unobserve(element);
    active.get(element)?.();
  }

  function recover() {
    disabled = true;
    clearTimeout(timer);
    observer.disconnect();
    mutations.disconnect();
    for (const animation of pending.values()) animation.cancel();
    pending.clear();
    for (const finish of active.values()) finish();
    document.removeEventListener("focusin", expose, true);
    document.removeEventListener("pointerover", expose, true);
  }

  window.__ASTRA_REVEALS__ = runtime;
  mutations.observe(document.documentElement, {
    childList: true,
    subtree: true,
  });
  document.addEventListener("focusin", expose, true);
  document.addEventListener("pointerover", expose, true);
  // A failed/blocked hydration must never strand hidden below-fold content.
  timer = setTimeout(() => {
    if (!runtime.play) recover();
  }, 5000);
  prepare();
}
