"use client";

import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { type RefObject, useEffect } from "react";
import { useReducedMotion } from "@/lib/motion-preference";

export function useCinematicDepth(
  ref: RefObject<HTMLElement | null>,
  kind: "artwork" | "reel",
) {
  const reduced = useReducedMotion();
  useEffect(() => {
    const element = ref.current;
    if (!element || reduced) return;
    // The shared artwork is also used outside the homepage hero. Do not create
    // an unrelated ScrollTrigger on the Programs sticky stage.
    if (kind === "artwork" && !element.closest(".hero")) return;
    gsap.registerPlugin(ScrollTrigger);
    const context = gsap.context(() => {
      const trigger = kind === "artwork" ? element.closest(".hero") : element;
      const media = gsap.matchMedia();
      if (kind === "artwork") {
        const subject = element.querySelector(".creation-subject-depth");
        const field = element.querySelector(".creation-atmosphere");
        media.add(
          {
            desktop: "(min-width: 701px)",
            mobile: "(max-width: 700px)",
          },
          (match) => {
            const distance = match.conditions?.mobile ? 24 : 34;
            const duration = match.conditions?.mobile ? 320 : 320;
            const scrollTrigger = {
              trigger,
              start: "top top",
              end: `+=${duration}`,
              scrub: 0.8,
              invalidateOnRefresh: true,
            };
            if (subject)
              gsap.to(subject, {
                y: distance,
                force3D: false,
                ease: "none",
                scrollTrigger,
              });
            if (field)
              gsap.to(field, {
                y: -14,
                force3D: false,
                ease: "none",
                scrollTrigger,
              });
          },
        );
        return () => media.revert();
      }
      gsap.fromTo(
        element,
        { y: 3, rotationX: 0.5 },
        {
          y: -3,
          rotationX: -0.5,
          force3D: false,
          ease: "none",
          scrollTrigger: {
            trigger,
            start: "top bottom",
            end: "bottom top",
            scrub: 0.8,
          },
        },
      );
    });
    let disposed = false;
    const refresh = () => {
      if (!disposed) ScrollTrigger.refresh();
    };
    document.fonts.ready.then(refresh);
    window.addEventListener("load", refresh, { once: true });
    const resize =
      typeof ResizeObserver === "undefined"
        ? null
        : new ResizeObserver(refresh);
    resize?.observe(element.closest(".hero") ?? element);
    return () => {
      disposed = true;
      window.removeEventListener("load", refresh);
      resize?.disconnect();
      context.revert();
    };
  }, [ref, kind, reduced]);
}
