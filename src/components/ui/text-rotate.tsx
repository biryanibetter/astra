"use client";

import {
  type AnimationDefinition,
  motion,
  type Transition,
} from "motion/react";

export const textRotateSpring = {
  type: "spring",
  damping: 30,
  stiffness: 400,
} satisfies Transition;

type TextRotateProps = {
  text: string;
  enter: boolean;
  exiting: boolean;
  onExitComplete: () => void;
};

export function TextRotate({
  text,
  enter,
  exiting,
  onExitComplete,
}: TextRotateProps) {
  const characters = Array.from(text);

  function notifyExit(phase: AnimationDefinition) {
    if (phase === "leave") onExitComplete();
  }

  return (
    <span key={text} className="inline-flex w-max overflow-hidden align-top">
      {characters.map((character, index) => {
        const delay = (characters.length - 1 - index) * 0.025;
        return (
          <motion.span
            // Each character occupies a fixed position within this keyed word.
            // biome-ignore lint/suspicious/noArrayIndexKey: Duplicate letters have different positions.
            key={index}
            className="inline-block"
            initial={enter ? "below" : false}
            animate={exiting ? "leave" : "shown"}
            variants={{
              below: { y: "100%" },
              shown: { y: 0, transition: { ...textRotateSpring, delay } },
              leave: {
                y: "-110%",
                transition: {
                  ...textRotateSpring,
                  // The rest of the spring is outside the clipped word.
                  restDelta: 6,
                  restSpeed: 180,
                  delay,
                },
              },
            }}
            {...(index === 0 ? { onAnimationComplete: notifyExit } : {})}
          >
            {character}
          </motion.span>
        );
      })}
    </span>
  );
}
