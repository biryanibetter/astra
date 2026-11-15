import { z } from "zod";
import {
  type ApplicationInput,
  applicationSchema,
  INTERESTS,
} from "./application";
import type { School } from "./schools";

export const SCHOOL_INTERESTS = INTERESTS;

export const schoolApplicationFieldsSchema = z
  .object({
    intent: z.enum(["interest", "founding"]),
    fullName: z.string().trim().min(2, "Enter your full name.").max(100),
    email: z
      .string()
      .trim()
      .max(254)
      .toLowerCase()
      .pipe(z.email("Enter a valid email address.")),
    grade: z
      .string()
      .trim()
      .min(1, "Enter your grade or academic year.")
      .max(50),
    ageEligible: z
      .boolean()
      .refine(Boolean, "Confirm that you are aged 13–18."),
    interests: z
      .array(z.enum(INTERESTS))
      .min(1, "Choose at least one interest.")
      .max(INTERESTS.length)
      .refine(
        (values) => new Set(values).size === values.length,
        "Choose each interest only once.",
      ),
    experience: z.string().trim().max(350, "Keep this under 350 characters."),
    motivation: z.string().trim().max(350, "Keep this under 350 characters."),
    privacyAcknowledged: z
      .boolean()
      .refine(Boolean, "Read and acknowledge the privacy notice."),
    website: z.string().max(0),
  })
  .strict()
  .superRefine((input, context) => {
    if (input.intent !== "founding") return;
    if (input.experience.length < 10)
      context.addIssue({
        code: "custom",
        path: ["experience"],
        message:
          "Tell us about an initiative or experience (at least 10 characters).",
      });
    if (input.motivation.length < 20)
      context.addIssue({
        code: "custom",
        path: ["motivation"],
        message: "Tell us why you want to contribute (at least 20 characters).",
      });
  });

export type SchoolApplicationInput = z.input<
  typeof schoolApplicationFieldsSchema
>;

// Reuse the established private, rate-limited, Turnstile-protected endpoint.
// Intent is retained explicitly in the restricted introduction field; it never
// creates a chapter or changes a public chapter status.
export function toMembershipApplication(
  input: SchoolApplicationInput,
  school: School,
  token: string,
): ApplicationInput {
  const parsed = schoolApplicationFieldsSchema.parse(input);
  return applicationSchema.parse({
    fullName: parsed.fullName,
    email: parsed.email,
    school: school.name,
    grade: parsed.grade,
    ageEligible: parsed.ageEligible,
    interests: parsed.interests,
    membership:
      parsed.intent === "founding" ? "School Representative" : "ASTRA Network",
    introduction: [
      `Intent: ${parsed.intent}`,
      `School slug: ${school.slug}`,
      `Experience: ${parsed.experience}`,
      `Motivation: ${parsed.motivation}`,
    ].join("\n"),
    privacyAcknowledged: parsed.privacyAcknowledged,
    website: parsed.website,
    turnstileToken: token,
  });
}
