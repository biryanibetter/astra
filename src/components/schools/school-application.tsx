"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import ky, { HTTPError } from "ky";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { TurnstileCheck } from "@/components/turnstile";
import { applicationResponseSchema } from "@/lib/application";
import {
  SCHOOL_INTERESTS,
  type SchoolApplicationInput,
  schoolApplicationFieldsSchema,
  toMembershipApplication,
} from "@/lib/school-application";
import type { School } from "@/lib/schools";

const errorSchema = z.object({ message: z.string().max(500) });
const steps = ["Your details", "Your interests", "Review"] as const;
export function SchoolApplication({
  school,
  enabled,
  siteKey,
  initialIntent = "interest",
}: {
  school: School;
  enabled: boolean;
  siteKey: string;
  initialIntent?: "interest" | "founding";
}) {
  const [step, setStep] = useState(0);
  const [saved, setSaved] = useState(false);
  const [message, setMessage] = useState("");
  const [captchaAttempt, setCaptchaAttempt] = useState(0);
  const [turnstileToken, setTurnstileToken] = useState("");
  const heading = useRef<HTMLHeadingElement>(null);
  const previousStep = useRef(step);
  const form = useForm<SchoolApplicationInput>({
    resolver: zodResolver(schoolApplicationFieldsSchema),
    mode: "onTouched",
    defaultValues: {
      intent: initialIntent,
      fullName: "",
      email: "",
      grade: "",
      ageEligible: false,
      interests: [],
      experience: "",
      motivation: "",
      privacyAcknowledged: false,
      website: "",
    },
  });
  const {
    register,
    handleSubmit,
    watch,
    trigger,
    formState: { errors, isSubmitting },
  } = form;
  const values = watch();
  useEffect(() => {
    if (saved || previousStep.current !== step) heading.current?.focus();
    previousStep.current = step;
  }, [saved, step]);
  async function next() {
    const fields =
      step === 0
        ? (["intent", "fullName", "email", "grade", "ageEligible"] as const)
        : ([
            "interests",
            ...(values.intent === "founding"
              ? (["experience", "motivation"] as const)
              : []),
            "privacyAcknowledged",
          ] as const);
    if (await trigger(fields as never, { shouldFocus: true }))
      setStep(step + 1);
  }
  async function submit(input: SchoolApplicationInput) {
    if (!enabled || !turnstileToken || saved) return;
    setMessage("");
    try {
      const response = await ky.post("/api/applications", {
        json: toMembershipApplication(input, school, turnstileToken),
        retry: 0,
        timeout: 30000,
      });
      const parsed = applicationResponseSchema.safeParse(
        await response.json<unknown>(),
      );
      if (response.status !== 201 || !parsed.success) {
        setMessage(
          "We could not confirm receipt. Please contact the team before trying again.",
        );
        return;
      }
      setSaved(true);
    } catch (error) {
      if (error instanceof HTTPError) {
        const parsed = errorSchema.safeParse(
          await error.response.json<unknown>().catch(() => null),
        );
        setMessage(
          parsed.success
            ? parsed.data.message
            : "The application could not be accepted. Please try again later.",
        );
      } else
        setMessage(
          "We could not confirm delivery. Check your connection before trying again.",
        );
    } finally {
      setTurnstileToken("");
      setCaptchaAttempt((n) => n + 1);
    }
  }
  if (saved)
    return (
      <section className="school-form-card" role="status">
        <p className="eyebrow">APPLICATION RECEIVED</p>
        <h2 ref={heading} tabIndex={-1} className="display">
          Thanks for reaching out.
        </h2>
        <p>
          Your application was received. This does not confirm participation.
          Guardian authorization and safeguarding arrangements are handled
          separately before participation where required.
        </p>
        <Link
          className="school-action secondary"
          href={`/schools/${school.slug}`}
        >
          Back to school profile
        </Link>
      </section>
    );
  return (
    <section className="school-form-card">
      <div className="school-form-top">
        <p className="eyebrow">
          {values.intent === "founding"
            ? "HELP START A CHAPTER"
            : "EXPRESS INTEREST"}
        </p>
        <span>
          {step + 1} / {steps.length}
        </span>
      </div>
      <progress
        value={step + 1}
        max={steps.length}
        aria-label="Application steps"
      />
      <h2 ref={heading} tabIndex={-1} className="display">
        {steps[step]}
      </h2>
      {!enabled && (
        <div className="school-intake-notice" role="status">
          <strong>Applications aren&apos;t open yet.</strong>
          <p>
            You can explore these questions, but sending is disabled until
            privacy review and service setup are complete. Nothing you enter is
            saved.
          </p>
        </div>
      )}
      {message && (
        <p className="school-form-error" role="alert">
          {message}
        </p>
      )}
      <form
        noValidate
        onKeyDown={(event) => {
          if (
            event.key === "Enter" &&
            step < 2 &&
            !(event.target instanceof HTMLTextAreaElement) &&
            !(event.target instanceof HTMLButtonElement)
          ) {
            event.preventDefault();
            void next();
          }
        }}
        onSubmit={(event) => {
          event.preventDefault();
          if (step < 2) void next();
          else void handleSubmit(submit)(event);
        }}
      >
        {step === 0 && (
          <div className="school-form-fields">
            <label>
              How would you like to get involved?
              <select {...register("intent")}>
                <option value="interest">Express interest</option>
                <option value="founding">Help start a chapter</option>
              </select>
            </label>
            <label>
              Full name
              <input
                autoComplete="name"
                maxLength={100}
                aria-invalid={Boolean(errors.fullName)}
                aria-describedby={
                  errors.fullName ? "school-full-name-error" : undefined
                }
                {...register("fullName")}
              />
              {errors.fullName && (
                <small id="school-full-name-error" role="alert">
                  {errors.fullName.message}
                </small>
              )}
            </label>
            <label>
              Email address
              <input
                type="email"
                autoComplete="email"
                spellCheck={false}
                maxLength={254}
                aria-invalid={Boolean(errors.email)}
                aria-describedby={
                  errors.email ? "school-email-error" : undefined
                }
                {...register("email")}
              />
              {errors.email && (
                <small id="school-email-error" role="alert">
                  {errors.email.message}
                </small>
              )}
            </label>
            <label>
              Grade or year
              <input
                maxLength={50}
                aria-invalid={Boolean(errors.grade)}
                aria-describedby={
                  errors.grade ? "school-grade-error" : undefined
                }
                {...register("grade")}
              />
              {errors.grade && (
                <small id="school-grade-error" role="alert">
                  {errors.grade.message}
                </small>
              )}
            </label>
            <label className="school-check">
              <input
                type="checkbox"
                aria-invalid={Boolean(errors.ageEligible)}
                aria-describedby={
                  errors.ageEligible ? "school-age-error" : undefined
                }
                {...register("ageEligible")}
              />
              I am aged 13–18.
              {errors.ageEligible && (
                <small id="school-age-error" role="alert">
                  {errors.ageEligible.message}
                </small>
              )}
            </label>
            <p className="school-authorization">
              A school listing is not an affiliation. This application does not
              grant school permission or guardian authorization. Those
              arrangements must be handled separately before any activity.
            </p>
          </div>
        )}
        {step === 1 && (
          <div className="school-form-fields">
            <fieldset
              aria-invalid={Boolean(errors.interests)}
              aria-describedby={
                errors.interests ? "school-interests-error" : undefined
              }
            >
              <legend>What are you curious about?</legend>
              <div className="school-interest-grid">
                {SCHOOL_INTERESTS.map((interest) => (
                  <label key={interest}>
                    <input
                      type="checkbox"
                      value={interest}
                      aria-invalid={Boolean(errors.interests)}
                      aria-describedby={
                        errors.interests ? "school-interests-error" : undefined
                      }
                      {...register("interests")}
                    />
                    {interest}
                  </label>
                ))}
              </div>
              {errors.interests && (
                <small id="school-interests-error" role="alert">
                  {errors.interests.message}
                </small>
              )}
            </fieldset>
            {values.intent === "founding" && (
              <>
                <label>
                  What have you tried so far?
                  <textarea
                    rows={3}
                    maxLength={350}
                    aria-invalid={Boolean(errors.experience)}
                    aria-describedby={
                      errors.experience ? "school-experience-error" : undefined
                    }
                    {...register("experience")}
                  />
                  {errors.experience && (
                    <small id="school-experience-error" role="alert">
                      {errors.experience.message}
                    </small>
                  )}
                </label>
                <label>
                  Why would you like to start a chapter here?
                  <textarea
                    rows={4}
                    maxLength={350}
                    aria-invalid={Boolean(errors.motivation)}
                    aria-describedby={
                      errors.motivation ? "school-motivation-error" : undefined
                    }
                    {...register("motivation")}
                  />
                  {errors.motivation && (
                    <small id="school-motivation-error" role="alert">
                      {errors.motivation.message}
                    </small>
                  )}
                </label>
              </>
            )}
            <label className="school-check">
              <input
                type="checkbox"
                aria-invalid={Boolean(errors.privacyAcknowledged)}
                aria-describedby={
                  errors.privacyAcknowledged
                    ? "school-privacy-error"
                    : undefined
                }
                {...register("privacyAcknowledged")}
              />
              I have read the <Link href="/privacy">privacy notice</Link>.
              {errors.privacyAcknowledged && (
                <small id="school-privacy-error" role="alert">
                  {errors.privacyAcknowledged.message}
                </small>
              )}
            </label>
          </div>
        )}
        {step === 2 && (
          <div className="school-review">
            <p>
              <span>Intent</span>
              {values.intent === "founding"
                ? "Help start a chapter"
                : "Express interest"}
            </p>
            <p>
              <span>Name</span>
              {values.fullName}
            </p>
            <p>
              <span>Email</span>
              {values.email}
            </p>
            <p>
              <span>School</span>
              {school.name}
            </p>
            <p>
              <span>Grade/year</span>
              {values.grade}
            </p>
            <p>
              <span>Aged 13–18</span>
              {values.ageEligible ? "Confirmed" : "Not confirmed"}
            </p>
            <p>
              <span>Interests</span>
              {values.interests.join(", ")}
            </p>
            {values.intent === "founding" && (
              <>
                <p>
                  <span>Experience</span>
                  {values.experience}
                </p>
                <p>
                  <span>Motivation</span>
                  {values.motivation}
                </p>
              </>
            )}
            <p>
              <span>Privacy</span>
              {values.privacyAcknowledged ? "Acknowledged" : "Not acknowledged"}
            </p>
            <p className="school-authorization">
              A submission is an expression of interest, not an affiliation,
              school authorization, or guardian consent.
            </p>
            <div className="school-honeypot" aria-hidden="true">
              <label>
                Leave empty
                <input
                  tabIndex={-1}
                  autoComplete="off"
                  {...register("website")}
                />
              </label>
            </div>
            {enabled && (
              <TurnstileCheck
                key={captchaAttempt}
                siteKey={siteKey}
                onToken={setTurnstileToken}
              />
            )}
          </div>
        )}
        <div className="school-form-actions">
          {step > 0 && (
            <button
              className="school-action secondary"
              type="button"
              disabled={isSubmitting}
              onClick={() => {
                setTurnstileToken("");
                setCaptchaAttempt((attempt) => attempt + 1);
                setStep(step - 1);
              }}
            >
              Back
            </button>
          )}
          {step < 2 ? (
            <button
              className="school-action"
              type="button"
              onClick={() => void next()}
            >
              Continue <span>→</span>
            </button>
          ) : (
            <button
              className="school-action"
              type="submit"
              disabled={!enabled || isSubmitting || !turnstileToken}
            >
              {isSubmitting
                ? "Sending…"
                : enabled
                  ? "Send application"
                  : "Sending unavailable"}
              <span>↗</span>
            </button>
          )}
        </div>
      </form>
    </section>
  );
}
