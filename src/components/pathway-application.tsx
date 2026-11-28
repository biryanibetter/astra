"use client";

import {
  Activity,
  BrainCircuit,
  BriefcaseBusiness,
  Check,
  Compass,
  Handshake,
  Megaphone,
  Users,
} from "lucide-react";
import { motion } from "motion/react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useSmoothScroll } from "@/components/smooth-scroll-provider";
import { Button } from "@/components/ui/button";
import { CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import OnboardingForm from "@/components/ui/multistep-form";
import { ShinyAction } from "@/components/ui/shiny-button";
import { ApplicantProfileStep } from "./applicant-profile-step";
import { PathwayIntroduction } from "./application-presentation/pathway-introduction";
import {
  coreCommitments,
  type Pathway,
  type PathwayQuestion,
  pathwayQuestions,
} from "./pathway-form-questions";
import {
  isResponseValid,
  type PathwayAnswers,
  pathwayValidation,
} from "./pathway-validation";
import { emptyPortfolioData, PortfolioBuilder } from "./portfolio-builder";
import { ReviewStep } from "./review-step";

type ProfileField = "fullName" | "email" | "school" | "grade" | "ageEligible";

const stages = [
  { id: "introduction", title: "Introduction", shortTitle: "Intro" },
  { id: "profile", title: "Profile & Interests", shortTitle: "Profile" },
  { id: "questions", title: "Application Questions", shortTitle: "Questions" },
  {
    id: "portfolio",
    title: "Portfolio & CV",
    shortTitle: "Portfolio",
  },
] as const;
const reviewStage = {
  id: "review",
  title: "Review & Finish",
  shortTitle: "Review",
} as const;
const pathwayStages = {
  core: [
    ...stages,
    {
      id: "commitments",
      title: "Membership Commitments",
      shortTitle: "Duties",
    },
    reviewStage,
  ],
  fellow: [...stages, reviewStage],
} as const;

const fieldReveal = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.28 } },
};

const optionIconsCore: Record<
  string,
  React.ComponentType<{ size?: number; strokeWidth?: number }>
> = {
  "Weekday afternoons": Activity,
  "Weekday evenings": Activity,
  Friday: Activity,
  Saturday: Activity,
  "Flexible availability": Activity,
  Yes: Users,
  "Depending on the date and location": Compass,
  "I would primarily be available online": BrainCircuit,
};

const optionIconsFellow: Record<
  string,
  React.ComponentType<{ size?: number; strokeWidth?: number }>
> = {
  "Hackathons & competitions": BrainCircuit,
  "Research & innovation exhibitions": Activity,
  "Workshops & collaborative projects": Users,
  "Speaker sessions & discussions": Megaphone,
  "Entrepreneurship & startup initiatives": BriefcaseBusiness,
  "Networking & student gatherings": Handshake,
  "Finding collaborators": Users,
  "Connecting with researchers and professionals": Handshake,
  "Developing new ideas and projects": BrainCircuit,
  "Presenting and showcasing my work": Megaphone,
  "Entrepreneurial opportunities": BriefcaseBusiness,
};

function countChars(text: string): number {
  return text.trim().length;
}

