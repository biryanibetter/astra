"use client";

import { useEffect, useState } from "react";

type TypewriterProps = {
  phrases: readonly string[];
  className?: string;
};

export function Typewriter({ phrases, className }: TypewriterProps) {
  const [phraseIndex, setPhraseIndex] = useState(0);
  const [visibleLength, setVisibleLength] = useState(0);

  useEffect(() => {
    if (phrases.length === 0) return;
    let timer: ReturnType<typeof setTimeout>;
    let cancelled = false;

    const type = (index: number, length: number) => {
      if (cancelled) return;
      const phrase = phrases[index] ?? "";
      if (length < phrase.length) {
        timer = setTimeout(() => {
          setVisibleLength(length + 1);
          type(index, length + 1);
        }, 75);
        return;
      }
      if (phrases.length === 1) return;
      timer = setTimeout(() => erase(index, phrase.length), 1500);
    };

    const erase = (index: number, length: number) => {
      if (cancelled) return;
      if (length > 0) {
        timer = setTimeout(() => {
          setVisibleLength(length - 1);
          erase(index, length - 1);
        }, 40);
        return;
      }
      const next = (index + 1) % phrases.length;
      setPhraseIndex(next);
      type(next, 0);
    };

    type(0, 0);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [phrases]);

  const phrase = phrases[phraseIndex] ?? "";
  return (
    <span className={`typewriter${className ? ` ${className}` : ""}`}>
      <span className="typewriter-reserve" aria-hidden="true">
        {phrases.reduce(
          (longest, item) => (item.length > longest.length ? item : longest),
          "",
        )}
      </span>
      <span className="typewriter-text">
        {phrase.slice(0, visibleLength)}
        <span className="typewriter-cursor" aria-hidden="true" />
      </span>
    </span>
  );
}
