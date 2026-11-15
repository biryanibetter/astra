import { describe, expect, it } from "vitest";
import {
  containArtwork,
  ditherThreshold,
  heroArtworkFit,
  heroCellSize,
  pulseOpacity,
  sampleDitherCells,
  shimmerOpacity,
} from "@/lib/creation-dither";

describe("Creation of Adam dither sampling", () => {
  it("averages a whole cell instead of sampling its first pixel", () => {
    const data = new Uint8ClampedArray([
      0, 0, 0, 255, 255, 255, 255, 255, 0, 0, 0, 255, 255, 255, 255, 255,
    ]);
    const cells = sampleDitherCells(data, 2, 2, 2);
    expect(cells).toHaveLength(1);
    expect(cells[0]?.luminance).toBeCloseTo(0.5, 2);
    expect(cells[0]?.alpha).toBe(1);
  });

  it("keeps transparent negative space empty, including partial boundary cells", () => {
    const data = new Uint8ClampedArray([
      255, 255, 255, 255, 255, 255, 255, 0, 255, 255, 255, 0,
    ]);
    const cells = sampleDitherCells(data, 3, 1, 2);
    expect(cells).toHaveLength(1);
    expect(cells[0]?.alpha).toBe(0.5);
    expect(cells[0]?.luminance).toBe(1);
  });

  it("increases contrast without turning black background into visible pixels", () => {
    const data = new Uint8ClampedArray([
      0, 0, 0, 255, 64, 64, 64, 255, 192, 192, 192, 255,
    ]);
    const cells = sampleDitherCells(data, 3, 1, 1);
    expect(cells[0]?.luminance).toBe(0);
    expect(cells[1]?.luminance).toBeCloseTo(0.107, 2);
    expect(cells[2]?.luminance).toBeCloseTo(0.9, 2);
  });

  it("uses a repeatable ordered pattern, not per-frame randomness", () => {
    const thresholds = Array.from({ length: 16 }, (_, i) =>
      ditherThreshold(i % 4, Math.floor(i / 4)),
    );
    expect(new Set(thresholds).size).toBe(16);
    expect(ditherThreshold(0, 0)).toBe(0.03125);
    expect(ditherThreshold(4, 4)).toBe(ditherThreshold(0, 0));
  });
});

describe("artwork composition and pulse", () => {
  it("uses a denser reference grid and retains fine cells on mobile", () => {
    expect(heroCellSize(1440)).toBe(4);
    expect(heroCellSize(390)).toBe(2);
    expect(heroCellSize(320)).toBe(2);
  });

  it("frames the complete desktop image and crops only outer forearms on mobile", () => {
    const desktop = heroArtworkFit(1400, 640, 1400, 640);
    expect(desktop).toEqual({
      sx: 0,
      sy: 0,
      sw: 1400,
      sh: 640,
      x: 0,
      y: 0,
      width: 1400,
      height: 640,
    });
    const mobile = heroArtworkFit(1400, 640, 390, 320);
    expect(mobile.sx).toBe(224);
    expect(mobile.sw).toBe(952);
    // Both palms and all fingers (source x≈225..1097) remain in view.
    expect(mobile.sx).toBeLessThan(225);
    expect(mobile.sx + mobile.sw).toBeGreaterThan(1097);
    expect(mobile.width).toBe(390);
  });

  it("shimmers in bounded, phase-offset groups without extinguishing pixels", () => {
    const values = Array.from({ length: 60 }, (_, i) =>
      shimmerOpacity(i * 100, i % 6),
    );
    expect(Math.min(...values)).toBeGreaterThanOrEqual(0.52);
    expect(Math.max(...values)).toBeLessThanOrEqual(1);
    expect(
      Math.abs(shimmerOpacity(400, 0) - shimmerOpacity(400, 3)),
    ).toBeGreaterThan(0.02);
    expect(shimmerOpacity(400, 0)).toBe(shimmerOpacity(400, 0));
  });

  it("contains the complete source on narrow screens rather than cropping either hand", () => {
    expect(containArtwork(1400, 700, 390, 240)).toEqual({
      x: 0,
      y: 22.5,
      width: 390,
      height: 195,
    });
  });

  it("reserves a wide desktop composition", () => {
    expect(containArtwork(1400, 700, 1120, 560)).toEqual({
      x: 0,
      y: 0,
      width: 1120,
      height: 560,
    });
  });

  it("pulses smoothly without extinguishing the hands", () => {
    expect(pulseOpacity(0)).toBeCloseTo(0.85);
    expect(pulseOpacity(800)).toBeCloseTo(1);
    expect(pulseOpacity(2400)).toBeCloseTo(0.7);
    expect(pulseOpacity(3200)).toBeCloseTo(pulseOpacity(0));
  });
});
