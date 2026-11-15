"use client";

import { ArrowLeft, ArrowRight } from "lucide-react";
import { AnimatePresence, motion, useInView } from "motion/react";
import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import { ShinyAction } from "@/components/ui/shiny-button";
import { useSystemReducedMotion } from "@/lib/system-motion-preference";
import styles from "./application-presentation.module.css";

type Track = "core" | "fellow";

const content = {
  core: {
    heading: "Your role in Astra",
    headingPhrases: ["Your role in Astra"],
    description:
      "Bring your ideas to events, projects, technology, media, partnerships, and the school network, and help shape what Astra becomes.",
    slides: [
      {
        title: "Events that bring people together",
        description:
          "Create the moments where new connections and ideas begin.",
        image: "/images/experiences/launch-night.jpg",
        alt: "Students gathered at an evening event",
      },
      {
        title: "Projects built as a team",
        description:
          "Turn a promising thought into something others can explore.",
        image: "/images/experiences/build-learn.jpg",
        alt: "Students collaborating during a hands-on workshop",
      },
      {
        title: "Ideas put into action",
        description: "Help students across Qatar share what they are making.",
        image: "/images/experiences/ideas-action.jpg",
        alt: "A student project showcase",
      },
    ],
  },
  fellow: {
    heading: "Your project at Astra",
    headingPhrases: ["Your project at Astra"],
    description:
      "Bring your independent project, research, or initiative into a community that can help you move it forward.",
    slides: [
      {
        title: "Projects with purpose",
        description: "Shape an early idea into work you can test and share.",
        image: "/images/experiences/ideas-action.jpg",
        alt: "A student project showcase",
      },
      {
        title: "Make, test, learn",
        description: "Build your next step through practical experimentation.",
        image: "/images/experiences/build-learn.jpg",
        alt: "Students collaborating during a hands-on workshop",
      },
      {
        title: "Find a wider perspective",
        description: "Connect your work with new questions and conversations.",
        image: "/images/experiences/conversations.jpg",
        alt: "A speaker sharing ideas with a student audience",
      },
    ],
  },
} satisfies Record<
  Track,
  {
    heading: string;
    headingPhrases: readonly string[];
    description: string;
    slides: readonly Slide[];
  }
>;

type Slide = {
  title: string;
  description: string;
  image: string;
  alt: string;
};

const AUTOPLAY_INTERVAL = 5000;

export function ApplicationIntroduction({
  track,
  onStart,
}: {
  track: Track;
  onStart?: () => void;
}) {
  const [active, setActive] = useState(0);
  const [pageVisible, setPageVisible] = useState(true);
  const [mounted, setMounted] = useState(false);
  const carouselRef = useRef<HTMLElement>(null);
  const timerRef = useRef<number>(0);
  const transitionRef = useRef(false);
  const inView = useInView(carouselRef, { amount: 0.35 });
  const reducedMotion = useSystemReducedMotion();
  const introduction = content[track];
  const slides = introduction.slides;
  const slide = slides[active];
  const imageTransition = reducedMotion
    ? { duration: 0 }
    : { duration: 0.76, ease: [0.22, 1, 0.36, 1] as const };

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const updateVisibility = () => setPageVisible(!document.hidden);
    updateVisibility();
    document.addEventListener("visibilitychange", updateVisibility);
    return () =>
      document.removeEventListener("visibilitychange", updateVisibility);
  }, []);

  const move = useCallback(
    (offset: number) => {
      if (transitionRef.current) return;
      transitionRef.current = true;
      setActive((index) => (index + offset + slides.length) % slides.length);
    },
    [slides.length],
  );

  useEffect(() => {
    if (inView && pageVisible) {
      timerRef.current = window.setTimeout(() => {
        if (transitionRef.current) return;
        transitionRef.current = true;
        setActive((active + 1) % slides.length);
      }, AUTOPLAY_INTERVAL);
    }
    return () => {
      window.clearTimeout(timerRef.current);
      timerRef.current = 0;
    };
  }, [active, inView, pageVisible, slides.length]);

  return (
    <section
      className={`${styles.introduction} application-intro-surface`}
      aria-labelledby="application-intro-title"
    >
      <motion.div
        className={styles.introCopy}
        initial={reducedMotion ? false : { opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: reducedMotion ? 0 : 0.42, ease: "easeOut" }}
      >
        <h2
          id="application-intro-title"
          className={styles.introTitle}
          aria-label={introduction.heading}
        >
          {introduction.heading}
        </h2>
        <p className={styles.introDescription}>{introduction.description}</p>
        {onStart && mounted ? (
          <ShinyAction
            className={`${styles.startButton} pathway-start-button`}
            type="button"
            onClick={onStart}
          >
            Start Application <ArrowRight aria-hidden="true" size={17} />
          </ShinyAction>
        ) : null}
      </motion.div>

      <section
        ref={carouselRef}
        data-reveal="image"
        className={styles.carousel}
        aria-roledescription="carousel"
        aria-label={
          track === "core" ? "Events and projects" : "Fellow projects"
        }
      >
        <div className={styles.carouselStage} aria-live="polite">
          <AnimatePresence
            initial={false}
            onExitComplete={() => {
              transitionRef.current = false;
            }}
          >
            {slide ? (
              <motion.article
                key={slide.title}
                className={styles.slide}
                initial={reducedMotion ? false : { opacity: 0, scale: 1.025 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={
                  reducedMotion ? { opacity: 0 } : { opacity: 0, scale: 1.008 }
                }
                transition={imageTransition}
                aria-label={`${active + 1} of ${slides.length}: ${slide.title}`}
              >
                <div className={styles.slideImage}>
                  <Image
                    src={slide.image}
                    alt={slide.alt}
                    fill
                    sizes="(max-width: 760px) calc(100vw - 36px), 1120px"
                    preload={active === 0}
                    loading={active === 0 ? undefined : "eager"}
                  />
                </div>
              </motion.article>
            ) : null}
          </AnimatePresence>
        </div>
        <div className={styles.imageWarmup} aria-hidden="true">
          {slides.slice(1).map((item) => (
            <Image
              key={item.image}
              src={item.image}
              alt=""
              fill
              sizes="(max-width: 760px) calc(100vw - 36px), 1120px"
              loading="eager"
            />
          ))}
        </div>
        <div className={styles.slideFooter}>
          <div className={styles.captionStage} aria-live="polite">
            <AnimatePresence initial={false}>
              {slide ? (
                <motion.div
                  key={slide.title}
                  className={styles.slideCopy}
                  initial={reducedMotion ? false : { opacity: 0, y: 9 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={reducedMotion ? { opacity: 0 } : { opacity: 0, y: -5 }}
                  transition={
                    reducedMotion
                      ? { duration: 0 }
                      : { duration: 0.42, ease: [0.22, 1, 0.36, 1] }
                  }
                >
                  <h3>{slide.title}</h3>
                  <p>{slide.description}</p>
                </motion.div>
              ) : null}
            </AnimatePresence>
          </div>
          <div className={styles.carouselArrows}>
            <ShinyAction
              className="application-carousel-arrow"
              type="button"
              aria-label="Previous slide"
              onClick={() => move(-1)}
            >
              <ArrowLeft aria-hidden="true" size={17} />
            </ShinyAction>
            <ShinyAction
              className="application-carousel-arrow"
              type="button"
              aria-label="Next slide"
              onClick={() => move(1)}
            >
              <ArrowRight aria-hidden="true" size={17} />
            </ShinyAction>
          </div>
        </div>
      </section>
    </section>
  );
}

export const PathwayIntroduction = ApplicationIntroduction;
