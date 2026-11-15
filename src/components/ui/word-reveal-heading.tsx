"use client";

import { Fragment } from "react";
import { ShimmerText } from "./shimmer-text";
import styles from "./word-reveal-heading.module.css";

type WordRevealHeadingProps = {
  as: "h1" | "h2";
  text: string;
  id?: string;
  className?: string;
  style?: React.CSSProperties;
  mutedFrom?: number;
  breakAfter?: number;
  breakClassName?: string | undefined;
  shimmer?: boolean | "home";
  restrained?: boolean;
};

export function WordRevealHeading({
  as: Heading,
  text,
  id,
  className,
  style,
  mutedFrom,
  breakAfter,
  breakClassName,
  shimmer = false,
  restrained = true,
}: WordRevealHeadingProps) {
  const words = text.split(" ");
  const content = words.map((word, index) => (
    // biome-ignore lint/suspicious/noArrayIndexKey: Static heading words never reorder; repeated words need distinct keys.
    <Fragment key={index}>
      <span
        className={styles.word}
        aria-hidden="true"
        data-shimmer-text={shimmer ? "" : undefined}
        data-muted={
          mutedFrom !== undefined && index >= mutedFrom ? true : undefined
        }
        style={{ "--word-index": index } as React.CSSProperties}
      >
        {word}
      </span>
      {index < words.length - 1 ? " " : ""}
      {index === breakAfter ? <br className={breakClassName} /> : null}
    </Fragment>
  ));
  return (
    <Heading
      id={id}
      className={className}
      style={style}
      data-reveal="heading"
      aria-label={text}
    >
      {shimmer ? (
        <ShimmerText restrained={restrained} homepage={shimmer === "home"}>
          {content}
        </ShimmerText>
      ) : (
        content
      )}
    </Heading>
  );
}
