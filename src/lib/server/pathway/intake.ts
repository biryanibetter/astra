import "server-only";
import { z } from "zod";
import { emailSchema, trackSchema } from "@/lib/pathway/schema";
import { APPLICANT_COOKIE, identity, setSession } from "./auth";
import {
  authClient,
  config,
  database,
  duplicateFingerprint,
  rate,
} from "./client";
import { assertOrigin, HttpError, readJson, reply, route } from "./http";

export async function activeRound() {
  const result = await database().rpc("astra_intake");
  if (result.error) throw new HttpError(503, "Intake could not be checked.");
  if (!result.data) throw new HttpError(503, "This intake round is closed.");
  return z.uuid().parse(result.data);
}
const emailInput = z.discriminatedUnion("action", [
  z.strictObject({
    action: z.literal("send"),
    email: emailSchema,
    track: trackSchema,
    captcha: z.string().min(1).max(4096),
  }),
  z.strictObject({
    action: z.literal("verify"),
    email: emailSchema,
    track: trackSchema,
    code: z.string().regex(/^\d{6,10}$/u),
  }),
]);
export const sendEmail = route(async (request) => {
  assertOrigin(request);
  config(true);
  const parsed = emailInput.safeParse(await readJson(request));
  if (!parsed.success)
    throw new HttpError(400, "Check your email and verification fields.");
  const input = parsed.data;
  await rate(
    request,
    input.action === "send" ? "email-send" : "email-verify",
    input.action === "send" ? 6 : 15,
    input.email,
  );
  await activeRound();
  const client = authClient();
  if (input.action === "send") {
    // Supabase Auth consumes the Turnstile token server-side. Do not also call
    // siteverify here: Turnstile tokens are single-use. Enable Auth CAPTCHA
    // and restrict the widget's hostnames before opening intake.
    const result = await client.auth.signInWithOtp({
      email: input.email,
      options: {
        shouldCreateUser: true,
        captchaToken: input.captcha,
        data: { astra_intake_signup: true },
      },
    });
    if (result.error)
      throw new HttpError(
        503,
        "The verification request could not be completed. Please try later.",
      );
    return reply({
      message: "Check your inbox for an Astra verification code.",
    });
  }
  const result = await client.auth.verifyOtp({
    email: input.email,
    token: input.code,
    type: "email",
  });
  if (
    result.error ||
    !result.data.session ||
    !result.data.user?.email_confirmed_at
  ) {
    throw new HttpError(400, "The code expired or could not be verified.");
  }
  await setSession(
    APPLICANT_COOKIE,
    result.data.session.access_token,
    result.data.session.expires_in,
  );
  return reply({ verified: true });
});
export const eligibility = route(async (request) => {
  assertOrigin(request);
  config(true);
  const input = z
    .strictObject({ email: emailSchema, track: trackSchema })
    .safeParse(await readJson(request));
  if (!input.success) throw new HttpError(400, "Check the email and pathway.");
  const user = await identity();
  if (user.email !== input.data.email)
    throw new HttpError(403, "Verify this email address before continuing.");
  await rate(request, "eligibility", 40, user.email);
  const round = await activeRound();
  const result = await database()
    .from("astra_duplicate_markers")
    .select("email_fingerprint", { count: "exact", head: true })
    .eq("email_fingerprint", duplicateFingerprint(user.email))
    .eq("track", input.data.track)
    .eq("round_id", round);
  if (result.error)
    throw new HttpError(503, "Eligibility could not be checked. Please retry.");
  return reply({ eligible: result.count === 0, round });
});
