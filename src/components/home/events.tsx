"use client";

import type { CSSProperties } from "react";
import { Fragment, useCallback, useEffect, useRef, useState } from "react";
import { WordRevealHeading } from "@/components/ui/word-reveal-heading";
import styles from "./events.module.css";

const experiences = [
  {
    id: "gatherings",
    title: "Events & Gatherings",
    category: "Flagship Experiences",
    description:
      "Bringing students across schools together through shared experiences.",
    detail:
      "From youth festivals to cross-school gatherings, Astra aims to organize experiences where students can discover new interests, exchange perspectives and form meaningful connections beyond their schools.",
    image: "/images/home-stock/gatherings.webp",
  },
  {
    id: "workshops",
    title: "Workshops & Hackathons",
    category: "Hands-on Experiences",
    description:
      "Collaborative challenges that bring different skills and ideas together.",
    detail:
      "Through interactive workshops, hackathons and team-based challenges, Astra aims to encourage students to experiment, solve problems and develop ideas alongside peers from different disciplines.",
    image: "/images/experiences/build-learn.jpg",
  },
  {
    id: "conversations",
    title: "Real Conversations",
    category: "Speaker Sessions",
    description:
      "Conversations with founders, researchers, industry leaders and creators.",
    detail:
      "An opportunity to engage with people from different professional backgrounds, ask meaningful questions and gain perspectives that extend beyond conventional classroom learning.",
    image: "/images/experiences/conversations.jpg",
  },
  {
    id: "showcases",
    title: "Innovation Showcases",
    category: "Exhibitions & Competitions",
    description:
      "A platform for student research, inventions, projects and emerging ideas.",
    detail:
      "Astra aims to develop exhibitions and competitions where students can present their work, demonstrate their ideas, exchange constructive feedback and engage with a wider community of innovators.",
    image: "/images/home-stock/showcases.webp",
  },
].map((item) => ({ ...item, detailWords: item.detail.split(" ") }));

