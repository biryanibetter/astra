"use client";

import Script from "next/script";
import { useEffect, useRef, useState } from "react";

type Turnstile = {
  render: (
    element: HTMLElement,
    options: {
      sitekey: string;
      action: string;
      theme: string;
      callback: (token: string) => void;
      "expired-callback": () => void;
      "error-callback": () => void;
    },
  ) => string;
  remove: (id: string) => void;
};
declare global {
  interface Window {
    turnstile?: Turnstile;
  }
}

export function TurnstileCheck({
  siteKey,
  onToken,
}: {
  readonly siteKey: string;
  readonly onToken: (token: string) => void;
}) {
  const container = useRef<HTMLDivElement>(null);
  const callback = useRef(onToken);
  callback.current = onToken;
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    if (!ready || !container.current || !window.turnstile) return;
    const api = window.turnstile;
    const id = api.render(container.current, {
      sitekey: siteKey,
      action: "application",
      theme: "dark",
      callback: (token) => {
        setFailed(false);
        callback.current(token);
      },
      "expired-callback": () => callback.current(""),
      "error-callback": () => {
        setFailed(true);
        callback.current("");
      },
    });
    return () => api.remove(id);
  }, [ready, siteKey]);
  return (
    <div>
      <Script
        src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit"
        strategy="afterInteractive"
        onReady={() => setReady(true)}
        onError={() => setFailed(true)}
      />
      <div ref={container} />
      {failed ? (
        <p className="field-error" role="alert">
          The security check could not load. Check your connection and reload
          the page.
        </p>
      ) : null}
    </div>
  );
}
