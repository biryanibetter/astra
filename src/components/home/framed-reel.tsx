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
          as="h2"
          id="reel-heading"
          className="display"
          text="Ideas are better in motion."
        />
        <p className="body-copy" data-reveal="fade-up">
          Astra is built for students who want to make, test, present and build
          together. This reel is a first glimpse of the energy, ambition and
          creativity behind the network.
        </p>
      </div>
    </section>
  );
}