function QuestionField({
  question,
  value,
  onChange,
  error,
  track,
}: {
  question: PathwayQuestion;
  value: string | string[];
  onChange: (value: string | string[]) => void;
  error?: string | undefined;
  track: Pathway;
}) {
  const rawSelectedValues =
    question.type === "textarea"
      ? EMPTY_ARRAY
      : (Array.isArray(value) ? value : [value]).filter((option) =>
          question.options.includes(option),
        );
  // Use stable reference for empty arrays to prevent infinite render loops
  const selectedValues =
    rawSelectedValues.length === 0 ? EMPTY_ARRAY : rawSelectedValues;
  const [charCount, setCharCount] = useState(0);
  const [isOverLimit, setIsOverLimit] = useState(false);
  const [isUnderMin, setIsUnderMin] = useState(false);
  const [hasInteracted, setHasInteracted] = useState(false);

  const toggleOption = (option: string, selected: boolean) => {
    if (question.type === "multi-select") {
      onChange(
        selected
          ? [...selectedValues, option]
          : selectedValues.filter((item) => item !== option),
      );
    } else {
      onChange(selected ? option : "");
    }
  };

  const getIcon = (option: string) => {
    const icons = track === "core" ? optionIconsCore : optionIconsFellow;
    return icons[option] ?? Compass;
  };

  const handleTextareaChange = (
    event: React.ChangeEvent<HTMLTextAreaElement>,
  ) => {
    const newValue = event.target.value;
    onChange(newValue);
    const count = countChars(newValue);
    setCharCount(count);
    if (question.maxChars) {
      setIsOverLimit(count > question.maxChars);
    }
    if (question.minChars !== undefined) {
      setIsUnderMin(count < question.minChars && hasInteracted);
    }
    setHasInteracted(true);
  };

  const handleTextareaBlur = () => {
    setHasInteracted(true);
  };

  useEffect(() => {
    if (question.type === "textarea" && typeof value === "string") {
      const count = countChars(value);
      setCharCount(count);
      if (question.maxChars) {
        setIsOverLimit(count > question.maxChars);
      }
      if (question.minChars !== undefined && hasInteracted) {
        setIsUnderMin(count < question.minChars);
      }
    }
  }, [
    value,
    question.type,
    question.maxChars,
    question.minChars,
    hasInteracted,
  ]);

  const isInvalid = isOverLimit || (isUnderMin && hasInteracted);
  const textareaError =
    error ||
    (isOverLimit
      ? `Maximum ${question.maxChars} characters exceeded.`
      : isUnderMin && hasInteracted
        ? `Minimum ${question.minChars} characters required.`
        : undefined);
  const textareaAriaInvalid = Boolean(error) || isInvalid;

  return (
    <motion.div
      className="field"
      variants={fieldReveal}
      initial="hidden"
      animate="visible"
    >
      {question.type === "textarea" ? (
        <>
          <label htmlFor={question.id}>
            {question.label}{" "}
            {!question.optional && <span aria-hidden="true">*</span>}
          </label>
          {question.hint ? (
            <p className="field-hint" id={`${question.id}-hint`}>
              {question.hint}
            </p>
          ) : null}
          <textarea
            id={question.id}
            rows={6}
            required={!question.optional}
            placeholder={question.placeholder}
            aria-invalid={textareaAriaInvalid}
            aria-describedby={
              [
                question.hint && `${question.id}-hint`,
                textareaError && `${question.id}-error`,
              ]
                .filter(Boolean)
                .join(" ") || undefined
            }
            value={typeof value === "string" ? value : ""}
            onChange={handleTextareaChange}
            onBlur={handleTextareaBlur}
          />
          {question.maxChars && (
            <p
              id={`${question.id}-charcount`}
              className="word-count"
              style={{
                color: isInvalid ? "var(--application-error-color)" : "inherit",
              }}
              aria-live="polite"
            >
              {charCount} / {question.maxChars} characters
            </p>
          )}
        </>
      ) : (
        <fieldset
          className="interest-fields"
          tabIndex={-1}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? `${question.id}-error` : undefined}
        >
          <legend>
            {question.label} <span aria-hidden="true">*</span>
          </legend>
          {question.hint ? <p className="field-hint">{question.hint}</p> : null}
          {question.layout === "vertical" ? (
            <div className="question-options-vertical">
              {question.options.map((option, index) => {
                const checked = selectedValues.includes(option);
                const inputId = `${question.id}-${index}`;
                const Icon = getIcon(option);
                return (
                  <motion.div
                    key={option}
                    className={`vertical-select-row${checked ? " is-selected" : ""}`}
                  >
                    <label className="vertical-select-label" htmlFor={inputId}>
                      <input
                        id={inputId}
                        type={
                          question.type === "multi-select"
                            ? "checkbox"
                            : "radio"
                        }
                        name={question.id}
                        checked={checked}
                        aria-invalid={Boolean(error)}
                        aria-describedby={
                          error ? `${question.id}-error` : undefined
                        }
                        onChange={(event) =>
                          toggleOption(option, event.target.checked)
                        }
                      />
                      <span className="interest-card-icon" aria-hidden="true">
                        <Icon size={18} strokeWidth={1.7} />
                      </span>
                      <span className="interest-card-text">{option}</span>
                      <Check
                        className="interest-card-check"
                        size={18}
                        strokeWidth={3}
                        aria-hidden="true"
                      />
                    </label>
                  </motion.div>
                );
              })}
            </div>
          ) : (
            <div
              className={`question-options${question.type === "single-select" ? " question-options-single" : ""}`}
            >
              {question.options.map((option, index) => {
                const checked = selectedValues.includes(option);
                const inputId = `${question.id}-${index}`;
                const Icon = getIcon(option);
                return (
                  <motion.div
                    key={option}
                    className={`interest-card${checked ? " is-selected" : ""}`}
                  >
                    <label className="interest-card-label" htmlFor={inputId}>
                      <input
                        id={inputId}
                        type={
                          question.type === "multi-select"
                            ? "checkbox"
                            : "radio"
                        }
                        name={question.id}
                        checked={checked}
                        aria-invalid={Boolean(error)}
                        aria-describedby={
                          error ? `${question.id}-error` : undefined
                        }
                        onChange={(event) =>
                          toggleOption(option, event.target.checked)
                        }
                      />
                      <span className="interest-card-icon" aria-hidden="true">
                        <Icon size={17} strokeWidth={1.7} />
                      </span>
                      <span className="interest-card-text">{option}</span>
                      <Check
                        className="interest-card-check"
                        size={16}
                        strokeWidth={3}
                        aria-hidden="true"
                      />
                    </label>
                  </motion.div>
                );
              })}
            </div>
          )}
        </fieldset>
      )}
      {textareaError ? (
        <p id={`${question.id}-error`} className="field-error" role="alert">
          {textareaError}
        </p>
      ) : error ? (
        <p id={`${question.id}-error`} className="field-error" role="alert">
          {error}
        </p>
      ) : null}
    </motion.div>
  );
}

