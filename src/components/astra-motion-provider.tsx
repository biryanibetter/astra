"use client";

import { MotionConfig as FramerMotionConfig } from "framer-motion";
import { MotionConfig } from "motion/react";
import type { ReactNode } from "react";

/** Keep both installed Motion runtimes on Astra's explicit site policy.
 * Animations always run regardless of OS preferences; components own their original timings. */
export function AstraMotionProvider({ children }: { children: ReactNode }) {
  return (
    <FramerMotionConfig reducedMotion="never">
      <MotionConfig reducedMotion="never">{children}</MotionConfig>
    </FramerMotionConfig>
  );
}
