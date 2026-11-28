"use client";

import { motion, useInView } from "motion/react";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { ShimmerText } from "@/components/ui/shimmer-text";
import { TextRotate, textRotateSpring } from "@/components/ui/text-rotate";
import styles from "./membership-intro.module.css";

const pathways = [
  {
    name: "Core",
    description:
      "Contribute to Astra's development through its operations, events and student-led initiatives, working alongside students from across Qatar.",
  },
  {
    name: "Fellow",
    description:
      "Pursue independent ideas, develop your interests and connect with a wider network of young innovators.",
  },
] as const;
const localReview = process.env.NODE_ENV === "development";
const reducedMotionQuery = "(prefers-reduced-motion: reduce)";

function subscribeToMotionPreference(onChange: () => void) {
  if (localReview) return () => {};
  const media = window.matchMedia(reducedMotionQuery);
  media.addEventListener("change", onChange);
  return () => media.removeEventListener("change", onChange);
}

function getMotionPreference() {
  return !localReview && window.matchMedia(reducedMotionQuery).matches;
}

export function MembershipIntro() {
  const [{ activeIndex, enter }, setPathway] = useState<{
    activeIndex: 0 | 1;
    enter: boolean;
  }>({ activeIndex: 0, enter: false });
  const [exiting, setExiting] = useState(false);
  const [canRotate, setCanRotate] = useState(false);
  const [widths, setWidths] = useState<number[]>([]);
  const rotationRef = useRef<HTMLDivElement>(null);
  const measureRef = useRef<HTMLSpanElement>(null);
  const playbackRef = useRef(false);
  const inView = useInView(rotationRef);
  const reducedMotion = useSyncExternalStore(
    subscribeToMotionPreference,
    getMotionPreference,
    () => false,
  );
  const motionEnabled = !reducedMotion;
  const active = pathways[activeIndex];
  // Fellow's rightmost letters enter first, so open the highlight while Core exits.
  const widthIndex = exiting && activeIndex === 0 ? 1 : activeIndex;

  useEffect(() => {
    const measure = measureRef.current;
    if (!measure || typeof ResizeObserver === "undefined") return;
    const words = Array.from(measure.children);
    const observer = new ResizeObserver(() => {
      const fontSize = Number.parseFloat(getComputedStyle(measure).fontSize);
      const measured = words.map(
        (word) => Number.parseFloat(getComputedStyle(word).width) / fontSize,
      );
      setWidths((previous) =>
        measured.every((width, index) => width === previous[index])
          ? previous
          : measured,
      );
    });
    for (const word of words) observer.observe(word);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    let timer: number | undefined;

    function updateTimer() {
      window.clearInterval(timer);
      const canPlay = motionEnabled && inView && !document.hidden;
      playbackRef.current = canPlay;
      setCanRotate(canPlay);
      if (canPlay) {
        timer = window.setInterval(() => setExiting(true), 4000);
      } else {
        setExiting(false);
        setPathway((current) =>
          current.enter ? { ...current, enter: false } : current,
        );
      }
    }

    updateTimer();
    document.addEventListener("visibilitychange", updateTimer);
    return () => {
      playbackRef.current = false;
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", updateTimer);
    };
  }, [inView, motionEnabled]);

  function advancePathway() {
    if (!playbackRef.current) return;
    // An exit can finish before IntersectionObserver delivers a scroll update.
    const bounds = rotationRef.current?.getBoundingClientRect();
    if (!bounds || bounds.bottom <= 0 || bounds.top >= window.innerHeight) {
      setExiting(false);
      return;
    }
    setPathway(({ activeIndex }) => ({
      activeIndex: activeIndex === 0 ? 1 : 0,
      enter: true,
    }));
    setExiting(false);
  }

  return (
    <section className={styles.intro} aria-labelledby="membership-intro-title">
      <h1 className={styles.heading} id="membership-intro-title">
        <ShimmerText restrained disabled={!motionEnabled}>
          <span data-shimmer-text="">One network.</span>{" "}
          <span data-shimmer-text="">Two ways to be part of it.</span>
        </ShimmerText>
      </h1>
      <div
        ref={rotationRef}
        aria-hidden="true"
        data-static={!motionEnabled}
        data-testid="idea-membership-rotation"
      >
        <p
          className={`display ${styles.title}`}
          data-testid="idea-membership-title"
        >
          <span>Astra</span>
          <span ref={measureRef} className={styles.measure}>
            {pathways.map(({ name }) => (
              <span key={name} className={styles.highlight}>
                {name}
              </span>
            ))}
          </span>
          <motion.span
            className={styles.highlight}
            data-testid="idea-membership-highlight"
            initial={false}
            animate={{
              width: widths[widthIndex]
                ? `${widths[widthIndex]}em`
                : "max-content",
            }}
            transition={motionEnabled ? textRotateSpring : { duration: 0 }}
          >
            {canRotate ? (
              <TextRotate
                text={active.name}
                enter={enter}
                exiting={exiting}
                onExitComplete={advancePathway}
              />
            ) : (
              active.name
            )}
          </motion.span>
        </p>
        <p className={styles.description}>
          {pathways.map(({ name, description }) => (
            <span key={name} data-active={!exiting && name === active.name}>
              {description}
            </span>
          ))}
        </p>
        <div className={styles.progress}>
          {pathways.map(({ name }) => (
            <span
              key={name}
              data-pathway={name}
              data-active={name === active.name}
            />
          ))}
        </div>
      </div>
      <ul className={styles.pathways}>
        {pathways.map(({ name, description }) => (
          <li key={name}>
            Astra {name}. {description}
          </li>
        ))}
      </ul>
    </section>
  );
}