const EMPTY_ARRAY: string[] = [];

const submittedCopy = {
  title: "Done.",
  message: "Development preview",
  detail: "Nothing was sent to Astra.",
};

const failureCopy = {
  title: "Something went wrong.",
  message: "The preview couldn’t finish. Your answers are still on this page.",
  detail: "",
};

type SubmissionState = "ready" | "submitting" | "success" | "failure";

function SuccessScreen({ onReturnHome }: { onReturnHome: () => void }) {
  const router = useRouter();
  const heading = useRef<HTMLHeadingElement>(null);
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    heading.current?.focus();

    let cancelled = false;
    timerRef.current = window.setTimeout(() => {
      if (!cancelled) {
        router.replace("/#top");
      }
    }, 15_000);

    return () => {
      cancelled = true;
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [router]);

  const handleReturnHome = () => {
    if (timerRef.current !== null) clearTimeout(timerRef.current);
    onReturnHome();
  };

  return (
    <section
      className="application-shell glass pathway-confirmation"
      aria-labelledby="pathway-confirmation-title"
    >
      <div className="pathway-confirmation-icon" aria-hidden="true">
        <svg viewBox="0 0 48 48" fill="none" aria-hidden="true">
          <path
            d="m10 24 9 9 19-19"
            pathLength="1"
            stroke="currentColor"
            strokeWidth="4"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>
      <h2 id="pathway-confirmation-title" ref={heading} tabIndex={-1}>
        {submittedCopy.title}
      </h2>
      <p>{submittedCopy.message}</p>
      <p>{submittedCopy.detail}</p>
      <ShinyAction type="button" onClick={handleReturnHome}>
        Return to Home
      </ShinyAction>
    </section>
  );
}

