"use client";

import { useRef } from "react";
import { WordRevealHeading } from "@/components/ui/word-reveal-heading";
import { AnimatedReel } from "./animated-reel";
import { useCinematicDepth } from "./use-cinematic-depth";

export function FramedReel() {
  const frameRef = useRef<HTMLDivElement>(null);
  useCinematicDepth(frameRef, "reel");
  return (
    <section className="wrap framed-reel" aria-labelledby="reel-heading">
      <div className="reel-media-perspective" data-reveal="image">
        <div ref={frameRef} className="reel-frame">
          <div className="reel-frame-inner">
            <AnimatedReel />
          </div>
        </div>
      </div>
      <div className="reel-copy">
        <WordRevealHeading
          shimmer="home"
          as="h2"
          id="reel-heading"
          className="display"
          text="Ideas are better in motion."
        />
        <p className="body-copy" data-reveal="fade-up">
          Through student-led initiatives, collaborative projects and shared
          experiences, Astra aims to build a community where ideas are
          discussed, developed and put into practice.
        </p>
      </div>
    </section>
  );
}
