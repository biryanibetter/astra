"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { WordRevealHeading } from "@/components/ui/word-reveal-heading";
import styles from "./photographic-gallery.module.css";

const phases = [
  {
    number: "01",
    name: "Beyond school boundaries.",
    summary:
      "Students with shared ambitions often have limited opportunities to meet and collaborate beyond their own schools.",
    imagePath: "/images/home-stock/faq-gathering.webp",
    altText: "Three students talking and comparing notes outside",
  },
  {
    number: "02",
    name: "Beyond the curriculum.",
    summary:
      "Curiosity extends beyond academic requirements. Students deserve opportunities to pursue interests that traditional classroom learning may not accommodate.",
    imagePath: "/images/program-stock/02-build-create.webp",
    altText:
      "Two engineers working together on a prototype in a tool-lined workshop",
  },
  {
    number: "03",
    name: "Beyond individual effort.",
    summary:
      "Promising ideas can benefit from collaboration, different perspectives and opportunities to reach a wider audience.",
    imagePath: "/images/idea-stock/presentation.webp",
    altText: "A student presenting to a group in a library",
  },
];

export default function PhotographicGallery() {
  const [animationsActive, setAnimationsActive] = useState(false);
  const [selectedPhase, setSelectedPhase] = useState<string | null>(null);
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

  const moveGlow = (event: React.PointerEvent<HTMLButtonElement>) => {
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
      <div className="wrap">
        <header className={styles.heading}>
          <WordRevealHeading
            shimmer
            as="h2"
            id="process-title"
            className="display"
            text="Why Astra exists."
          />
        </header>
        {/* biome-ignore lint/a11y/useSemanticElements: Interactive card grouping uses no fieldset legend or form controls. */}
        <div
          className={styles.grid}
          data-reveal-group=""
          role="group"
          aria-label="Reasons Astra exists"
        >
          {phases.map((phase, index) => (
            <button
              key={phase.number}
              type="button"
              className={styles.card}
              data-reveal="image"
              aria-pressed={selectedPhase === phase.name}
              onClick={() => setSelectedPhase(phase.name)}
              onPointerMove={moveGlow}
            >
              <span className={styles.glow} aria-hidden="true" />
              <span className={styles.num}>{phase.number}</span>
              <Image
                className={styles.image}
                src={phase.imagePath}
                alt={phase.altText}
                width={1920}
                height={1080}
                unoptimized
                loading="eager"
                priority={index === 0}
              />
              <div className={styles.shade} aria-hidden="true" />
              <div className={styles.caption} data-reveal-visual="">
                <h3>{phase.name}</h3>
                <p>{phase.summary}</p>
              </div>
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
