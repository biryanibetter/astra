"use client";

import { ArrowUpRight, FileText, Pencil } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useReducedMotion } from "@/lib/motion-preference";
import type { Pathway } from "./pathway-questions";
import { pathwayQuestions } from "./pathway-questions";
import type { PortfolioData } from "./portfolio-builder";
import styles from "./review-step.module.css";
import { formatFileSize, formatGrade } from "./review-step-format";

type ReviewAnswers = {
  fullName: string;
  email: string;
  school: string;
  grade: string;
  questionResponses: Record<string, string | string[]>;
  ageEligible: boolean;
};

type ReviewStepProps = {
  track: Pathway;
  answers: ReviewAnswers;
  portfolio: PortfolioData;
  onEdit: (step: number) => void;
};

type SectionProps = {
  title: string;
  step: number;
  onEdit: (step: number) => void;
  children: React.ReactNode;
  className?: string | undefined;
};

function ReviewSection({
  title,
  step,
  onEdit,
  children,
  className,
}: SectionProps) {
  return (
    <section
      className={`${styles.section} ${className ?? ""}`}
      data-reveal="section"
    >
      <header className={styles.sectionHeader}>
        <h3>{title}</h3>
        <button
          className={styles.editButton}
          type="button"
          aria-label={`Edit ${title}`}
          onClick={() => onEdit(step)}
        >
          <Pencil size={12} aria-hidden="true" />
          <span>Edit</span>
        </button>
      </header>
      <div className={styles.sectionContent}>{children}</div>
    </section>
  );
}

