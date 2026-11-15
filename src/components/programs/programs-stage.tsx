"use client";

import type { ReactNode, RefObject } from "react";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { CreationArtwork } from "@/components/home/creation-artwork";
import SpotlightCard from "@/components/ui/spotlight-card";
import { WordRevealHeading } from "@/components/ui/word-reveal-heading";
import styles from "./programs-stage.module.css";
import {
  isLastChapterDisplayCommitted,
  type ProgramsBoundaryState,
  type ProgramsStageState,
  useProgramsStageController,
} from "./use-programs-stage-controller";

export type ProgramsStageItem = {
  id: string;
  number: string;
  title: string;
  description: string;
  eyebrow?: string;
  short?: string;
  image: string | { hero: string; alt?: string };
};

type ProgramsStageProps = {
  programs: readonly ProgramsStageItem[];
  showSpotlightCard?: boolean;
};

const imageSource = (image: ProgramsStageItem["image"]) =>
  typeof image === "string" ? image : image.hero;

const imageAlt = (image: ProgramsStageItem["image"], title: string) =>
  typeof image === "string" ? title : (image.alt ?? title);

export default function ProgramsStage({
  programs,
  showSpotlightCard = true,
}: ProgramsStageProps) {
  const [readySources, setReadySources] = useState<ReadonlySet<string>>(
    () => new Set(),
  );
  const [displayedIndex, setDisplayedIndex] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [isRevealing, setIsRevealing] = useState(false);
  const revealTimer = useRef<number | null>(null);
  const revealFrame = useRef<number | null>(null);
  const finalSource = programs[3] ? imageSource(programs[3].image) : null;
  const canReleaseAfterLast = isLastChapterDisplayCommitted(
    displayedIndex,
    finalSource === null || readySources.has(finalSource),
    isTransitioning,
    isRevealing,
  );
  const controller = useProgramsStageController(
    programs.length,
    canReleaseAfterLast,
  );
  const current = programs[displayedIndex] ?? programs[0];

  useEffect(() => {
    const sources = new Set(
      programs.map((program) => imageSource(program.image)),
    );
    const preloads: HTMLImageElement[] = [];
    for (const source of sources) {
      const image = new window.Image();
      image.onload = () => {
        setReadySources((ready) => new Set(ready).add(source));
      };
      image.onerror = () => {
        // Keep the currently displayed chapter if its replacement cannot load.
      };
      image.src = source;
      if (image.complete && image.naturalWidth > 0)
        setReadySources((ready) => new Set(ready).add(source));
      preloads.push(image);
    }
    return () => {
      for (const image of preloads) {
        image.onload = null;
        image.onerror = null;
      }
    };
  }, [programs]);

  useLayoutEffect(() => {
    const clearReveal = () => {
      if (revealTimer.current !== null) {
        window.clearTimeout(revealTimer.current);
        revealTimer.current = null;
      }
      if (revealFrame.current !== null) {
        cancelAnimationFrame(revealFrame.current);
        revealFrame.current = null;
      }
    };
    const next = programs[controller.activeIndex];
    if (!next || !readySources.has(imageSource(next.image))) {
      clearReveal();
      setIsRevealing(false);
      setIsTransitioning(false);
      return;
    }

    if (controller.activeIndex === displayedIndex) return;

    clearReveal();
    setIsRevealing(false);
    setIsTransitioning(true);
    const targetIndex = controller.activeIndex;
    let swapCommitted = false;
    const timer = window.setTimeout(() => {
      setDisplayedIndex(targetIndex);
      swapCommitted = true;
      revealFrame.current = requestAnimationFrame(() => {
        revealFrame.current = null;
        setIsTransitioning(false);
        setIsRevealing(true);
        revealTimer.current = window.setTimeout(() => {
          revealTimer.current = null;
          setIsRevealing(false);
        }, 180);
      });
    }, 110);
    return () => {
      window.clearTimeout(timer);
      if (!swapCommitted && revealFrame.current !== null) {
        cancelAnimationFrame(revealFrame.current);
        revealFrame.current = null;
      }
    };
  }, [controller.activeIndex, displayedIndex, programs, readySources]);

  useEffect(
    () => () => {
      if (revealTimer.current !== null)
        window.clearTimeout(revealTimer.current);
      if (revealFrame.current !== null)
        cancelAnimationFrame(revealFrame.current);
    },
    [],
  );

  if (!current) return null;

  return (
    <div className={styles.page}>
      <main id="main" className={styles.main}>
        <ProgramsExperienceSection
          programs={programs}
          stageRef={controller.stageRef}
          activeIndex={displayedIndex}
          stageState={controller.state}
          boundary={controller.boundary}
          onSelect={controller.goTo}
          readySources={readySources}
          isTransitioning={isTransitioning}
        />
        {showSpotlightCard !== false && <SpotlightCard />}
      </main>
    </div>
  );
}

