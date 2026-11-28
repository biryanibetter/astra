"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import styles from "./shimmer-text.module.css";

type Variant =
  | "default"
  | "secondary"
  | "destructive"
  | "red"
  | "blue"
  | "green"
  | "yellow"
  | "purple"
  | "pink"
  | "orange"
  | "cyan"
  | "indigo"
  | "violet"
  | "rose"
  | "amber"
  | "lime"
  | "emerald"
  | "sky"
  | "slate"
  | "fuchsia";

interface ShimmerTextProps {
  children: React.ReactNode;
  className?: string;
  variant?: Variant;
  duration?: number;
  delay?: number;
  spread?: number;
  repeatDelay?: number;
  restrained?: boolean;
  homepage?: boolean;
  disabled?: boolean;
}

const variantMap: Record<Variant, string> = {
  default: "",
  secondary: "text-secondary-foreground",
  destructive: "text-destructive dark:text-destructive-foreground",
  red: "text-red-600 dark:text-red-400",
  blue: "text-blue-600 dark:text-blue-400",
  green: "text-green-600 dark:text-green-400",
  yellow: "text-yellow-600 dark:text-yellow-400",
  purple: "text-purple-600 dark:text-purple-400",
  pink: "text-pink-600 dark:text-pink-400",
  orange: "text-orange-600 dark:text-orange-400",
  cyan: "text-cyan-600 dark:text-cyan-400",
  indigo: "text-indigo-600 dark:text-indigo-400",
  violet: "text-violet-600 dark:text-violet-400",
  rose: "text-rose-600 dark:text-rose-400",
  amber: "text-amber-600 dark:text-amber-400",
  lime: "text-lime-600 dark:text-lime-400",
  emerald: "text-emerald-600 dark:text-emerald-400",
  sky: "text-sky-600 dark:text-sky-400",
  slate: "text-slate-600 dark:text-slate-400",
  fuchsia: "text-fuchsia-600 dark:text-fuchsia-400",
};

/** Clipped, currentColor-backed native gradient, adapted for existing
 * animated headings. One inherited timeline paints all fragments in heading
 * coordinates; it never owns their opacity, transforms, color, or text state. */
export function ShimmerText({
  children,
  className,
  variant = "default",
  duration,
  delay = 0.5,
  spread,
  repeatDelay = 0.8,
  restrained = false,
  homepage = false,
  disabled = false,
}: ShimmerTextProps) {
  const root = useRef<HTMLSpanElement>(null);
  const [ready, setReady] = useState(false);
  const [active, setActive] = useState(false);

  useEffect(() => {
    const element = root.current;
    // display:contents adds no line box, clipping boundary, or layout wrapper.
    const heading = element?.parentElement;
    if (disabled || !element || !heading) return;
    let disposed = false;
    const measure = () => {
      if (disposed) return;
      const bounds = heading.getBoundingClientRect();
      // Ancestor cinematic scale is not part of a background's CSS coordinate
      // system. Normalize once so scrolling cannot desynchronize the sweep.
      const width = Number.parseFloat(getComputedStyle(heading).width);
      const scale = bounds.width / width || 1;
      const fragments = Array.from(
        element.querySelectorAll<HTMLElement>(
          "[data-shimmer-text], .typewriter-text",
        ),
        (fragment) => ({
          fragment,
          offset: (fragment.getBoundingClientRect().left - bounds.left) / scale,
        }),
      );
      element.style.setProperty("--shimmer-width", `${width}px`);
      for (const { fragment, offset } of fragments) {
        fragment.style.setProperty("--shimmer-offset", `${offset}px`);
      }
      setReady(true);
    };
    measure();
    const resize = new ResizeObserver(measure);
    resize.observe(heading);
    // Font loading can change word positions without changing heading bounds.
    void document.fonts.ready.then(measure);
    return () => {
      disposed = true;
      resize.disconnect();
    };
  }, [disabled]);

  const start = homepage ? 0 : -1;
  const end = homepage ? 1 : 2;
  useEffect(() => {
    const element = root.current;
    const heading = element?.parentElement;
    if (disabled || !ready || !element || !heading) return;
    // Keep one playback clock. Offscreen custom-property writes still invalidate
    // inherited word styles/layout in GX, even though no text is visible.
    // Pause/play preserves the sweep phase and never remounts the typewriter.
    if (!element.animate) return;
    const sweep = duration ?? (homepage ? 5.6 : 4.8);
    const period = sweep + repeatDelay;
    // A registered numeric property gives the browser one interpolated clock.
    // No MotionValue subscription or inherited style write on every JS frame.
    const controls = element.animate(
      [
        { "--shimmer-progress": start, offset: 0 },
        { "--shimmer-progress": end, offset: sweep / period },
        { "--shimmer-progress": end, offset: 1 },
      ],
      {
        duration: period * 1000,
        delay: delay * 1000,
        iterations: Infinity,
        easing: "linear",
        fill: "both",
      },
    );
    let visible = typeof IntersectionObserver === "undefined";
    const sync = () => {
      const running = visible && !document.hidden;
      if (running) controls.play();
      else controls.pause();
      setActive(running);
    };
    const observer =
      typeof IntersectionObserver === "undefined"
        ? null
        : new IntersectionObserver(([entry]) => {
            visible = entry?.isIntersecting ?? false;
            sync();
          });
    observer?.observe(heading);
    document.addEventListener("visibilitychange", sync);
    sync();
    return () => {
      observer?.disconnect();
      document.removeEventListener("visibilitychange", sync);
      controls.cancel();
    };
  }, [disabled, ready, start, end, duration, homepage, delay, repeatDelay]);

  return (
    <span
      ref={root}
      className={cn(styles.root, variantMap[variant], className)}
      data-shimmer=""
      data-shimmer-ready={!disabled && ready}
      data-shimmer-active={!disabled && active}
      data-shimmer-restrained={restrained}
      data-shimmer-home={homepage}
      style={
        {
          "--shimmer-spread": (spread ?? (homepage ? 24 : 50)) / 100,
          "--shimmer-progress": start,
        } as React.CSSProperties
      }
    >
      {typeof children === "string" ? (
        <span data-shimmer-text="">{children}</span>
      ) : (
        children
      )}
    </span>
  );
}

export default ShimmerText;
