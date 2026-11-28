import { createElement } from "react";
import { vi } from "vitest";

/// <reference types="vitest/globals" />

vi.mock("framer-motion", () => ({
  useInView: () => true,
  AnimatePresence: ({ children }: { children: React.ReactNode }) => children,
  motion: {
    div: ({ children, ...props }: React.HTMLAttributes<HTMLDivElement>) =>
      createElement("div", props, children),
    article: ({ children, ...props }: React.HTMLAttributes<HTMLElement>) =>
      createElement("article", props, children),
  },
}));

vi.mock("@/lib/system-motion-preference", () => ({
  useSystemReducedMotion: () => false,
}));

vi.mock("@/lib/motion-preference", () => ({
  useReducedMotion: () => false,
  getReducedMotion: () => false,
}));

vi.mock("next/image", () => ({
  default: ({
    src,
    alt,
    ...props
  }: React.ImgHTMLAttributes<HTMLImageElement> & {
    fill?: boolean;
    sizes?: string;
    priority?: boolean;
    preload?: boolean;
    loading?: "lazy" | "eager";
  }) => createElement("img", { src, alt, ...props }),
}));

vi.mock("@/components/ui/typewriter", () => ({
  Typewriter: ({ phrases }: { phrases: readonly string[] }) =>
    createElement("span", { "data-testid": "typewriter" }, phrases[0]),
}));

vi.mock("@/components/ui/shiny-button", () => ({
  ShinyAction: ({
    children,
    ...props
  }: React.ButtonHTMLAttributes<HTMLButtonElement>) =>
    createElement("button", { type: "button", ...props }, children),
}));

import { createElement as ce } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { ApplicationIntroduction } from "@/components/application-presentation/application-introduction";

describe("application introduction carousel controls", () => {
  it.each([
    ["core", "Be part of the team."],
    ["fellow", "Your project at Astra."],
  ] as const)("renders the %s introduction heading in SSR", (track, title) => {
    const html = renderToStaticMarkup(ce(ApplicationIntroduction, { track }));

    expect(html).toContain(`aria-label="${title}"`);
    // During SSR, the heading is rendered as a plain span (Typewriter mounts client-side)
    expect(html).toContain(`>${title}<`);
  });

  it("keeps slide copy present and exposes only the two arrow controls", () => {
    const html = renderToStaticMarkup(
      ce(ApplicationIntroduction, { track: "core" }),
    );

    expect(html).toContain("Behind the scenes.");
    expect(html).toContain(
      "Help plan, coordinate and deliver the initiatives that bring Astra to life.",
    );
    expect(html.match(/aria-label="(?:Previous|Next) slide"/g)).toHaveLength(2);
    expect(html).not.toContain("Show slide");
    expect(html).not.toContain("Pause slideshow");
  });
});