function ProgramsExperienceSection({
  programs,
  stageRef,
  activeIndex,
  stageState,
  boundary,
  onSelect,
  readySources,
  isTransitioning,
}: {
  programs: readonly ProgramsStageItem[];
  stageRef: RefObject<HTMLElement | null>;
  activeIndex: number;
  stageState: ProgramsStageState;
  boundary: ProgramsBoundaryState;
  onSelect: (index: number) => void;
  readySources: ReadonlySet<string>;
  isTransitioning: boolean;
}) {
  const current = programs[activeIndex] ?? programs[0];
  if (!current) return null;

  return (
    <section
      ref={stageRef}
      className={styles.track}
      data-programs-stage
      data-programs-state={stageState}
      data-programs-boundary={boundary}
      data-testid="programs-scroll-track"
      aria-label="Explore interest areas"
      data-lenis-prevent={stageState === "LOCKED" || undefined}
    >
      <ProgramsStageViewport>
        <ProgramsHeading />
        <div
          className={styles.content}
          style={{
            opacity: isTransitioning ? 0 : 1,
            transition: "opacity 180ms ease",
          }}
        >
          <ProgramsTimeline
            programs={programs}
            activeIndex={activeIndex}
            onSelect={onSelect}
          />
          <ProgramsGallery
            current={current}
            readySources={readySources}
            onSelect={onSelect}
            activeIndex={activeIndex}
            count={programs.length}
          />
        </div>
      </ProgramsStageViewport>
    </section>
  );
}

function ProgramsStageViewport({ children }: { children: ReactNode }) {
  return (
    <div
      className={styles.sticky}
      data-programs-sticky
      data-testid="programs-sticky-stage"
    >
      <div className={styles.artwork} aria-hidden="true">
        <CreationArtwork />
      </div>
      <div className={styles.shell} data-programs-composition>
        {children}
      </div>
    </div>
  );
}

function ProgramsHeading() {
  return (
    <header className={styles.heading} data-testid="programs-heading">
      <div className={styles.headingMain}>
        <WordRevealHeading
          shimmer
          as="h1"
          text="Explore what you could build."
        />
      </div>
    </header>
  );
}

function ProgramsTimeline({
  programs,
  activeIndex,
  onSelect,
}: {
  programs: readonly ProgramsStageItem[];
  activeIndex: number;
  onSelect: (index: number) => void;
}) {
  return (
    <nav
      className={styles.timeline}
      data-reveal-group=""
      aria-label="Explore interest areas"
      data-testid="programs-timeline"
      data-lenis-prevent-horizontal
    >
      {programs.map((program, index) => (
        <button
          type="button"
          key={program.id}
          className={`${styles.chapter} ${index === activeIndex ? styles.active : ""}`}
          data-reveal="fade-up"
          onClick={() => onSelect(index)}
          aria-current={index === activeIndex ? "step" : undefined}
        >
          <span className={styles.number}>{program.number}</span>
          <span className={styles.chapterCopy} data-reveal-visual="">
            {program.eyebrow && (
              <span className={styles.eyebrow}>{program.eyebrow}</span>
            )}
            <strong>{program.title}</strong>
          </span>
        </button>
      ))}
    </nav>
  );
}

function ProgramsGallery({
  current,
  readySources,
  onSelect,
  activeIndex,
  count,
}: {
  current: ProgramsStageItem;
  readySources: ReadonlySet<string>;
  onSelect: (index: number) => void;
  activeIndex: number;
  count: number;
}) {
  return (
    <div className={styles.gallery} aria-live="polite">
      <div
        className={styles.frame}
        data-programs-gallery
        data-testid="programs-gallery"
      >
        {/* biome-ignore lint/performance/noImgElement: accepts caller-owned local or remote image sources */}
        <img
          className={styles.photo}
          src={imageSource(current.image)}
          alt={imageAlt(current.image, current.title)}
          data-loaded={readySources.has(imageSource(current.image))}
        />
        <div className={styles.shade} aria-hidden="true" />
        <div className={styles.caption}>
          <h2>{current.title}</h2>
          <p>{current.description}</p>
        </div>
      </div>
      <div className={styles.galleryControls}>
        <button
          type="button"
          aria-label="Previous interest"
          onClick={() => onSelect((activeIndex + count - 1) % count)}
        >
          ←
        </button>
        <button
          type="button"
          aria-label="Next interest"
          onClick={() => onSelect((activeIndex + 1) % count)}
        >
          →
        </button>
      </div>
    </div>
  );
}
