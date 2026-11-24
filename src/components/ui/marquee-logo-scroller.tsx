"use client";

import { useEffect, useRef } from "react";
import {
  getReducedMotion,
  subscribeReducedMotion,
} from "@/lib/motion-preference";
import { orbitalBrands } from "./orbital-brands";
import "./marquee-logo-scroller.css";

/** Decorative demo artwork, never a sponsorship or partnership announcement. */
export function MarqueeLogoScroller() {
  const viewportRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const viewport = viewportRef.current;
    const track = viewport?.querySelector<HTMLElement>(".marquee-logo-track");
    const group = track?.firstElementChild as HTMLElement | null;
    const duplicate = group?.nextElementSibling as HTMLElement | null;
    if (!viewport || !track || !group || !duplicate) return;

    const marks = Array.from(
      track.querySelectorAll<HTMLElement>(".orbital-brand"),
    );
    let geometry: { element: HTMLElement; center: number; focus?: string }[] =
      [];
    let width = 0;
    let loopWidth = 0;
    let frame = 0;
    let visible = true;
    let animation: Animation | null = null;
    const speed = 26; // CSS pixels per second, independent of viewport/refresh rate.

    const stopFocus = () => {
      cancelAnimationFrame(frame);
      frame = 0;
    };

    const illuminate = () => {
      frame = 0;
      if (!animation || !visible || document.hidden || getReducedMotion())
        return;
      // Translation and focus share the browser's elapsed-time animation clock.
      const travel =
        (((Number(animation.currentTime) || 0) * speed) / 1000) % loopWidth;
      const radius = Math.max(160, width * 0.27);
      for (const mark of geometry) {
        const offset = mark.center - travel - width / 2;
        const distance = Math.abs(
          offset - Math.round(offset / loopWidth) * loopWidth,
        );
        const linear = Math.max(0, 1 - distance / radius);
        const focus = (linear * linear * (3 - 2 * linear)).toFixed(4);
        // Most marks stay outside the spotlight. Leave their style alone
        // unless the exact value passed to CSS actually changes.
        if (focus === mark.focus) continue;
        mark.element.style.setProperty("--focus", focus);
        mark.focus = focus;
      }
      frame = requestAnimationFrame(illuminate);
    };

    const startFocus = () => {
      if (
        !frame &&
        animation &&
        visible &&
        !document.hidden &&
        !getReducedMotion()
      ) {
        frame = requestAnimationFrame(illuminate);
      }
    };

    const ensureAnimation = () => {
      if (animation || getReducedMotion() || loopWidth <= 0) return;
      animation = track.animate(
        [
          { transform: "translate3d(0, 0, 0)" },
          { transform: `translate3d(${-loopWidth}px, 0, 0)` },
        ],
        {
          duration: (loopWidth / speed) * 1000,
          iterations: Infinity,
          easing: "linear",
        },
      );
      if (document.hidden) animation.pause();
      startFocus();
    };

    // Layout reads happen only on resize, never in the animation loop.
    const measure = () => {
      // The controller applies CSS before notifying animation owners. Never
      // retime a running animation against the collapsed static layout.
      if (getReducedMotion()) {
        stopFocus();
        animation?.cancel();
        animation = null;
        return;
      }
      const measuredWidth = viewport.clientWidth;
      // The repeat's own layout width includes its trailing seam gap.
      // Never measure scaled logo descendants or rounded offsetLeft values.
      const measuredLoop = group.getBoundingClientRect().width;
      // Keep the last valid geometry while a mounted ribbon is layout-hidden.
      if (measuredWidth <= 0 || measuredLoop <= 0) return;
      width = measuredWidth;
      const previousWidth = loopWidth;
      // Origin-to-origin includes any group gap/padding at the repeat seam.
      loopWidth = measuredLoop;
      geometry = marks.map((element) => ({
        element,
        center: element.offsetLeft + element.offsetWidth / 2,
      }));
      if (animation && loopWidth > 0 && loopWidth !== previousWidth) {
        const travel =
          (((Number(animation.currentTime) || 0) * speed) / 1000) %
          (previousWidth || loopWidth);
        const effect = animation.effect as KeyframeEffect;
        effect.setKeyframes([
          { transform: "translate3d(0, 0, 0)" },
          { transform: `translate3d(${-loopWidth}px, 0, 0)` },
        ]);
        effect.updateTiming({ duration: (loopWidth / speed) * 1000 });
        // Preserve pixel offset rather than jumping to a new percentage on resize.
        animation.currentTime = ((travel % loopWidth) / speed) * 1000;
      }
      ensureAnimation();
    };
    const updateMotion = () => {
      stopFocus();
      animation?.cancel();
      animation = null;
      if (getReducedMotion()) {
        for (const { element } of geometry)
          element.style.removeProperty("--focus");
        return;
      }
      measure();
    };
    updateMotion();
    const unsubscribeMotion = subscribeReducedMotion(updateMotion);

    const resize =
      typeof ResizeObserver === "undefined"
        ? null
        : new ResizeObserver(measure);
    resize?.observe(viewport);
    resize?.observe(group);
    if (!resize) window.addEventListener("resize", measure);

    const observer =
      typeof IntersectionObserver === "undefined"
        ? null
        : new IntersectionObserver(([entry]) => {
            visible = entry?.isIntersecting ?? false;
            stopFocus();
            startFocus();
          });
    observer?.observe(viewport);

    // Handle document visibility changes
    const handleVisibilityChange = () => {
      if (document.hidden) {
        stopFocus();
        animation?.pause();
      } else {
        animation?.play();
        startFocus();
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      stopFocus();
      animation?.cancel();
      unsubscribeMotion();
      observer?.disconnect();
      resize?.disconnect();
      window.removeEventListener("resize", measure);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, []);

  return (
    <div className="marquee-logo-scroller" aria-hidden="true" translate="no">
      <svg
        aria-hidden="true"
        className="orbital-ribbon-paths"
        viewBox="0 0 1440 192"
        preserveAspectRatio="none"
      >
        <path className="orbital-path-faint" d="M-100 135Q520-105 1540 59" />
        <path d="M-100 155Q620-42 1540 87" />
        <path className="orbital-path-lower" d="M-100 169Q820 239 1540 109" />
      </svg>
      <div className="orbital-field" />
      <div ref={viewportRef} className="marquee-logo-viewport">
        <div className="marquee-logo-track">
          {["first", "loop"].map((group) => (
            <div className="marquee-logo-group" key={group}>
              {["a", "b"].flatMap((repeat) =>
                orbitalBrands.map((brand) => (
                  <div
                    className="orbital-brand"
                    key={`${repeat}-${brand.name}`}
                  >
                    <span className="orbital-brand-wash" />
                    <span className="orbital-brand-art">
                      <svg
                        aria-hidden="true"
                        viewBox="0 0 24 24"
                        fill="currentColor"
                        focusable="false"
                      >
                        <path d={brand.path} />
                      </svg>
                      <span>{brand.name}</span>
                    </span>
                  </div>
                )),
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
