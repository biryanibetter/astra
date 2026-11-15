import { z } from "zod";
import { countCharacters } from "@/components/pathway-question-validation";
import { pathwayQuestions } from "@/components/pathway-questions";

const text = (min: number, max: number) =>
  z
    .string()
    .refine(
      (v) =>
        v.trim().length > 0 &&
        countCharacters(v) >= min &&
        countCharacters(v) <= max,
      `Use ${min}–${max} characters.`,
    );
export const emailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .pipe(z.email().max(254));
export const trackSchema = z.enum(["core", "fellow"]);
export const pathwaySubmissionSchema = z
  .strictObject({
    track: trackSchema,
    fullName: z.string().trim().pipe(text(2, 100)),
    email: emailSchema,
    school: z.string().trim().pipe(text(2, 150)),
    grade: z.enum([
      "grade-6-year-7",
      "grade-7-year-8",
      "grade-8-year-9",
      "grade-9-year-10",
      "grade-10-year-11",
      "grade-11-year-12",
      "grade-12-year-13",
    ]),
    ageEligible: z.literal(true),
    questionResponses: z.record(
      z.string(),
      z.union([z.string(), z.array(z.string())]),
    ),
    projects: z
      .array(
        z
          .strictObject({
            title: z.string().trim().max(120),
            description: z.string().trim().max(600),
          })
          .refine((v) => Boolean(v.title || v.description)),
      )
      .min(1)
      .max(5),
    links: z
      .array(
        z.strictObject({
          type: z.string().trim().max(60),
          label: z.string().trim().max(120),
          url: z
            .string()
            .trim()
            .max(2048)
            .refine((v) => {
              try {
                const url = new URL(v);
                return (
                  ["http:", "https:"].includes(url.protocol) &&
                  !url.username &&
                  !url.password
                );
              } catch {
                return false;
              }
            }),
        }),
      )
      .max(5),
  })
  .superRefine((value, ctx) => {
    const questions = pathwayQuestions[value.track].questions;
    const expected = questions.map((q) => q.id);
    if (
      Object.keys(value.questionResponses).some((id) => !expected.includes(id))
    ) {
      ctx.addIssue({
        code: "custom",
        path: ["questionResponses"],
        message: "Unknown question.",
      });
    }
    for (const q of questions) {
      const answer = value.questionResponses[q.id];
      const valid =
        q.type === "textarea"
          ? text(q.minimum, q.maximum).safeParse(answer).success
          : q.type === "single-select"
            ? typeof answer === "string" && q.options.includes(answer)
            : Array.isArray(answer) &&
              answer.length > 0 &&
              new Set(answer).size === answer.length &&
              answer.every((option) => q.options.includes(option));
      if (!valid)
        ctx.addIssue({
          code: "custom",
          path: ["questionResponses", q.id],
          message: "Check this answer.",
        });
    }
  });
export type PathwaySubmission = z.infer<typeof pathwaySubmissionSchema>;
export const MAX_CV_BYTES = 5 * 1024 * 1024;
export const MAX_CVS = 3;
export const MAX_REQUEST_BYTES = MAX_CV_BYTES * MAX_CVS + 64 * 1024;
