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
    heading: "Be part of the team.",
    description:
      "Contribute your skills, perspectives and ideas to the development of Astra, working alongside students who share the responsibility of building the organization.",
    slides: [
      {
        title: "Behind the scenes.",
        description:
          "Help plan, coordinate and deliver the initiatives that bring Astra to life.",
        image: "/images/home-stock/business.webp",
        alt: "Students discussing a project together",
      },
      {
        title: "From concept to reality.",
        description:
          "Develop new ideas and contribute to projects from their earliest stages through execution.",
        image: "/images/experiences/build-learn.jpg",
        alt: "Students collaborating during a hands-on workshop",
      },
      {
        title: "Building connections.",
        description:
          "Help strengthen the school network and develop relationships across the wider community.",
        image: "/images/home-stock/faq-gathering.webp",
        alt: "Students in conversation",
      },
      {
        title: "Make your skills count.",
        description:
          "Contribute through technology, design, media, communications and other areas of expertise.",
        image: "/images/home-stock/technology.webp",
        alt: "Students working on robotics together",
      },
    ],
  },
  fellow: {
    heading: "Your project at Astra.",
    description:
      "Develop your own ideas, research, initiatives and creative work with the support of a wider student network.",
    slides: [
      {
        title: "Start with an idea.",
        description:
          "Bring forward an idea, concept or early project you want to explore and develop further.",
        image: "/images/home-stock/faq-teamwork.webp",
        alt: "Students working together on an early STEM project",
      },
      {
        title: "Go deeper.",
        description:
          "Pursue research questions, investigations and areas of curiosity that deserve more time, structure and focus.",
        image: "/images/home-stock/science.webp",
        alt: "Students working in a science laboratory",
      },
      {
        title: "Build independently.",
        description:
          "Develop ventures, initiatives or long-term projects that can grow beyond a single competition or event.",
        image: "/images/home-stock/design.webp",
        alt: "Students developing a creative design project",
      },
      {
        title: "Take your work further.",
        description:
          "Use your skills and ambition to create work that contributes to your school, your community and the wider student landscape.",
        image: "/images/home-stock/showcases.webp",
        alt: "A student presenting research at a science fair",
      },
    ],
  },
} satisfies Record<
  Track,
  {
    heading: string;
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
        aria-label={track === "core" ? "Core contributions" : "Fellow projects"}
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
