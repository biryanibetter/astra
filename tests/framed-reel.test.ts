import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { FramedReel } from "@/components/home/framed-reel";

describe("framed reel", () => {
  it("renders decorative animated artwork, never a media player", () => {
    const html = renderToStaticMarkup(createElement(FramedReel));
    expect(html).toContain('src="/media/astra-reel-loop.webp"');
    expect(html).toContain('src="/media/astra-reel-still.webp"');
    expect(html).toContain('width="1280"');
    expect(html).toContain('height="720"');
    expect(html).toContain('draggable="false"');
    expect(html).toContain('aria-hidden="true"');
    expect(html).not.toMatch(/<(video|audio|iframe|button|track)\b/);
    expect(html).not.toContain(".mp4");
    expect(html).not.toContain("Reel to come");
  });

  it("preserves the silver frame and existing copy", () => {
    const html = renderToStaticMarkup(createElement(FramedReel));
    expect(html).toContain('class="reel-frame"');
    expect(html).toContain('class="reel-frame-inner"');
    expect(html).toContain("Ideas are better in motion.");
    expect(html).toContain(
      "This reel is a first glimpse of the energy, ambition and creativity behind the network.",
    );
  });
});
