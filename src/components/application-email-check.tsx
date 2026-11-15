"use client";

import { useState } from "react";
import { TurnstileCheck } from "./turnstile";

export async function applicationPost(path: string, body: unknown) {
  const response = await fetch(path, {
    method: "POST",
    credentials: "same-origin",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(20000),
  });
  const result = await response.json();
  if (!response.ok)
    throw new Error(result.message || "The request could not be confirmed.");
  return result;
}

export function ApplicationEmailCheck({
  email,
  track,
  available,
  verified,
  onVerified,
}: {
  email: string;
  track: "core" | "fellow";
  available: boolean;
  verified: boolean;
  onVerified: (email: string, round: string) => void;
}) {
  const [sentTo, setSentTo] = useState("");
  const [code, setCode] = useState("");
  const [captcha, setCaptcha] = useState("");
  const [captchaVersion, setCaptchaVersion] = useState(0);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const normalized = email.trim().toLowerCase();
  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
  const send = async () => {
    if (busy) return;
    setBusy(true);
    setMessage("");
    try {
      await applicationPost("/api/pathway/email", {
        action: "send",
        email: normalized,
        track,
        captcha,
      });
      setSentTo(normalized);
      setCode("");
      setMessage(
        "An Astra verification code has been requested. Check your inbox.",
      );
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Please try again.");
    } finally {
      setBusy(false);
      setCaptcha("");
      setCaptchaVersion((v) => v + 1);
    }
  };
  const verify = async () => {
    if (busy) return;
    setBusy(true);
    setMessage("");
    try {
      await applicationPost("/api/pathway/email", {
        action: "verify",
        email: normalized,
        track,
        code,
      });
      const result = await applicationPost("/api/pathway/eligibility", {
        email: normalized,
        track,
      });
      if (result.eligible !== true) {
        setMessage(
          "You have already submitted for this pathway in this intake round.",
        );
        return;
      }
      if (typeof result.round !== "string")
        throw new Error("The intake round could not be confirmed.");
      onVerified(normalized, result.round);
      setMessage("Email verified. You can continue.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Please try again.");
    } finally {
      setBusy(false);
    }
  };
  if (!available || !siteKey) return null;
  return (
    <section
      className="field application-email-check"
      aria-label="Email verification"
      aria-busy={busy}
    >
      <p className="field-hint">
        Verify your email before continuing. You can apply once per pathway in
        each intake round.
      </p>
      {verified ? (
        <p role="status">Email verified.</p>
      ) : (
        <>
          <TurnstileCheck
            key={captchaVersion}
            siteKey={siteKey}
            onToken={setCaptcha}
          />
          <button
            type="button"
            onClick={() => void send()}
            disabled={busy || !captcha || !normalized}
          >
            {busy
              ? "Please wait…"
              : sentTo && sentTo === normalized
                ? "Resend code"
                : "Send verification code"}
          </button>
          {sentTo && sentTo === normalized ? (
            <div className="field">
              <label htmlFor="application-email-code">
                Email verification code
              </label>
              <input
                id="application-email-code"
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={10}
                value={code}
                onChange={(event) =>
                  setCode(event.target.value.replace(/\D/gu, ""))
                }
              />
              <button
                type="button"
                disabled={busy || code.length < 6}
                onClick={() => void verify()}
              >
                Verify email
              </button>
            </div>
          ) : null}
        </>
      )}
      {message ? (
        <p role="status" aria-live="polite">
          {message}
        </p>
      ) : null}
    </section>
  );
}
