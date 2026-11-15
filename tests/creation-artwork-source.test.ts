import { act, createElement, StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, expect, test, vi } from "vitest";
import { CreationArtwork } from "@/components/home/creation-artwork";

vi.mock("@/components/home/use-cinematic-depth", () => ({
  useCinematicDepth: () => {},
}));

afterEach(() => {
  document.body.replaceChildren();
});

test("responsive artwork source survives Strict Mode setup and releases on unmount", async () => {
  const host = document.createElement("div");
  document.body.append(host);
  const root = createRoot(host);
  await act(async () =>
    root.render(
      createElement(StrictMode, null, createElement(CreationArtwork)),
    ),
  );
  const source = host.querySelector("picture source[media]");
  expect(source?.getAttribute("srcset")).toBe(
    "/images/creation-dither-mobile.webp",
  );
  await act(async () => root.unmount());
  expect(source?.parentNode).toBeNull();
});
