import "server-only";
import { z } from "zod";

const configurationSchema = z.object({
  APPLICATIONS_OPEN: z.literal("true"),
  PRIVACY_REVIEWED: z.literal("true"),
  SITE_URL: z
    .url()
    .refine(
      (value) =>
        new URL(value).protocol === "https:" ||
        (process.env.NODE_ENV !== "production" &&
          new URL(value).hostname === "localhost"),
    ),
  CONTACT_EMAIL: z.email(),
  SUPABASE_URL: z.url(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(20),
  TURNSTILE_SECRET_KEY: z.string().min(10),
  NEXT_PUBLIC_TURNSTILE_SITE_KEY: z.string().min(1),
  APPLICATION_IP_SALT: z.string().min(32),
  APPLICATION_RETENTION_DAYS: z.coerce
    .number()
    .int()
    .min(1)
    .max(365)
    .default(90),
});
export function applicationConfiguration() {
  return configurationSchema.safeParse({
    APPLICATIONS_OPEN: process.env.APPLICATIONS_OPEN,
    PRIVACY_REVIEWED: process.env.PRIVACY_REVIEWED,
    SITE_URL: process.env.SITE_URL,
    CONTACT_EMAIL: process.env.CONTACT_EMAIL,
    SUPABASE_URL: process.env.SUPABASE_URL,
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
    TURNSTILE_SECRET_KEY: process.env.TURNSTILE_SECRET_KEY,
    NEXT_PUBLIC_TURNSTILE_SITE_KEY: process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY,
    APPLICATION_IP_SALT: process.env.APPLICATION_IP_SALT,
    APPLICATION_RETENTION_DAYS: process.env.APPLICATION_RETENTION_DAYS,
  });
}
