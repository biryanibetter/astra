import { expect, test } from "@playwright/test";
import type Lenis from "lenis";

for (const motion of ["no-preference", "reduce"] as const) {
  test(`Lenis uses Astra's wheel settings with ${motion}`, async ({
    isMobile,
    page,
  }) => {
    await page.emulateMedia({ reducedMotion: motion });
    await page.goto("/");
    const readLenis = () =>
      page.evaluate(() => {
        const lenis = (window as Window & { __LENIS__?: Lenis }).__LENIS__;
        if (!lenis?.time) return null;
        return {
          lerp: lenis.options.lerp,
          smoothWheel: lenis.options.smoothWheel,
          wheelMultiplier: lenis.options.wheelMultiplier,
          syncTouch: lenis.options.syncTouch,
          autoRaf: lenis.options.autoRaf,
          reduced: lenis.prefersReducedMotion,
        };
      });
    const review = process.env.ASTRA_REVIEW_SMOOTH_SCROLL === "true";
    await expect.poll(readLenis).toEqual({
      lerp: 0.065,
      smoothWheel: true,
      wheelMultiplier: 1,
      syncTouch: false,
      autoRaf: false,
      reduced: !review && motion === "reduce",
    });
    // The exact wheel delta is a desktop check; mobile swipe is tested separately.
    if (isMobile || (!review && motion === "reduce")) return;
    await page.mouse.move(12, 140);
    await page.mouse.wheel(0, 320);
    await expect.poll(() => page.evaluate(() => scrollY)).toBe(320);
  });
}
