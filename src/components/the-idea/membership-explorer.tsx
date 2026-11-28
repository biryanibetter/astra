"use client";

import {
  CalendarDays,
  Layers,
  Lightbulb,
  Microscope,
  Network,
  PenTool,
  Terminal,
  Users,
} from "lucide-react";
import { motion } from "motion/react";
import {
  type KeyboardEvent,
  useId,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import { MembershipPathwayIcon } from "@/components/ui/membership-pathway-icon";
import styles from "./membership-explorer.module.css";

const pathways = [
  {
    id: "core",
    name: "Astra Core",
    number: "01",
    title: "Help shape Astra.",
    description:
      "Work alongside students from across Qatar to develop the organization, coordinate its initiatives and create opportunities for the wider student community.",
    areas: [
      {
        icon: CalendarDays,
        title: "Events & experiences",
        description:
          "Plan and coordinate gatherings, workshops and exhibitions.",
      },
      {
        icon: Layers,
        title: "Operations & development",
        description: "Contribute to the systems and projects behind Astra.",
      },
      {
        icon: Network,
        title: "Partnerships & outreach",
        description: "Help build connections across schools and organizations.",
      },
      {
        icon: PenTool,
        title: "Technology, design & media",
        description: "Contribute your technical and creative skills.",
      },
    ],
  },
  {
    id: "fellow",
    name: "Astra Fellow",
    number: "02",
    title: "Take your ideas further.",
    description:
      "Develop your own projects and interests within a wider network of students, potential collaborators and different areas of expertise.",
    areas: [
      {
        icon: Microscope,
        title: "Research & discovery",
        description:
          "Explore scientific questions and independent investigations.",
      },
      {
        icon: Lightbulb,
        title: "Entrepreneurship",
        description: "Develop business concepts and explore new opportunities.",
      },
      {
        icon: Terminal,
        title: "Technology & innovation",
        description: "Create software, prototypes and technical projects.",
      },
      {
        icon: Users,
        title: "Cross-school collaboration",
        description: "Find students with complementary interests and skills.",
      },
    ],
  },
] as const;

// The shared indicator and tab key navigation are adapted from SmoothUI
// Animated Tabs (MIT, see docs/licenses/smoothui-MIT.txt).
const indicatorSpring = {
  type: "spring",
  duration: 0.25,
  bounce: 0.05,
} as const;
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

export function MembershipExplorer() {
  const id = useId();
  const tabs = useRef<(HTMLButtonElement | null)[]>([]);
  const [selection, setSelection] = useState<number | null>(null);
  const activeIndex = selection ?? 0;
  const reduceMotion = useSyncExternalStore(
    subscribeToMotionPreference,
    getMotionPreference,
    () => false,
  );

  function onTabKeyDown(
    event: KeyboardEvent<HTMLButtonElement>,
    index: number,
  ) {
    let nextIndex: number;
    if (event.key === "ArrowRight") {
      nextIndex = (index + 1) % pathways.length;
    } else if (event.key === "ArrowLeft") {
      nextIndex = (index - 1 + pathways.length) % pathways.length;
    } else if (event.key === "Home") {
      nextIndex = 0;
    } else if (event.key === "End") {
      nextIndex = pathways.length - 1;
    } else {
      return;
    }
    event.preventDefault();
    if (nextIndex !== activeIndex) setSelection(nextIndex);
    tabs.current[nextIndex]?.focus({ preventScroll: true });
  }

  return (
    <section
      className={styles.explorer}
      aria-label="Membership Explorer"
      data-local-motion={localReview || undefined}
    >
      <div
        className={styles.tabs}
        role="tablist"
        aria-label="Membership pathways"
      >
        {pathways.map((pathway, index) => {
          const active = index === activeIndex;
          return (
            <button
              key={pathway.id}
              ref={(button) => {
                tabs.current[index] = button;
              }}
              className={styles.tab}
              type="button"
              role="tab"
              id={`${id}-${pathway.id}-tab`}
              aria-controls={`${id}-${pathway.id}-panel`}
              aria-selected={active}
              tabIndex={active ? 0 : -1}
              onClick={() => {
                if (!active) setSelection(index);
              }}
              onKeyDown={(event) => onTabKeyDown(event, index)}
            >
              {active && (
                <motion.span
                  className={styles.indicator}
                  layoutId={`${id}-indicator`}
                  transition={reduceMotion ? { duration: 0 } : indicatorSpring}
                  aria-hidden="true"
                />
              )}
              <span className={styles.tabLabel}>
                <MembershipPathwayIcon pathway={pathway.id} />
                {pathway.name}
              </span>
            </button>
          );
        })}
      </div>

      {/* Both grid items contribute their natural height at every width. */}
      <div className={styles.panelFrame}>
        {pathways.map((pathway, index) => {
          const active = index === activeIndex;
          return (
            <div
              key={pathway.id}
              className={styles.panel}
              role="tabpanel"
              id={`${id}-${pathway.id}-panel`}
              aria-labelledby={`${id}-${pathway.id}-tab`}
              tabIndex={active ? 0 : -1}
              inert={!active}
              data-active={active}
            >
              <div
                className={styles.panelContent}
                data-entering={selection === index || undefined}
              >
                <p className={styles.eyebrow}>
                  {pathway.number} / MEMBERSHIP PATHWAY
                </p>
                <h2 className={styles.panelHeading}>{pathway.title}</h2>
                <p className={styles.description}>{pathway.description}</p>
                {/* biome-ignore lint/a11y/noRedundantRoles: Safari drops list semantics when bullets are hidden. */}
                <ul className={styles.areas} role="list">
                  {pathway.areas.map(({ icon: Icon, title, description }) => (
                    <li key={title} className={styles.area}>
                      <Icon aria-hidden="true" size={23} strokeWidth={1.65} />
                      <h3>{title}</h3>
                      <p>{description}</p>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
