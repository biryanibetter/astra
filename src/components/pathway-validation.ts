import { validateCharacterCount } from "./pathway-question-validation";
import type { PathwayQuestion } from "./pathway-questions";
import { isPortfolioValid, type PortfolioData } from "./portfolio-builder";

export type PathwayAnswers = {
  fullName: string;
  email: string;
  school: string;
  grade: string;
  ageEligible: boolean;
  questionResponses: Record<string, string | string[]>;
  portfolio: PortfolioData;
};

export const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function isResponseValid(
  question: PathwayQuestion,
  response: string | string[] | undefined,
) {
  if (question.type === "textarea") {
    return validateCharacterCount(
      typeof response === "string" ? response : "",
      question.minimum,
      question.maximum,
    ).valid;
  }
  return Array.isArray(response) ? response.length > 0 : Boolean(response);
}

/** Steps: 0 introduction, 1 profile, 2 questions, 3 portfolio, 4 review. */
export function isPathwayStepValid(
  step: number,
  answers: PathwayAnswers,
  questions: readonly PathwayQuestion[],
): boolean {
  if (step === 1) {
    const first = questions[0];
    if (!first) return false;
    return (
      answers.fullName.trim().length >= 2 &&
      EMAIL_PATTERN.test(answers.email.trim()) &&
      answers.school.trim().length >= 2 &&
      Boolean(answers.grade.trim()) &&
      answers.ageEligible &&
      isResponseValid(first, answers.questionResponses[first.id])
    );
  }
  if (step === 2) {
    return questions
      .slice(1)
      .every((question) =>
        isResponseValid(question, answers.questionResponses[question.id]),
      );
  }
  if (step === 3) return isPortfolioValid(answers.portfolio);
  if (step === 4) {
    return [1, 2, 3].every((prior) =>
      isPathwayStepValid(prior, answers, questions),
    );
  }
  return true;
}
