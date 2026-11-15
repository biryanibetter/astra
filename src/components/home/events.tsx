"use client";

import type { CSSProperties } from "react";
import { useCallback, useEffect, useRef, useState } from "react";
import { WordRevealHeading } from "@/components/ui/word-reveal-heading";
import styles from "./events.module.css";

const experiences = [
  {
    title: "Astra Launch Night",
    category: "Flagship Event",
    description:
      "A first gathering bringing ambitious young people across Qatar together.",
    detail:
      "A welcoming first gathering for ambitious young people to meet one another, discover Astra, and imagine what they could build together. This experience is a concept and is not scheduled.",
    image: "/images/experiences/launch-night.jpg",
  },
  {
    title: "Build & Learn",
    category: "Workshops",
    description:
      "Hands-on experiences in technology, AI, business, design and more.",
    detail:
      "Practical, collaborative workshop concepts spanning technology, AI, business, design and more. Topics and formats are still in development.",
    image: "/images/experiences/build-learn.jpg",
  },
  {
    title: "Real Conversations",
    category: "Speaker Sessions",
    description: "Conversations with founders, industry leaders and creators.",
    detail:
      "A proposed series of thoughtful conversations with founders, industry leaders and creators. No speakers or dates have been confirmed.",
    image: "/images/experiences/conversations.jpg",
  },
  {
    title: "Ideas in Action",
    category: "Student Showcase",
    description: "Student projects, teams and ideas from across Qatar.",
    detail:
      "A concept for celebrating student projects, teams and ideas from across Qatar. Participation and event details will be shared when confirmed.",
    image: "/images/experiences/ideas-action.jpg",
  },
] as const;

export function EventsTimeline() {
  const [active, setActive] = useState<number | null>(null);
  const cardPreviews = useRef<(HTMLDivElement | null)[]>([]);
  const railRef = useRef<HTMLDivElement>(null);
  const activeRef = useRef<number | null>(null);
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
        // Cache both endpoints on real container/font changes, never on hover
        // or while the individual cards are resizing. Keep the title line box
        // stable so the primary description cannot jump when its text reflows.
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
        measurement.style.setProperty(
          "--copy-title-height",
          `${titleHeight}px`,
        );
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

  function activate(index: number | null) {
    if (activeRef.current === index) return;
    activeRef.current = index;
    setActive(index);
  }

  // Split detail text into words for word-by-word reveal
  const getDetailWords = (text: string) => text.split(" ");

  return (
    <section
      id="events"
      className={styles.section}
      aria-labelledby="events-heading"
    >
      <div className={styles.heading}>
        <div>
          <WordRevealHeading
            shimmer="home"
            as="h2"
            id="events-heading"
            className={`${styles.title} display`}
            text="Our experiences that bring Qatar's innovators together."
            breakAfter={3}
            breakClassName={styles.desktopBreak}
          />
          <p className={styles.intro} data-reveal="fade-up">
            From large-scale events to intimate workshops, Astra creates
            experiences where ambitious students meet, learn and build.
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
          const focusedElement = document.activeElement;
          if (
            focusedElement instanceof HTMLElement &&
            railRef.current?.contains(focusedElement) &&
            focusedElement.matches(":focus-visible")
          )
            return;
          lastPointer.current = null;
          activate(null);
        }}
        onBlur={(event) => {
          if (!event.currentTarget.contains(event.relatedTarget))
            activate(null);
        }}
      >
        {experiences.map((item, index) => {
          const detailWords = getDetailWords(item.detail);
          const isActive = index === active;

          return (
            <article
              key={item.title}
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
                    activate(index);
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
                    activate(activeRef.current === index ? null : index);
                  }
                }}
                onPointerCancel={() => {
                  touchStart.current = null;
                }}
                onKeyDown={(event) => {
                  if (["Escape", "Enter", " "].includes(event.key)) {
                    event.preventDefault();
                    activate(
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
                  activate(next);
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
                      {detailWords.map((word, wordIndex) => (
                        <span
                          // biome-ignore lint/suspicious/noArrayIndexKey: Static words never reorder.
                          key={wordIndex}
                          style={
                            {
                              "--detail-enter-delay": `${wordIndex * Math.min(25, 320 / Math.max(1, detailWords.length - 1))}ms`,
                              "--detail-exit-delay": `${wordIndex * Math.min(12, 140 / Math.max(1, detailWords.length - 1))}ms`,
                            } as CSSProperties
                          }
                        >
                          {word}{" "}
                        </span>
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
