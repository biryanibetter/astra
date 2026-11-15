"use client";

/** Compatibility export for existing application and shimmer consumers.
 * All interactions use the same site policy, never a separate OS override.
 * A future explicit motion control belongs in that shared policy. */
export { useReducedMotion as useSystemReducedMotion } from "./motion-preference";
