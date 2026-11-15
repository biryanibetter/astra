"use client";

import { useLayoutEffect } from "react";
import { installScrollReveals } from "@/lib/scroll-reveal";

/** Shared bootstrap ownership only; no scroll state, wrappers, or rendering. */
export function ScrollReveals() {
  useLayoutEffect(() => installScrollReveals(document), []);
  return null;
}
