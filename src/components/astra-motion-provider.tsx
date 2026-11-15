"use client";

import { MotionConfig } from "motion/react";
import type { ReactNode } from "react";

/** One Motion runtime and one scoped provider preserve Astra's motion policy. */
export function AstraMotionProvider({ children }: { children: ReactNode }) {
  return <MotionConfig reducedMotion="never">{children}</MotionConfig>;
}