function Fact({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  const value = typeof children === "string" ? children.trim() : children;
  return (
    <div className={styles.fact}>
      <dt>{label}</dt>
      <dd>
        {value || <span className={styles.notProvided}>Not provided</span>}
      </dd>
    </div>
  );
}

function Response({
  label,
  value,
}: {
  label: string;
  value: string | string[] | undefined;
}) {
  const items = Array.isArray(value) ? value.filter((item) => item.trim()) : [];
  const text = typeof value === "string" ? value.trim() : "";
  if (!text && items.length === 0) return null;
  return (
    <article className={styles.response}>
      <h4>{label}</h4>
      {items.length > 0 ? (
        <ul className={styles.responseTags}>
          {items.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      ) : (
        <p>{text}</p>
      )}
    </article>
  );
}

function isSafeLink(value: string) {
  try {
    return ["http:", "https:"].includes(new URL(value.trim()).protocol);
  } catch {
    return false;
  }
}

export function ReviewStep({
  track,
  answers,
  portfolio,
  onEdit,
}: ReviewStepProps) {
  const reduceMotion = useReducedMotion() ?? false;
  const questions = pathwayQuestions[track].questions;
  const questionFor = (index: number) => questions[index];
  const responseFor = (index: number) => {
    const question = questionFor(index);
    return question ? answers.questionResponses[question.id] : undefined;
  };
  const isAnswered = (value: string | string[] | undefined) =>
    Array.isArray(value)
      ? value.length > 0
      : typeof value === "string" && Boolean(value.trim());
  const completed = [
    answers.fullName.trim(),
    answers.email.trim(),
    answers.school.trim(),
    answers.grade,
    answers.ageEligible,
    isAnswered(responseFor(0)),
    ...questions.slice(1).map((_, index) => isAnswered(responseFor(index + 1))),
    portfolio.projects.some((p) => p.title.trim() || p.description.trim()),
    portfolio.cv.some(({ file, error }) => !error && file),
  ].filter(Boolean).length;
  const total = track === "core" ? 14 : 13;
  const percentage = Math.round((completed / total) * 100);
  const name = answers.fullName.trim() || "Your application";
  const initials = answers.fullName
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");

  const extraResponses = questions.slice(1).map((question, index) => ({
    label: question.label,
    value: responseFor(index + 1),
  }));
  const firstResponse = responseFor(0);
  const interestValues: string[] = Array.isArray(firstResponse)
    ? firstResponse
    : typeof firstResponse === "string" && firstResponse.trim()
      ? [firstResponse]
      : [];
  const projectAndExperience = [
    ...portfolio.projects.map((item) => ({ ...item, kind: "Project" })),
  ];
  const supportingFiles = [
    ...portfolio.cv.map((item) => ({ ...item, kind: "CV" })),
  ];

  return (
    <motion.div
      className={styles.review}
      initial={reduceMotion ? false : { opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: reduceMotion ? 0 : 0.28, ease: "easeOut" }}
    >
      <header className={styles.overview}>
        <div className={styles.overviewIdentity}>
          <div className={styles.avatar} aria-hidden="true">
            {initials || "A"}
          </div>
          <div className={styles.overviewCopy}>
            <p className={styles.overviewEyebrow}>Application overview</p>
            <h2>{name}</h2>
            <p className={styles.trackName}>
              Astra {track === "core" ? "Core" : "Fellow"} applicant
            </p>
          </div>
        </div>
        <div
          className={styles.completeness}
          role="status"
          aria-label={`${completed} of ${total} required items complete`}
        >
          <div className={styles.completenessTop}>
            <span className={styles.completenessValue}>{percentage}%</span>
            <span className={styles.completenessLabel}>complete</span>
          </div>
          <div
            className={styles.progressTrack}
            role="progressbar"
            aria-label="Application completeness"
            aria-valuemin={0}
            aria-valuemax={total}
            aria-valuenow={completed}
          >
            <span style={{ width: `${percentage}%` }} />
          </div>
          <p>
            {completed} of {total} required items
          </p>
        </div>
      </header>

      <div className={styles.sections}>
        <ReviewSection title="Personal Profile" step={1} onEdit={onEdit}>
          <dl className={styles.facts}>
            <Fact label="Full name">{answers.fullName}</Fact>
            <Fact label="Email address">{answers.email}</Fact>
          </dl>
        </ReviewSection>

        <ReviewSection title="School & Education" step={1} onEdit={onEdit}>
          <dl className={styles.facts}>
            <Fact label="School">{answers.school}</Fact>
            <Fact label="Grade / year">{formatGrade(answers.grade)}</Fact>
            <Fact label="Student eligibility">
              {answers.ageEligible ? "Confirmed" : "Not confirmed"}
            </Fact>
          </dl>
        </ReviewSection>

        <ReviewSection title="Areas of Interest" step={1} onEdit={onEdit}>
          <p className={styles.selectionLabel}>{questions[0].label}</p>
          {interestValues.length > 0 ? (
            <ul className={styles.tags} aria-label="Selected interests">
              {interestValues.map((interest) => (
                <li key={interest}>{interest}</li>
              ))}
            </ul>
          ) : (
            <p className={styles.empty}>
              No interests or focus areas selected yet.
            </p>
          )}
        </ReviewSection>

        <ReviewSection
          title="Application Responses"
          step={2}
          onEdit={onEdit}
          className={styles.responsesSection}
        >
          <div className={styles.responseList}>
            {extraResponses.map(({ label, value }) => (
              <Response key={label} label={label} value={value} />
            ))}
            {extraResponses.every(({ value }) => !isAnswered(value)) ? (
              <p className={styles.empty}>No additional responses provided.</p>
            ) : null}
          </div>
        </ReviewSection>

        <ReviewSection
          title="Projects"
          step={3}
          onEdit={onEdit}
          className={styles.responsesSection}
        >
          <div className={styles.responseList}>
            {projectAndExperience.length ? (
              projectAndExperience.map((item) => (
                <article
                  className={styles.response}
                  key={`${item.kind}-${item.id}`}
                >
                  <h4>{item.title || "Untitled"}</h4>
                  <p>{item.description || "No description provided."}</p>
                </article>
              ))
            ) : (
              <p className={styles.empty}>No projects added.</p>
            )}
          </div>
        </ReviewSection>

        <ReviewSection title="Supporting Links & CV" step={3} onEdit={onEdit}>
          <div className={styles.responseList}>
            {portfolio.links.some((link) => link.url.trim()) ? (
              portfolio.links.map((link) =>
                isSafeLink(link.url) ? (
                  <a
                    className={styles.projectLink}
                    href={link.url}
                    target="_blank"
                    rel="noreferrer"
                    key={link.id}
                  >
                    <span>
                      {link.label || link.type}: {link.url}
                    </span>
                    <ArrowUpRight size={15} aria-hidden="true" />
                  </a>
                ) : link.url ? (
                  <p key={link.id}>
                    {link.label || link.type}: {link.url} (invalid link)
                  </p>
                ) : null,
              )
            ) : (
              <p className={styles.empty}>No supporting links added.</p>
            )}
            <AnimatePresence mode="wait" initial={false}>
              {supportingFiles.length ? (
                supportingFiles.map(({ id, file, error, kind }) => (
                  <div className={styles.document} key={id}>
                    <span className={styles.fileIcon} aria-hidden="true">
                      <FileText size={18} />
                    </span>
                    <span className={styles.documentDetails}>
                      <strong>
                        {kind}: {file.name}
                      </strong>
                      <small>
                        {formatFileSize(file.size)}
                        {error ? ` · ${error}` : ""}
                      </small>
                    </span>
                  </div>
                ))
              ) : (
                <motion.p
                  key="no-document"
                  className={styles.empty}
                  initial={reduceMotion ? false : { opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  No CV selected.
                </motion.p>
              )}
            </AnimatePresence>
            <button
              className={styles.portfolioLink}
              type="button"
              onClick={() => onEdit(3)}
            >
              {portfolio.cv.length ? "Edit CV" : "Add CV"}
            </button>
          </div>
        </ReviewSection>
      </div>
    </motion.div>
  );
}
