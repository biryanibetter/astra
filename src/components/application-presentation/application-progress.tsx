import type { CSSProperties } from "react";
import styles from "./application-presentation.module.css";

const defaultSteps = [
  "About you",
  "Interests",
  "Experience",
  "Portfolio & CV",
  "Review",
];

export function ApplicationProgress({
  currentStep,
  steps = defaultSteps,
}: {
  currentStep: number;
  steps?: readonly string[];
}) {
  if (!steps.length) {
    throw new Error("ApplicationProgress requires at least one step.");
  }

  const current = Math.max(0, Math.min(steps.length - 1, currentStep));
  const progress = ((current + 0.5) / steps.length) * 100;

  return (
    <div className={styles.progress}>
      <div
        className={styles.progressTrack}
        role="progressbar"
        aria-label="Application progress"
        aria-valuemin={1}
        aria-valuemax={steps.length}
        aria-valuenow={current + 1}
      >
        <span style={{ width: `${progress}%` }} />
      </div>
      <ol
        className={styles.progressSteps}
        data-step-count={steps.length}
        style={{ "--progress-step-count": steps.length } as CSSProperties}
      >
        {steps.map((step, index) => (
          <li
            key={step}
            className={styles.progressStep}
            aria-current={index === current ? "step" : undefined}
            data-complete={index < current ? "true" : undefined}
          >
            <span className={styles.progressCircle} aria-hidden="true">
              {index < current ? "✓" : index + 1}
            </span>
            <span className={styles.progressLabel}>{step}</span>
          </li>
        ))}
      </ol>
    </div>
  );
}
