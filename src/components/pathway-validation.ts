import {
  coreCommitments,
  getGradeLabel,
  type Pathway,
  type PathwayQuestion,
  pathwayQuestions,
} from "./pathway-form-questions";
import {
  hasValidCV,
  isPortfolioValid,
  type PortfolioData,
} from "./portfolio-builder";

export type PathwayAnswers = {
  fullName: string;
  email: string;
  school: string;
  grade: string;
  ageEligible: boolean;
  questionResponses: Record<string, string | string[]>;
  portfolio: PortfolioData;
  commitments: Partial<Record<(typeof coreCommitments)[number]["id"], boolean>>;
};

export const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function profileRequirements(
  answers: Pick<
    PathwayAnswers,
    "fullName" | "email" | "school" | "grade" | "ageEligible"
  >,
) {
  return {
    fullName: answers.fullName.trim().length >= 2,
    email: EMAIL_PATTERN.test(answers.email.trim()),
    school: answers.school.trim().length >= 2,
    grade: Boolean(getGradeLabel(answers.grade)),
    ageEligible: answers.ageEligible === true,
  };
}

function countChars(text: string): number {
  return text.trim().length;
}

export function isResponseValid(
  question: PathwayQuestion,
  response: string | string[] | undefined,
) {
  switch (question.type) {
    case "textarea": {
      if (question.optional === true) {
        return true;
      }
      if (typeof response !== "string" || !response.trim()) {
        return false;
      }
      const charCount = countChars(response);
      if (question.minChars !== undefined && charCount < question.minChars) {
        return false;
      }
      if (question.maxChars !== undefined && charCount > question.maxChars) {
        return false;
      }
      return true;
    }
    case "single-select":
      return (
        typeof response === "string" && question.options.includes(response)
      );
    case "multi-select":
      return (
        Array.isArray(response) &&
        response.length > 0 &&
        new Set(response).size === response.length &&
        response.every((option) => question.options.includes(option))
      );
  }
}

export function pathwayValidation(track: Pathway, answers: PathwayAnswers) {
  const {
    questions: [interest, ...questions],
    cvRequired,
  } = pathwayQuestions[track];
  const answered = (question: PathwayQuestion) =>
    isResponseValid(question, answers.questionResponses[question.id]);
  const required = {
    profile: [
      ...Object.values(profileRequirements(answers)),
      answered(interest),
    ],
    questions: questions
      .filter((question) => question.type !== "textarea" || !question.optional)
      .map(answered),
    portfolio: cvRequired ? [hasValidCV(answers.portfolio)] : [],
    commitments:
      track === "core"
        ? coreCommitments.map(({ id }) => answers.commitments?.[id] === true)
        : [],
  };
  const items = Object.values(required).flat();
  const completed = items.filter(Boolean).length;
  const total = items.length;
  const portfolioValid = isPortfolioValid(answers.portfolio);
  return {
    completed,
    total,
    percentage: Math.floor((completed / total) * 100),
    steps: {
      introduction: true,
      profile: required.profile.every(Boolean),
      questions: required.questions.every(Boolean),
      portfolio: required.portfolio.every(Boolean) && portfolioValid,
      commitments: required.commitments.every(Boolean),
      review: completed === total && portfolioValid,
    },
  };
}
