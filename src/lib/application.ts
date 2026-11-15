import { z } from "zod";

export const INTERESTS = [
  "Technology",
  "AI",
  "Programming",
  "Entrepreneurship",
  "Business",
  "Science",
  "Engineering",
  "Design",
  "Media",
] as const;
export const MEMBERSHIP_INTERESTS = [
  "ASTRA Network",
  "ASTRA Core",
  "School Representative",
] as const;
export const PRIVACY_VERSION = "2026-10-draft";
export const applicationFieldsSchema = z.object({
  fullName: z.string().trim().min(2, "Enter your full name.").max(100),
  email: z
    .string()
    .trim()
    .max(254)
    .toLowerCase()
    .pipe(z.email("Enter a valid email address.")),
  school: z.string().trim().min(2, "Enter your school name.").max(150),
  grade: z.string().trim().min(1, "Enter your grade or academic year.").max(50),
  ageEligible: z
    .boolean()
    .refine((value) => value, "Confirm that you are aged 13–18."),
  interests: z
    .array(z.enum(INTERESTS))
    .min(1, "Choose at least one interest.")
    .max(9)
    .refine(
      (values) => new Set(values).size === values.length,
      "Choose each interest only once.",
    ),
  membership: z.enum(MEMBERSHIP_INTERESTS, {
    error: "Choose a membership interest.",
  }),
  introduction: z
    .string()
    .trim()
    .max(1000, "Keep your introduction under 1,000 characters."),
  privacyAcknowledged: z
    .boolean()
    .refine((value) => value, "Read and acknowledge the privacy notice."),
});
export const applicationSchema = applicationFieldsSchema
  .extend({
    website: z.string().max(0),
    turnstileToken: z.string().min(1, "Complete the security check.").max(2048),
  })
  .strict();
export type ApplicationInput = z.input<typeof applicationSchema>;
export const applicationResponseSchema = z.object({ id: z.uuid() });
