import { animateMini as animate } from "motion/react";
import type {} from "./reveal-bootstrap";

/** Native Motion entrances need no persistent MotionValue/style-effect bindings.
 * One page-wide observer lives in the pre-paint bootstrap, not in each wrapper.
 * Existing scoped callers can share ownership without creating more observers.
 */
export function installScrollReveals(_root: ParentNode): () => void {
  const runtime = window.__ASTRA_REVEALS__;
  // A blocked bootstrap is deliberately fail-open, never hidden after paint.
  if (!runtime) return () => {};
  runtime.owners++;
  runtime.play ??= (elements) => {
    const groups = new Map<Element, number>();
    let concurrent = runtime.active.size;
    for (const element of elements) {
      const hold = runtime.pending.get(element);
      if (!hold) continue;
      const box = element.getBoundingClientRect();
      const editorial = element.dataset.reveal === "words";
      // A jump into/past a surface exposes it immediately; no blank fast-scroll
      // viewport and no delayed entrance queue.
      if (
        box.top < 0 ||
        box.bottom <= 0 ||
        (box.top < innerHeight - Math.min(box.height * 0.5, 180) &&
          !(editorial && scrollY === 0)) ||
        concurrent >= 4 ||
        (element.hasAttribute("data-reveal-respect-motion") &&
          window.matchMedia("(prefers-reduced-motion: reduce)").matches) ||
        element.contains(document.activeElement) ||
        element.matches(":hover")
      )
        continue;
      const group = element.parentElement?.closest("[data-reveal-group]");
      const index = group ? (groups.get(group) ?? 0) : 0;
      if (group) groups.set(group, index + 1);
      if (index >= 4) continue;

      const heading =
        element.dataset.reveal === "heading" || element.matches("h1,h2,h3");
      const image = element.dataset.reveal === "image";
      const panel = element.matches(
        "article, section, button, [role='tabpanel'], [class*='card'], [class*='panel']",
      );
      const original = ["opacity"].map((property) => ({
        property,
        value: element.style.getPropertyValue(property),
        priority: element.style.getPropertyPriority(property),
      }));
      const css = getComputedStyle(element);
      const base = css.transform;
      const controls: (ReturnType<typeof animate> | Animation)[] = [];
      let finished = false;
      const finish = () => {
        if (finished) return;
        finished = true;
        for (const control of controls) control.cancel();
        for (const { property, value, priority } of original) {
          if (value) element.style.setProperty(property, value, priority);
          else element.style.removeProperty(property);
        }
        runtime.active.delete(element);
      };
      try {
        // Canceling the native hold does not paint in between these synchronous
        // statements. Motion starts from the same zero-opacity state.
        hold.cancel();
        runtime.pending.delete(element);
        const opacity = Number.parseFloat(getComputedStyle(element).opacity);
        const words = editorial
          ? Array.from(
              element.querySelectorAll<HTMLElement>("[data-reveal-word]"),
            )
          : [];
        const translate = heading ? 24 : image ? 24 : 28;
        const scale = image ? 0.99 : !heading && panel ? 0.985 : 1;
        const transform =
          element.dataset.reveal === "fade" ||
          (css.animationName && css.animationName !== "none") ||
          (base !== "none" && !image)
            ? undefined
            : [
                `translateY(${translate}px) scale(${scale})${base !== "none" ? ` ${base}` : ""}`,
                `translateY(0px) scale(1)${base !== "none" ? ` ${base}` : ""}`,
              ];
        if (transform)
          original.push({
            property: "transform",
            value: element.style.getPropertyValue("transform"),
            priority: element.style.getPropertyPriority("transform"),
          });
        const transition = {
          duration: heading ? 0.55 : image ? 0.6 : 0.62,
          delay: Math.min(index, 3) * 0.07,
          ease: [0.22, 1, 0.36, 1] as [number, number, number, number],
        };
        // Retain each property's control immediately: native startup for a later
        // property may throw, and must not orphan an earlier running animation.
        if (words.length > 0) {
          words.forEach((word, wordIndex) => {
            controls.push(
              word.animate(
                {
                  opacity: [0, 1],
                  transform: ["translateY(12px)", "translateY(0px)"],
                },
                {
                  duration: transition.duration * 1000,
                  easing: `cubic-bezier(${transition.ease.join(",")})`,
                  delay: (wordIndex / words.length) * 280,
                  fill: "both",
                },
              ),
            );
          });
        } else {
          controls.push(
            animate(
              element,
              { opacity: [0, Number.isFinite(opacity) ? opacity : 1] },
              transition,
            ),
          );
          if (transform)
            controls.push(animate(element, { transform }, transition));
        }
        runtime.active.set(element, finish);
        concurrent++;
        let remaining = controls.length;
        for (const control of controls) {
          const completed = "finished" in control ? control.finished : control;
          completed.then(() => {
            if (--remaining === 0) finish();
          }, finish);
        }
      } catch {
        finish();
      }
    }
  };
  runtime.prepare();
  return () => {
    runtime.owners--;
    // StrictMode's synchronous cleanup/remount must not expose pending targets.
    queueMicrotask(() => {
      if (runtime.owners === 0) {
        delete runtime.play;
        runtime.recover();
      }
    });
  };
}
