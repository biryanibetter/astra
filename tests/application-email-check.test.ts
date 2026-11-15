import { act, createElement } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, expect, it, vi } from "vitest";
import { ApplicationEmailCheck } from "@/components/application-email-check";

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
  document.body.innerHTML = "";
});

it("renders nothing and makes no requests when unconfigured", async () => {
  vi.stubEnv("NEXT_PUBLIC_TURNSTILE_SITE_KEY", "");
  vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
  const fetch = vi.fn();
  vi.stubGlobal("fetch", fetch);
  const onVerified = vi.fn();
  const element = document.createElement("div");
  document.body.append(element);
  const root = createRoot(element);
  try {
    await act(async () => {
      root.render(
        createElement(ApplicationEmailCheck, {
          email: "",
          track: "core",
          available: false,
          verified: false,
          onVerified,
        }),
      );
    });
    expect(element.textContent).toBe("");
    expect(element.querySelector("input, button, iframe")).toBeNull();
    expect(element.textContent).not.toContain("not configured");
    expect(fetch).not.toHaveBeenCalled();
    expect(onVerified).not.toHaveBeenCalled();
  } finally {
    await act(async () => root.unmount());
  }
});

it("does not show a code input before a code has been requested", async () => {
  vi.stubEnv("NEXT_PUBLIC_TURNSTILE_SITE_KEY", "1x00000000000000000000AA");
  vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
  const element = document.createElement("div");
  document.body.append(element);
  const root = createRoot(element);
  try {
    await act(async () => {
      root.render(
        createElement(ApplicationEmailCheck, {
          email: "",
          track: "fellow",
          available: true,
          verified: false,
          onVerified: vi.fn(),
        }),
      );
    });
    expect(element.textContent).toContain("Send verification code");
    expect(element.querySelector("#application-email-code")).toBeNull();
    expect(element.textContent).not.toContain("Resend code");
  } finally {
    await act(async () => root.unmount());
  }
});

it("hides verification controls when a sitekey exists but intake is unavailable", async () => {
  vi.stubEnv("NEXT_PUBLIC_TURNSTILE_SITE_KEY", "1x00000000000000000000AA");
  vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
  const element = document.createElement("div");
  document.body.append(element);
  const root = createRoot(element);
  try {
    await act(async () => {
      root.render(
        createElement(ApplicationEmailCheck, {
          email: "synthetic@example.org",
          track: "core",
          available: false,
          verified: false,
          onVerified: vi.fn(),
        }),
      );
    });
    expect(element.textContent).toBe("");
    expect(element.querySelector("input, button, iframe")).toBeNull();
  } finally {
    await act(async () => root.unmount());
  }
});
