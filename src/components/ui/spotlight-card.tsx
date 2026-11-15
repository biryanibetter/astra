"use client";

import { type PointerEvent, useEffect, useRef, useState } from "react";
import styles from "./spotlight-card.module.css";

const phases = [
  {
    label: "01 / PEOPLE",
    name: "Connect",
    summary: "Meet curious people across schools and different disciplines.",
    detail:
      "Find different perspectives, shared interests, and potential collaborators.",
  },
  {
    label: "02 / POSSIBILITY",
    name: "Create",
    summary: "Turn a question into an experiment, project or first prototype.",
    detail:
      "Work together, try things, challenge assumptions, and learn by making.",
  },
  {
    label: "03 / OUT INTO THE WORLD",
    name: "Share",
    summary: "Put your work into the world and invite other ideas in.",
    detail: "Show the process, get feedback, and inspire the next project.",
  },
];

export default function SpotlightCard() {
  const [selected, setSelected] = useState(0);
  const [animationsActive, setAnimationsActive] = useState(false);
  const sectionRef = useRef<HTMLElement>(null);
  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;
    if (!("IntersectionObserver" in window)) {
      setAnimationsActive(true);
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.target === section)
            setAnimationsActive(entry.isIntersecting);
        }
      },
      { threshold: 0 },
    );
    observer.observe(section);
    return () => observer.disconnect();
  }, []);
  const moveGlow = (event: PointerEvent<HTMLButtonElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    event.currentTarget.style.setProperty(
      "--sx",
      `${event.clientX - rect.left}px`,
    );
    event.currentTarget.style.setProperty(
      "--sy",
      `${event.clientY - rect.top}px`,
    );
  };
  return (
    <section
      ref={sectionRef}
      className={styles.section}
      aria-labelledby="process-title"
      data-animations-active={animationsActive}
    >
      <div className={styles.wrap}>
        <header className={styles.heading}>
          <div>
            <p className={styles.eyebrow}>02 / HOW IT COULD WORK</p>
            <h2 id="process-title">
              From ideas
              <br />
              to action.
            </h2>
          </div>
          <p className={styles.intro}>
            Three simple possibilities. Find your people, make something
            meaningful, and share what you discover.
          </p>
        </header>
        <fieldset
          className={styles.grid}
          aria-label="Explore the three stages of the ASTRA experience"
        >
          {phases.map((phase, index) => (
            <button
              key={phase.name}
              type="button"
              className={`${styles.card} ${selected === index ? styles.selected : ""}`}
              aria-pressed={selected === index}
              onClick={() => setSelected(index)}
              onPointerMove={moveGlow}
            >
              <span className={styles.glow} aria-hidden="true" />
              <span className={styles.num}>{phase.label}</span>
              <span
                className={`${styles.graphic} ${styles[`graphic${index}`]}`}
                aria-hidden="true"
              >
                {index === 0 ? (
                  <svg viewBox="0 0 340 190">
                    <title>Network of connected people</title>
                    <g className={styles.lines}>
                      <path d="M60 92 127 42 181 90 248 37 297 105 246 151 181 90 125 148 60 92M127 42 246 151M248 37 125 148" />
                      <circle cx="170" cy="94" r="69" strokeDasharray="2 8" />
                    </g>
                    <g className={styles.nodes}>
                      <circle cx="60" cy="92" r="4" />
                      <circle cx="127" cy="42" r="3" />
                      <circle cx="181" cy="90" r="6" />
                      <circle cx="248" cy="37" r="4" />
                      <circle cx="297" cy="105" r="3" />
                      <circle cx="246" cy="151" r="4" />
                      <circle cx="125" cy="148" r="3" />
                    </g>
                  </svg>
                ) : index === 1 ? (
                  <svg viewBox="0 0 340 190">
                    <title>Geometric prototype taking shape</title>
                    <g className={styles.lines}>
                      <path d="m173 28 86 44v75l-86 43-86-43V72zM173 28v90l86-46M173 118 87 72M173 118v72M87 147l86-29 86 29M46 36h42M46 36v42M294 153h-42M294 153v-42" />
                    </g>
                    <g className={styles.nodes}>
                      <circle cx="173" cy="28" r="3" />
                      <circle cx="87" cy="72" r="3" />
                      <circle cx="259" cy="72" r="3" />
                      <circle cx="173" cy="118" r="4.5" />
                      <circle cx="173" cy="190" r="3" />
                    </g>
                  </svg>
                ) : (
                  <svg viewBox="0 0 340 190">
                    <title>Ideas radiating outward to an audience</title>
                    <g className={styles.orbits}>
                      <circle cx="170" cy="97" r="29" />
                      <circle cx="170" cy="97" r="60" />
                      <circle cx="170" cy="97" r="90" strokeDasharray="2 7" />
                      <path d="M170 7v26M170 161v26M80 97h26M234 97h26M170 97 227 43M170 97 267 137M170 97 98 47" />
                    </g>
                    <g className={styles.nodes}>
                      <circle cx="170" cy="97" r="7" />
                      <circle cx="227" cy="43" r="4" />
                      <circle cx="267" cy="137" r="4" />
                      <circle cx="98" cy="47" r="4" />
                    </g>
                  </svg>
                )}
              </span>
              <span className={styles.content}>
                <span className={styles.name}>
                  {phase.name}
                  <span className={styles.arrow}>↗</span>
                </span>
                <span className={styles.summary}>{phase.summary}</span>
                <span className={styles.detail}>{phase.detail}</span>
              </span>
            </button>
          ))}
        </fieldset>
        <p className={styles.note}>
          AN IDEA DOESN’T NEED TO BE FINISHED TO BE SHARED.
        </p>
      </div>
    </section>
  );
}