function FailureScreen({
  onRetry,
  onBackToApplication,
}: {
  onRetry: () => void;
  onBackToApplication: () => void;
}) {
  const heading = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    heading.current?.focus();
  }, []);

  return (
    <section
      className="application-shell glass pathway-confirmation"
      aria-labelledby="pathway-confirmation-title"
    >
      <div
        className="pathway-confirmation-icon pathway-confirmation-error"
        aria-hidden="true"
      >
        <svg viewBox="0 0 48 48" fill="none" aria-hidden="true">
          <circle
            cx="24"
            cy="24"
            r="22"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            d="M24 16v16M24 24h.01"
            stroke="currentColor"
            strokeWidth="4"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>
      <h2 id="pathway-confirmation-title" ref={heading} tabIndex={-1}>
        {failureCopy.title}
      </h2>
      <p>{failureCopy.message}</p>
      <div className="pathway-confirmation-actions">
        <ShinyAction type="button" onClick={onRetry}>
          Try Again
        </ShinyAction>
        <Button
          type="button"
          variant="ghost"
          className="pathway-confirmation-secondary"
          onClick={onBackToApplication}
        >
          Back to Application
        </Button>
      </div>
    </section>
  );
}

export function PathwayApplication({
  track,
  initialSchool,
}: {
  track: Pathway;
  initialSchool: string;
}) {
  const config = pathwayQuestions[track];
  const steps = pathwayStages[track];
  const reviewStepIndex = steps.length - 1;
  const [answers, setAnswers] = useState<PathwayAnswers>({
    fullName: "",
    email: "",
    school: initialSchool,
    grade: "",
    questionResponses: {},
    portfolio: emptyPortfolioData,
    ageEligible: false,
    commitments: {},
  });
  const [submissionState, setSubmissionState] =
    useState<SubmissionState>("ready");
  const [formInitialStep, setFormInitialStep] = useState(0);
  const [invalidLinkDraft, setInvalidLinkDraft] = useState(false);
  const [attemptedStep, setAttemptedStep] = useState<number | null>(null);
  const [invalidAttempt, setInvalidAttempt] = useState(0);
  const panel = useRef<HTMLDivElement>(null);
  const lenis = useSmoothScroll();
  const router = useRouter();

  // Scroll reset when transitioning to confirmation screen (success or failure)
  useEffect(() => {
    if (
      (submissionState === "success" || submissionState === "failure") &&
      lenis
    ) {
      lenis.scrollTo(0, { immediate: true, force: true });
      if (typeof window !== "undefined") {
        window.scrollTo({ top: 0, left: 0, behavior: "instant" });
      }
    }
  }, [submissionState, lenis]);
  useEffect(() => {
    if (!invalidAttempt) return;
    let retry: ReturnType<typeof setTimeout> | undefined;
    // Wait for inline errors to commit, including on repeated Next attempts.
    const frame = requestAnimationFrame(() => {
      const invalid = Array.from(
        panel.current?.querySelectorAll<HTMLElement>('[aria-invalid="true"]') ??
          [],
      ).find((element) => !element.closest("[inert]"));
      if (!invalid) return;
      const field =
        invalid.closest<HTMLElement>(
          ".field, fieldset, [data-validation-field]",
        ) ?? invalid;
      invalid.focus({ preventScroll: true });
      if (lenis) {
        lenis.scrollTo(field, { immediate: false, force: true, lerp: 0.14 });
      } else {
        field.scrollIntoView({ behavior: "smooth", block: "start" });
      }
      // Restore focus only if a transition dropped it onto the document.
      // Never steal focus back from a field the applicant has chosen meanwhile.
      retry = setTimeout(() => {
        if (
          (document.activeElement &&
            document.activeElement !== document.body) ||
          invalid.getAttribute("aria-invalid") !== "true"
        )
          return;
        invalid.focus({ preventScroll: true });
      }, 150);
    });
    return () => {
      cancelAnimationFrame(frame);
      if (retry) clearTimeout(retry);
    };
  }, [invalidAttempt, lenis]);
  const fieldError = (step: number, invalid: boolean, message: string) =>
    attemptedStep === step && invalid ? message : undefined;
  const update = <K extends keyof PathwayAnswers>(
    key: K,
    value: PathwayAnswers[K],
  ) => setAnswers((previous) => ({ ...previous, [key]: value }));
  const updateProfile = (key: ProfileField, value: string | boolean) => {
    if (key === "ageEligible") {
      update("ageEligible", value === true);
    } else if (typeof value === "string") {
      update(key, value);
    }
  };
  const validation = pathwayValidation(track, answers);
  const valid = (step: number) => {
    const stage = steps[step];
    if (!stage) return false;
    if (invalidLinkDraft && (stage.id === "portfolio" || stage.id === "review"))
      return false;
    return validation.steps[stage.id];
  };

  // Submission state handlers
  const mockSubmit = async (shouldSucceed: boolean): Promise<boolean> => {
    await new Promise((resolve) => setTimeout(resolve, 1500));
    return shouldSucceed;
  };

  const handleSubmit = async () => {
    if (submissionState === "submitting") return;
    setFormInitialStep(reviewStepIndex);
    setSubmissionState("submitting");
    try {
      // For local testing: change to false to test failure screen
      const success = await mockSubmit(true);
      if (success) {
        setSubmissionState("success");
        setFormInitialStep(0); // Reset for next application
      } else {
        setSubmissionState("failure");
      }
    } catch {
      setSubmissionState("failure");
    }
  };

  const handleRetry = () => {
    setFormInitialStep(reviewStepIndex);
    setSubmissionState("ready");
    handleSubmit();
  };

  const handleBackToApplication = () => {
    setFormInitialStep(reviewStepIndex);
    setSubmissionState("ready");
  };

  const renderStep = (step: number, goToStep: (step: number) => void) => {
    if (step === 0) return <PathwayIntroduction track={track} />;
    if (step === 1)
      return (
        <ApplicantProfileStep
          answers={answers}
          update={updateProfile}
          question={config.questions[0]}
          questionResponse={answers.questionResponses[config.questions[0].id]}
          onQuestionChange={(value) =>
            update("questionResponses", {
              ...answers.questionResponses,
              [config.questions[0].id]: value,
            })
          }
          attempted={attemptedStep === 1}
        />
      );
    if (step === 2)
      return (
        <>
          <motion.div
            className="pathway-step-copy"
            variants={fieldReveal}
            initial="hidden"
            animate="visible"
          >
            <CardHeader>
              <CardTitle>Application Questions</CardTitle>
            </CardHeader>
          </motion.div>
          <CardContent className="pathway-questions">
            {config.questions.slice(1).map((question) => (
              <QuestionField
                key={question.id}
                question={question}
                value={
                  answers.questionResponses[question.id] ??
                  (question.type === "multi-select" ? EMPTY_ARRAY : "")
                }
                onChange={(value) =>
                  update("questionResponses", {
                    ...answers.questionResponses,
                    [question.id]: value,
                  })
                }
                error={fieldError(
                  2,
                  !isResponseValid(
                    question,
                    answers.questionResponses[question.id],
                  ),
                  question.type === "textarea"
                    ? "Enter a response to continue."
                    : question.type === "single-select"
                      ? "Select one option."
                      : "Select at least one option.",
                )}
                track={track}
              />
            ))}
          </CardContent>
        </>
      );
    if (step === 3)
      return (
        <PortfolioBuilder
          value={answers.portfolio}
          onChange={(portfolio) => update("portfolio", portfolio)}
          cvRequired={config.cvRequired}
          attempted={attemptedStep === step}
          onLinkDraftInvalid={setInvalidLinkDraft}
        />
      );
    if (steps[step]?.id === "commitments") {
      const showError = attemptedStep === step && !validation.steps.commitments;
      const selectedCount = coreCommitments.filter(
        ({ id }) => answers.commitments?.[id] === true,
      ).length;
      const allChecked = selectedCount === coreCommitments.length;
      const handleSelectAll = (checked: boolean) => {
        const newCommitments: Record<string, boolean> = {};
        coreCommitments.forEach(({ id }) => {
          newCommitments[id] = checked;
        });
        update("commitments", newCommitments);
      };
      return (
        <>
          <div className="pathway-step-copy">
            <CardHeader>
              <CardTitle>Core membership commitments</CardTitle>
              <p>
                Astra Core is an active membership pathway that involves
                contributing to the organization&apos;s operations and
                initiatives. Please review the following expectations before
                continuing.
              </p>
            </CardHeader>
          </div>
          <CardContent className="pathway-questions">
            <fieldset
              className="pathway-commitments"
              aria-label="Required Core commitments"
              aria-describedby={showError ? "commitments-error" : undefined}
            >
              <div className="commitments-list">
                {coreCommitments.map(({ id, text }) => (
                  <label key={id} className="commitment-row">
                    <input
                      className="commitment-input"
                      type="checkbox"
                      required
                      checked={answers.commitments?.[id] === true}
                      aria-invalid={
                        showError && answers.commitments?.[id] !== true
                      }
                      aria-describedby={
                        showError && answers.commitments?.[id] !== true
                          ? "commitments-error"
                          : undefined
                      }
                      onChange={(event) =>
                        update("commitments", {
                          ...answers.commitments,
                          [id]: event.target.checked,
                        })
                      }
                    />
                    <span className="commitment-indicator" aria-hidden="true">
                      <Check size={14} strokeWidth={3} />
                    </span>
                    <span className="commitment-text">{text}</span>
                  </label>
                ))}
              </div>
              <div className="commitments-actions">
                <span className="commitments-count">
                  {selectedCount} of {coreCommitments.length} selected
                </span>
                <ShinyAction
                  type="button"
                  className="commitments-toggle"
                  onClick={() => handleSelectAll(!allChecked)}
                  aria-pressed={allChecked}
                  aria-label={
                    allChecked
                      ? "Deselect all commitments"
                      : "Select all commitments"
                  }
                >
                  {allChecked ? "Deselect all" : "Select all"}
                </ShinyAction>
              </div>
              {showError && (
                <p className="field-error" id="commitments-error" role="alert">
                  Acknowledge all six commitments to continue.
                </p>
              )}
            </fieldset>
          </CardContent>
        </>
      );
    }
    return (
      <ReviewStep
        track={track}
        answers={answers}
        portfolio={answers.portfolio}
        completion={validation}
        onEdit={goToStep}
      />
    );
  };
  return (
    <div className="astra-application-panel" ref={panel}>
      {submissionState === "success" ? (
        <SuccessScreen onReturnHome={() => router.replace("/#top")} />
      ) : submissionState === "failure" ? (
        <FailureScreen
          onRetry={handleRetry}
          onBackToApplication={handleBackToApplication}
        />
      ) : (
        <OnboardingForm
          application={{
            steps,
            renderStep,
            canProceed: valid,
            onNext: async (step) => valid(step),
            onInvalid: (step) => {
              setAttemptedStep(step);
              setInvalidAttempt((attempt) => attempt + 1);
            },
            onDone: handleSubmit,
            submitting: submissionState === "submitting",
            initialStep: formInitialStep,
          }}
        />
      )}
    </div>
  );
}