export function EventsTimeline() {
  const [active, setActive] = useState<number | null>(null);
  const cardPreviews = useRef<(HTMLDivElement | null)[]>([]);
  const railRef = useRef<HTMLDivElement>(null);
  const activeRef = useRef<number | null>(null);
  const selection = useRef<number | null>(null);
  const lastPointer = useRef<{ x: number; y: number } | null>(null);
  const touchStart = useRef<{ x: number; y: number } | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setReady(true);
  }, []);

  const measureCopies = useCallback(() => {
    const rail = railRef.current;
    if (!rail) return;
    for (let index = 0; index < experiences.length; index++) {
      const preview = cardPreviews.current[index];
      const copy = preview?.querySelector<HTMLElement>(`.${styles.cardCopy}`);
      if (copy && preview) {
        // Cache both endpoints on container/font changes, never on hover.
        // Only reserve the wrapped title height in the collapsed layout.
        const desktop = window.innerWidth > 1000;
        const defaultWidth = desktop
          ? (rail.clientWidth - 36) / 4 - 40
          : preview.clientWidth - (window.innerWidth <= 700 ? 36 : 40);
        const width = desktop
          ? Math.min(440, ((rail.clientWidth - 36) * 3.6) / 6.6 - 40)
          : defaultWidth;
        const measurement = copy.cloneNode(true) as HTMLElement;
        Object.assign(measurement.style, {
          position: "absolute",
          width: `${defaultWidth}px`,
          visibility: "hidden",
          transition: "none",
          pointerEvents: "none",
        });
        measurement.style.setProperty("--copy-title-height", "0px");
        measurement.setAttribute("aria-hidden", "true");
        // Keep the same ancestor selectors/font metrics as the visible copy.
        copy.after(measurement);
        const titleHeight =
          measurement.querySelector("strong")?.getBoundingClientRect().height ??
          0;
        measurement.style.width = `${width}px`;
        const lift = Math.max(
          0,
          measurement.getBoundingClientRect().height - 116,
        );
        measurement.remove();
        preview.style.setProperty("--copy-title-height", `${titleHeight}px`);
        preview.style.setProperty("--copy-lift", `${lift}px`);
      }
    }
  }, []);

  useEffect(() => {
    const rail = railRef.current;
    if (!rail) return;
    let lastSize = "";
    const update = (force = false) => {
      const size = `${rail.clientWidth}:${rail.clientHeight}`;
      if (!force && size === lastSize) return;
      lastSize = size;
      measureCopies();
    };
    update();
    const observer = new ResizeObserver(() => update());
    observer.observe(rail);
    let disposed = false;
    void document.fonts.ready.then(() => {
      if (!disposed) update(true);
    });
    return () => {
      disposed = true;
      observer.disconnect();
    };
  }, [measureCopies]);

  const activate = useCallback((index: number | null) => {
    if (activeRef.current === index) return;
    activeRef.current = index;
    setActive(index);
  }, []);

  function select(index: number | null) {
    selection.current = index;
    activate(index);
  }

  useEffect(() => {
    const clearHover = () => {
      lastPointer.current = null;
      touchStart.current = null;
      activate(selection.current);
    };
    const onVisibilityChange = () => {
      if (document.hidden) clearHover();
    };
    window.addEventListener("blur", clearHover);
    document.addEventListener("visibilitychange", onVisibilityChange);
    return () => {
      window.removeEventListener("blur", clearHover);
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, [activate]);

  return (
    <section
      id="events"
      className={styles.section}
      aria-labelledby="events-heading"
      tabIndex={-1}
    >
      <div className={styles.heading}>
        <div>
          <WordRevealHeading
            shimmer="home"
            as="h2"
            id="events-heading"
            className={`${styles.title} display`}
            text="Creating opportunities. Connecting possibilities."
            breakAfter={2}
            breakClassName={styles.desktopBreak}
          />
          <p className={styles.intro} data-reveal="fade-up">
            From cross-school gatherings to collaborative projects and
            conversations, Astra aims to create opportunities for students to
            connect, contribute and pursue their interests together.
          </p>
        </div>
      </div>
      {/* biome-ignore lint/a11y/noStaticElementInteractions: The rail tracks pointer intent and focus leaving child previews; it has no click action. */}
      <div
        className={styles.cards}
        data-reveal-group=""
        ref={railRef}
        data-expanded={active !== null}
        data-ready={ready}
        data-lenis-prevent-horizontal
        onPointerMove={(event) => {
          if (
            event.pointerType === "touch" ||
            document.hidden ||
            !document.hasFocus() ||
            window.innerWidth <= 1000 ||
            !window.matchMedia("(hover: hover)").matches
          )
            return;
          const previous = lastPointer.current;
          if (previous?.x === event.clientX && previous.y === event.clientY)
            return;
          lastPointer.current = { x: event.clientX, y: event.clientY };
          const card =
            event.target instanceof Element
              ? event.target.closest<HTMLElement>("[data-experience-index]")
              : null;
          if (!card || !event.currentTarget.contains(card)) return;
          const index = Number(card.dataset.experienceIndex);
          if (activeRef.current !== index) activate(index);
        }}
        onPointerLeave={(event) => {
          if (event.pointerType === "touch") return;
          const bounds = event.currentTarget.getBoundingClientRect();
          if (
            event.clientX >= bounds.left &&
            event.clientX <= bounds.right &&
            event.clientY >= bounds.top &&
            event.clientY <= bounds.bottom
          )
            return;
          lastPointer.current = null;
          activate(selection.current);
        }}
        onBlur={(event) => {
          if (
            event.relatedTarget &&
            !event.currentTarget.contains(event.relatedTarget)
          )
            select(null);
        }}
      >
        {experiences.map((item, index) => {
          const isActive = index === active;

          return (
            <article
              key={item.id}
              className={styles.card}
              data-reveal="fade-up"
              data-active={isActive}
              data-experience-index={index}
              style={
                {
                  "--card-image": `url("${item.image}")`,
                } as CSSProperties
              }
            >
              <span className={styles.number} data-experience-number>
                <span>0{index + 1}</span>{" "}
                <span className={styles.numberLabel} data-experience-label>
                  {item.category}
                </span>
              </span>
              {/* biome-ignore lint/a11y/useSemanticElements: Editorial reading group, not form controls. */}
              <div
                ref={(node) => {
                  cardPreviews.current[index] = node;
                }}
                className={styles.cardButton}
                role="group"
                aria-label={item.title}
                // biome-ignore lint/a11y/noNoninteractiveTabindex: Keyboard-accessible editorial preview.
                tabIndex={0}
                onFocus={(event) => {
                  if (
                    !touchStart.current &&
                    event.currentTarget.matches(":focus-visible")
                  )
                    select(index);
                }}
                onPointerDown={(event) => {
                  if (event.pointerType !== "mouse")
                    touchStart.current = { x: event.clientX, y: event.clientY };
                }}
                onClick={(event) => {
                  const start = touchStart.current;
                  touchStart.current = null;
                  if (
                    start &&
                    Math.hypot(
                      event.clientX - start.x,
                      event.clientY - start.y,
                    ) < 12
                  ) {
                    select(selection.current === index ? null : index);
                  }
                }}
                onPointerCancel={() => {
                  touchStart.current = null;
                }}
                onKeyDown={(event) => {
                  if (["Escape", "Enter", " "].includes(event.key)) {
                    event.preventDefault();
                    select(
                      event.key === "Escape" || activeRef.current === index
                        ? null
                        : index,
                    );
                    return;
                  }
                  if (
                    !["ArrowLeft", "ArrowRight", "Home", "End"].includes(
                      event.key,
                    )
                  )
                    return;
                  event.preventDefault();
                  const next =
                    event.key === "Home"
                      ? 0
                      : event.key === "End"
                        ? experiences.length - 1
                        : (index +
                            (event.key === "ArrowRight" ? 1 : -1) +
                            experiences.length) %
                          experiences.length;
                  select(next);
                  cardPreviews.current[next]?.focus();
                }}
              >
                <div className={styles.cardBottom} data-experience-bottom>
                  <div className={styles.cardCopy}>
                    <div className={styles.copyFrame} data-reveal-visual="">
                      <strong>{item.title}</strong>
                      <span className={styles.introCopy} data-experience-intro>
                        {item.description}
                      </span>
                    </div>
                    <span
                      className={styles.description}
                      data-experience-detail
                      aria-hidden={!isActive}
                    >
                      {item.detailWords.map((word, wordIndex) => (
                        <Fragment
                          // biome-ignore lint/suspicious/noArrayIndexKey: Static words never reorder.
                          key={wordIndex}
                        >
                          {wordIndex > 0 ? " " : null}
                          <span
                            style={
                              {
                                "--word-progress":
                                  wordIndex / (item.detailWords.length - 1),
                              } as CSSProperties
                            }
                          >
                            {word}
                          </span>
                        </Fragment>
                      ))}
                    </span>
                  </div>
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
