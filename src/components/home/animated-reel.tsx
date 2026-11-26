"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";

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
  const [visible, setVisible] = useState(false);
  const artwork = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const element = artwork.current;
    if (!element) return;
    if (typeof IntersectionObserver === "undefined") {
      setVisible(true);
      return;
    }
    const observer = new IntersectionObserver((entries) =>
      setVisible(Boolean(entries.at(-1)?.isIntersecting)),
    );
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={artwork} className="reel-artwork" aria-hidden="true">
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
          style={visible ? undefined : { display: "none" }}
          draggable={false}
          onError={() => setFailed(true)}
        />
      ) : null}
    </div>
  );
}
