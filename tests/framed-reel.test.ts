import { readFileSync } from "node:fs";
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

  it("keeps the original timeline with independent restart frames through the reel's sparse tail", () => {
    const reel = readFileSync("public/media/astra-reel-loop.webp");
    let elapsed = 0;
    let frames = 0;
    let repeat: number | undefined;
    let sinceRestart = 0;
    let maxDependentFrames = 0;
    const restartTimes: number[] = [];
    for (let cursor = 12; cursor + 8 <= reel.length; ) {
      const tag = reel.toString("ascii", cursor, cursor + 4);
      const size = reel.readUInt32LE(cursor + 4);
      const start = cursor + 8;
      if (tag === "ANIM") repeat = reel.readUInt16LE(start + 4);
      if (tag === "ANMF") {
        if (
          (reel.readUInt8(start + 15) & 2) !== 0 &&
          reel.readUIntLE(start, 3) === 0 &&
          reel.readUIntLE(start + 3, 3) === 0 &&
          reel.readUIntLE(start + 6, 3) === 1279 &&
          reel.readUIntLE(start + 9, 3) === 719
        ) {
          restartTimes.push(elapsed);
          sinceRestart = 0;
        } else {
          sinceRestart++;
          maxDependentFrames = Math.max(maxDependentFrames, sinceRestart);
        }
        elapsed += reel.readUIntLE(start + 12, 3);
        frames++;
      }
      cursor = start + size + (size % 2);
    }
    expect({ frames, elapsed, repeat }).toEqual({
      frames: 110,
      elapsed: 6124,
      repeat: 0,
    });
    expect(restartTimes).toEqual(
      expect.arrayContaining([1750, 2000, 3416, 4791, 5500]),
    );
    // A cold decode after scrolling back must not reconstruct a long chain.
    expect(maxDependentFrames).toBeLessThanOrEqual(12);
  });
});
