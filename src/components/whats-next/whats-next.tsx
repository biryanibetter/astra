"use client";

import { AnimatePresence, motion } from "motion/react";
import Image from "next/image";
import Link from "next/link";
import { useRef, useState } from "react";
import { ScrollReveals } from "@/components/scroll-reveals";
import { WordRevealHeading } from "@/components/ui/word-reveal-heading";
import styles from "./whats-next.module.css";

const phases = [
  {
    number: "01",
    title: "Define the Experience",
    description:
      "We hope to bring ambitious young people from across Qatar together for a first gathering to meet, exchange ideas and imagine what they could build.",
    image: "/images/experiences/build-learn.jpg",
    width: 1400,
    height: 933,
    alt: "Young people collaborating around a table",
  },
  {
    number: "02",
    title: "Design the Program",
    description:
      "We're exploring sessions across technology, AI, business, design and creative work—with practical ways to learn by doing.",
    image: "/images/experiences/ideas-action.jpg",
    width: 1400,
    height: 933,
    alt: "Students gathered in a bright learning space",
  },
  {
    number: "03",
    title: "Gather Collaborators",
    description:
      "Possible speaker conversations could bring students together with founders, creators and professionals to share perspectives and experience.",
    image: "/images/experiences/conversations.jpg",
    width: 1100,
    height: 786,
    alt: "A team working together around a table",
  },
  {
    number: "04",
    title: "Prepare the Launch",
    description:
      "If the community is ready, we'd carefully work through timing, venue, access and the details that could make a first gathering feel welcoming. No date or venue is set.",
    image: "/images/experiences/launch-night.jpg",
    width: 1100,
    height: 734,
    alt: "A crowd celebrating beneath warm lights",
  },
];

const eventCards = [
  {
    number: "01",
    title: "Astra Launch Night",
    description:
      "A proposed first gathering for ambitious young people across Qatar to meet, exchange ideas and imagine what they can build together.",
    detail: "This is an early concept, not a scheduled or confirmed event.",
    image: "launch-night.jpg",
    width: 1100,
    height: 734,
  },
  {
    number: "02",
    title: "Build & Learn",
    description:
      "Possible hands-on sessions across technology, AI, business, design and creative work.",
    detail:
      "The mix of topics and format would be shaped with students and collaborators.",
    image: "build-learn.jpg",
    width: 1400,
    height: 933,
  },
  {
    number: "03",
    title: "Real Conversations",
    description:
      "Proposed speaker discussions with founders, creators and professionals, with space for questions and honest exchange.",
    detail:
      "Speakers and conversations would be developed with the community; nothing is confirmed yet.",
    image: "conversations.jpg",
    width: 1100,
    height: 786,
  },
  {
    number: "04",
    title: "Ideas in Action",
    description:
      "A possible showcase for student projects, new collaborators and ideas ready to take a next step.",
    detail:
      "The projects and ways to collaborate would come from students themselves.",
    image: "ideas-action.jpg",
    width: 1400,
    height: 933,
  },
];

