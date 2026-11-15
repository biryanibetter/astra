import "server-only";
import { createHash, createHmac } from "node:crypto";
import { isIP } from "node:net";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
import { HttpError } from "./http";

const configSchema = z.object({
  SITE_URL: z
    .url()
    .refine(
      (v) =>
        new URL(v).protocol === "https:" ||
        (process.env.NODE_ENV !== "production" &&
          new URL(v).hostname === "localhost"),
    ),
  SUPABASE_URL: z
    .url()
    .refine(
      (v) =>
        new URL(v).protocol === "https:" ||
        (process.env.NODE_ENV !== "production" &&
          ["localhost", "127.0.0.1"].includes(new URL(v).hostname)),
    ),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(20),
  SUPABASE_PUBLISHABLE_KEY: z.string().min(20),
  APPLICATION_IP_SALT: z.string().min(32),
  APPLICATION_DUPLICATE_SALT: z.string().min(32),
  APPLICATION_AUTH_RETENTION_DAYS: z.coerce
    .number()
    .int()
    .min(7)
    .max(365)
    .default(30),
  APPLICATION_RETENTION_DAYS: z.coerce
    .number()
    .int()
    .min(1)
    .max(365)
    .default(90),
});
export function config(intake = false) {
  const parsed = configSchema.safeParse(process.env);
  if (
    !parsed.success ||
    (intake &&
      (process.env.APPLICATIONS_OPEN !== "true" ||
        process.env.PRIVACY_REVIEWED !== "true" ||
        process.env.APPLICATION_AUTH_CAPTCHA_ENABLED !== "true"))
  ) {
    throw new HttpError(
      503,
      "Applications are not open. Please check back later.",
    );
  }
  return parsed.data;
}
export function database() {
  const env = config();
  return createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: {
      fetch: (url, init) =>
        fetch(url, { ...init, signal: AbortSignal.timeout(10000) }),
    },
  });
}
export function authClient() {
  const env = config();
  return createClient(env.SUPABASE_URL, env.SUPABASE_PUBLISHABLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: {
      fetch: (url, init) =>
        fetch(url, { ...init, signal: AbortSignal.timeout(10000) }),
    },
  });
}
export function digest(bytes: Uint8Array | string) {
  return createHash("sha256").update(bytes).digest("hex");
}
export function duplicateFingerprint(email: string) {
  return createHmac("sha256", config().APPLICATION_DUPLICATE_SALT)
    .update(`duplicate-email:${email.trim().toLowerCase()}`)
    .digest("hex");
}
export async function rate(
  request: Request,
  scope: string,
  max: number,
  email = "",
) {
  const env = config();
  const proxy = process.env.APPLICATION_TRUSTED_PROXY;
  const ip =
    process.env.NODE_ENV !== "production"
      ? "local-development"
      : proxy === "cloudflare"
        ? request.headers.get("cf-connecting-ip")
        : proxy === "vercel"
          ? request.headers.get("x-vercel-forwarded-for")
          : null;
  if (!ip || (process.env.NODE_ENV === "production" && !isIP(ip))) {
    throw new HttpError(503, "Trusted request routing is not configured.");
  }
  for (const [key, maximum] of [
    [`${scope}:ip:${ip}`, Math.min(100, max * 10)] as const,
    ...(email ? [[`${scope}:email:${email}`, max] as const] : []),
  ]) {
    const fingerprint = createHmac("sha256", env.APPLICATION_IP_SALT)
      .update(key)
      .digest("hex");
    const result = await database().rpc("astra_limit", {
      p_fingerprint: fingerprint,
      p_max: maximum,
    });
    if (result.error || typeof result.data !== "boolean")
      throw new HttpError(503, "Please try again later.");
    if (!result.data)
      throw new HttpError(429, "Too many attempts. Please try again later.");
  }
}
