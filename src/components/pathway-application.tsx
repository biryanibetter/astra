"use client";

import { motion } from "framer-motion";
import {
  Activity,
  BrainCircuit,
  BriefcaseBusiness,
  Check,
  Compass,
  FlaskConical,
  Handshake,
  Megaphone,
  Users,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useSmoothScroll } from "@/components/smooth-scroll-provider";
import { CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import OnboardingForm from "@/components/ui/multistep-form";
import { ApplicantProfileStep } from "./applicant-profile-step";
import { PathwayIntroduction } from "./application-presentation/pathway-introduction";
import { validateCharacterCount } from "./pathway-question-validation";
import {
  type Pathway,
  type PathwayQuestion,
  pathwayQuestions,
} from "./pathway-questions";
import { isPathwayStepValid, isResponseValid } from "./pathway-validation";
import {
  emptyPortfolioData,
  PortfolioBuilder,
  type PortfolioData,
} from "./portfolio-builder";
import { ReviewStep } from "./review-step";

type Answers = {
  fullName: string;
  email: string;
  school: string;
  grade: string;
  questionResponses: Record<string, string | string[]>;
  portfolio: PortfolioData;
  ageEligible: boolean;
};
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
  { id: "review", title: "Review & Finish", shortTitle: "Review" },
] as const;

const fieldReveal = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.28 } },
};

const optionIconsCore: Record<
  string,
  React.ComponentType<{ size?: number; strokeWidth?: number }>
> = {
  "Events & experiences": Users,
  "Projects & programs": BriefcaseBusiness,
  "Technology & AI": BrainCircuit,
  "Communications & media": Megaphone,
  "Partnerships & outreach": Handshake,
  "School network": Compass,
  "Operations & planning": Activity,
};

const optionIconsFellow: Record<
  string,
  React.ComponentType<{ size?: number; strokeWidth?: number }>
> = {
  "Plan and coordinate tasks": Activity,
  "Create or improve digital tools": BrainCircuit,
  "Design content or communications": Megaphone,
  "Organize events or workshops": Users,
  "Research ideas and opportunities": FlaskConical,
  "Connect with students or partners": Handshake,
  "Support a team and follow through": BriefcaseBusiness,
};

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
  const selectedValues = Array.isArray(value) ? value : [value];
  const characterValidation =
    question.type === "textarea"
      ? validateCharacterCount(
          typeof value === "string" ? value : "",
          question.minimum,
          question.maximum,
        )
      : undefined;
  let displayError = error;
  if (question.type === "textarea" && characterValidation) {
    if (error && characterValidation.count < question.minimum) {
      displayError = `Minimum ${question.minimum} characters required (currently ${characterValidation.count}).`;
    } else if (characterValidation.count > question.maximum) {
      displayError = characterValidation.message;
    }
  }
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
            {question.label} <span aria-hidden="true">*</span>
          </label>
          {question.hint ? (
            <p className="field-hint" id={`${question.id}-hint`}>
              {question.hint}
            </p>
          ) : null}
          <textarea
            id={question.id}
            rows={3}
            required
            aria-invalid={Boolean(displayError)}
            aria-describedby={`${question.hint ? `${question.id}-hint ` : ""}${question.id}-count`}
            value={typeof value === "string" ? value : ""}
            onChange={(event) => onChange(event.target.value)}
          />
          <p
            className={displayError ? "field-error" : "field-hint"}
            id={`${question.id}-count`}
            aria-live="polite"
            role={displayError ? "alert" : undefined}
          >
            {displayError ||
              (characterValidation?.valid
                ? `${characterValidation.count} characters`
                : `Minimum ${question.minimum} characters`)}
          </p>
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
                        question.type === "multi-select" ? "checkbox" : "radio"
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
        </fieldset>
      )}
      {error && question.type !== "textarea" ? (
        <p id={`${question.id}-error`} className="field-error" role="alert">
          {error}
        </p>
      ) : null}
    </motion.div>
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
  const [answers, setAnswers] = useState<Answers>({
    fullName: "",
    email: "",
    school: initialSchool,
    grade: "",
    questionResponses: {},
    portfolio: emptyPortfolioData,
    ageEligible: false,
  });
  const [attemptedStep, setAttemptedStep] = useState<number | null>(null);
  const [invalidAttempt, setInvalidAttempt] = useState(0);
  const panel = useRef<HTMLDivElement>(null);
  const lenis = useSmoothScroll();
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
  const update = <K extends keyof Answers>(key: K, value: Answers[K]) =>
    setAnswers((previous) => ({ ...previous, [key]: value }));
  const updateProfile = (key: ProfileField, value: string | boolean) => {
    if (key === "ageEligible") {
      update("ageEligible", value === true);
    } else if (typeof value === "string") {
      update(key, value);
    }
  };
  const valid = (step: number) =>
    isPathwayStepValid(step, answers, config.questions);
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
                  (question.type === "multi-select" ? [] : "")
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
                    ? (validateCharacterCount(
                        String(answers.questionResponses[question.id] ?? ""),
                        question.minimum,
                        question.maximum,
                      ).message ?? "")
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
        />
      );
    return (
      <ReviewStep
        track={track}
        answers={answers}
        portfolio={answers.portfolio}
        onEdit={goToStep}
      />
    );
  };
  return (
    <div className="astra-application-panel" ref={panel}>
      <OnboardingForm
        application={{
          steps: stages,
          renderStep,
          canProceed: valid,
          onNext: async (step) => valid(step),
          onInvalid: (step) => {
            setAttemptedStep(step);
            setInvalidAttempt((attempt) => attempt + 1);
          },
          onDone: () => {},
          submitting: false,
        }}
      />
    </div>
  );
}