export function WhatsNext() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [expandedCard, setExpandedCard] = useState<string | null>(null);
  const railRef = useRef<HTMLDivElement>(null);

  const activePhase = phases[activeIndex] as (typeof phases)[0];

  // Keep the selected tab visible in the local mobile rail only.
  const scrollTabIntoView = (index: number) => {
    if (!railRef.current) return;
    const tab = railRef.current.querySelector(
      `[data-phase-index="${index}"]`,
    ) as HTMLElement;
    if (tab && window.matchMedia("(max-width: 700px)").matches) {
      const rail = railRef.current;
      const rect = tab.getBoundingClientRect();
      const bounds = rail.getBoundingClientRect();
      const offset =
        rect.left < bounds.left
          ? rect.left - bounds.left
          : Math.max(0, rect.right - bounds.right);
      rail.scrollBy({ left: offset, behavior: "smooth" });
    }
  };

  const handlePhaseSelect = (index: number) => {
    if (index === activeIndex) return;
    setActiveIndex(index);
    scrollTabIntoView(index);
  };

  // Keyboard navigation for phase tabs
  const handleKeyDown = (event: React.KeyboardEvent, index: number) => {
    let nextIndex = index;
    if (event.key === "ArrowRight") {
      event.preventDefault();
      nextIndex = (index + 1) % phases.length;
    } else if (event.key === "ArrowLeft") {
      event.preventDefault();
      nextIndex = (index - 1 + phases.length) % phases.length;
    } else if (event.key === "Home") {
      event.preventDefault();
      nextIndex = 0;
    } else if (event.key === "End") {
      event.preventDefault();
      nextIndex = phases.length - 1;
    } else {
      return;
    }
    handlePhaseSelect(nextIndex);
    // Focus the next tab
    setTimeout(() => {
      const nextTab = railRef.current?.querySelector(
        `[data-phase-index="${nextIndex}"]`,
      ) as HTMLElement;
      nextTab?.focus({ preventScroll: true });
    }, 0);
  };

  return (
    <main id="main" className={`content-page wrap ${styles.page}`}>
      <ScrollReveals />
      <header className={styles.hero}>
        <div>
          <WordRevealHeading
            shimmer
            as="h1"
            className={`${styles.heroTitle} display`}
            text="What's next for ASTRA?"
            mutedFrom={2}
          />
        </div>
      </header>

      <section
        className={styles.timeline}
        aria-label="Event development phases"
      >
        {/* Responsive phase selector rail */}
        <div
          className={styles.rail}
          data-reveal-group=""
          ref={railRef}
          role="tablist"
          aria-label="Event planning stages"
          data-lenis-prevent-horizontal
        >
          {phases.map((phase, index) => (
            <button
              key={phase.number}
              id={`phase-tab-${index}`}
              className={`${styles.tab} ${activeIndex === index ? styles.selected : ""}`}
              type="button"
              role="tab"
              aria-label={`Phase ${phase.number}: ${phase.title}`}
              aria-selected={activeIndex === index}
              aria-controls="phase-panel"
              tabIndex={activeIndex === index ? 0 : -1}
              onClick={() => handlePhaseSelect(index)}
              onKeyDown={(e) => handleKeyDown(e, index)}
              data-phase-index={index}
              data-reveal="fade-up"
            >
              <span className={styles.tabNumber} data-reveal-visual="">
                {phase.number}
              </span>
            </button>
          ))}
        </div>

        {/* Active phase content panel */}
        <div className={styles.feature}>
          <AnimatePresence mode="wait" initial={false}>
            <motion.article
              key={activePhase.number}
              id="phase-panel"
              role="tabpanel"
              aria-labelledby={`phase-tab-${activeIndex}`}
              className={styles.panel}
              initial={{ opacity: 0, x: 18 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -18 }}
              transition={{ duration: 0.32, ease: "easeInOut" }}
            >
              <div className={styles.copy}>
                <span className={`${styles.number} ${styles.largeNumber}`}>
                  {activePhase.number}
                </span>
                <h2>{activePhase.title}</h2>
                <p>{activePhase.description}</p>
                <span className={styles.note}>
                  A direction we're exploring — not a confirmed plan.
                </span>
              </div>
              <div className={styles.photoWrapper}>
                <Image
                  className={styles.photo}
                  src={activePhase.image}
                  alt={activePhase.alt}
                  width={activePhase.width}
                  height={activePhase.height}
                  unoptimized
                  decoding="async"
                />
              </div>
            </motion.article>
          </AnimatePresence>
        </div>
      </section>

      <section
        className={styles.cards}
        aria-label="Experiences we hope to create"
      >
        <div className={styles.cardsHeading} data-reveal="section">
          <h2 className="display" aria-label="Proposed ASTRA event experiences">
            Events that could bring Qatar's innovators together.
          </h2>
        </div>
        <div className={styles.cardsGrid} data-reveal-group="">
          {eventCards.map((card) => {
            const isExpanded = expandedCard === card.title;
            return (
              <button
                className={styles.card}
                data-reveal="image"
                key={card.title}
                type="button"
                aria-expanded={isExpanded}
                onClick={() => setExpandedCard(isExpanded ? null : card.title)}
              >
                <span className={styles.cardImage}>
                  <Image
                    src={`/images/experiences/${card.image}`}
                    alt=""
                    width={card.width}
                    height={card.height}
                    unoptimized
                    loading="lazy"
                    decoding="async"
                  />
                </span>
                <span className={styles.cardCopy} data-reveal-visual="">
                  <span>
                    {card.number} <i aria-hidden="true">·</i> AN IDEA IN
                    PROGRESS
                  </span>
                  <strong>{card.title}</strong>
                  <span className={styles.description}>{card.description}</span>
                  {isExpanded && (
                    <span className={styles.detail}>{card.detail}</span>
                  )}
                  <span className={styles.discover}>
                    {isExpanded ? "Show less" : "Explore the idea"}{" "}
                    <span aria-hidden="true">↗</span>
                  </span>
                </span>
              </button>
            );
          })}
        </div>
      </section>

      <footer className={styles.outro} data-reveal-group="">
        <p data-reveal="fade-up">Want to help shape what comes next?</p>
        <Link className="button" href="/join" data-reveal="cta">
          Get involved <span aria-hidden="true">↗</span>
        </Link>
      </footer>
    </main>
  );
}
