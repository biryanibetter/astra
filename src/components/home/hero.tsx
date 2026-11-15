"use client";

import { useEffect, useRef } from "react";
import { JoinLink } from "@/components/site";
import { ShimmerText } from "@/components/ui/shimmer-text";
import { Typewriter } from "@/components/ui/typewriter";
import { getReducedMotion, subscribeMotion } from "@/lib/motion-preference";
import { CreationArtwork } from "./creation-artwork";

export function Hero() {
  const root = useRef<HTMLElement>(null);
  useEffect(() => {
    const element = root.current;
    if (!element) return;
    let frame = 0;
    let arrivalFrame = 0;
    const move = (event: PointerEvent) => {
      if (event.pointerType !== "mouse" || getReducedMotion()) return;
      const rect = element.getBoundingClientRect();
      const x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      const y = ((event.clientY - rect.top) / rect.height) * 2 - 1;
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        element.style.setProperty("--mx", `${x}`);
        element.style.setProperty("--my", `${y}`);
      });
    };
    const reset = () => {
      cancelAnimationFrame(frame);
      element.style.setProperty("--mx", "0");
      element.style.setProperty("--my", "0");
    };
    const scheduleArrival = () => {
      cancelAnimationFrame(arrivalFrame);
      arrivalFrame = requestAnimationFrame(() => {
        element.classList.add("hero-ready");
      });
    };
    scheduleArrival();
    const unsubscribeMotion = subscribeMotion(reset);
    element.addEventListener("pointermove", move, { passive: true });
    element.addEventListener("pointerleave", reset);
    // CSS owns the arrival transforms; a second GSAP tween on the same
    // elements would race it during hydration and on slower devices.
    element.addEventListener("pointerup", reset);
    element.addEventListener("pointercancel", reset);
    return () => {
      cancelAnimationFrame(frame);
      cancelAnimationFrame(arrivalFrame);
      element.classList.remove("hero-ready");
      unsubscribeMotion();
      element.removeEventListener("pointermove", move);
      element.removeEventListener("pointerleave", reset);
      element.removeEventListener("pointerup", reset);
      element.removeEventListener("pointercancel", reset);
    };
  }, []);

  return (
    <section ref={root} className="hero" aria-labelledby="hero-heading">
      <div className="hero-artwork-depth">
        <CreationArtwork />
      </div>
      <div className="wrap hero-content">
        <h1
          id="hero-heading"
          className="display hero-arrival"
          style={{ color: "#FFFFFF" }}
        >
          <ShimmerText restrained homepage>
            <span data-shimmer-text="">Built by students.</span>
            <span className="hero-gold" style={{ color: "#C6CCD5" }}>
              <span className="hero-gold-prefix" data-shimmer-text="">
                Built for{" "}
              </span>
              <Typewriter phrases={HERO_SUFFIXES} />
            </span>
          </ShimmerText>
        </h1>
        <p className="body-copy">
          Astra is where ambitious young people in Qatar find each other and
          actually do things.
        </p>
        <div className="hero-arrival">
          <JoinLink />
        </div>
      </div>
    </section>
  );
}

const HERO_SUFFIXES = [
  "what's next.",
  "something more.",
  "bold ideas.",
  "the future.",
  "real impact.",
] as const;
