"use client";

import { useSyncExternalStore } from "react";
import { resolveReducedMotion } from "./motion-policy";

let media: MediaQueryList | undefined;
let reduced = false;
const listeners = new Set<() => void>();

function publish() {
  reduced = resolveReducedMotion(media?.matches ?? false);
  for (const listener of listeners) listener();
}

function initialize() {
  if (media || typeof window === "undefined") return;
  media = window.matchMedia("(prefers-reduced-motion: reduce)");
  media.addEventListener("change", publish);
  publish();
}

export function getReducedMotion() {
  if (typeof window === "undefined") return false;
  initialize();
  return reduced;
}

function subscribeMotionInternal(listener: () => void) {
  if (typeof window === "undefined") {
    return () => {};
  }
  initialize();
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function subscribeReducedMotion(listener: () => void) {
  if (typeof window === "undefined") {
    return () => {};
  }
  initialize();
  let previous = getReducedMotion();
  return subscribeMotionInternal(() => {
    const next = getReducedMotion();
    if (next === previous) return;
    previous = next;
    listener();
  });
}

export function subscribeMotion(listener: () => void) {
  return subscribeMotionInternal(listener);
}

export function useReducedMotion() {
  return useSyncExternalStore(
    subscribeReducedMotion,
    getReducedMotion,
    () => false, // SSR: assume full motion
  );
}
