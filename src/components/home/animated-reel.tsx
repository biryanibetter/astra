"use client";

import Image from "next/image";
import { useState } from "react";

interface AnimatedReelProps {
  src?: string;
  fallbackSrc?: string;
}

/** Browser-decoded artwork: no media element, playback lifecycle, or timers. */
export function AnimatedReel({
  src = "/media/astra-reel-loop.webp",
  fallbackSrc = "/media/astra-reel-still.webp",
}: AnimatedReelProps) {
  const [failed, setFailed] = useState(false);

  return (
    <div className="reel-artwork" aria-hidden="true">
      <Image
        className="reel-artwork-still"
        src={fallbackSrc}
        alt=""
        width={1280}
        height={720}
        unoptimized
        loading="eager"
        draggable={false}
      />
      {!failed ? (
        <Image
          className="reel-artwork-loop"
          src={src}
          alt=""
          width={1280}
          height={720}
          unoptimized
          loading="eager"
          decoding="async"
          draggable={false}
          onError={() => setFailed(true)}
        />
      ) : null}
    </div>
  );
}
