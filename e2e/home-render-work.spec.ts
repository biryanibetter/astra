import { expect, test } from "@playwright/test";

test("visible hero shimmer paints without re-clipping its silhouette each frame", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.addInitScript(() => {
    const proto = CanvasRenderingContext2D.prototype;
    const clip = proto.clip;
    const draw = proto.drawImage;
    proto.clip = function (this: CanvasRenderingContext2D, ...args: unknown[]) {
      if (this.canvas.classList.contains("creation-subject"))
        this.canvas.dataset.clips = String(
          Number(this.canvas.dataset.clips || 0) + 1,
        );
      Reflect.apply(clip, this, args);
    } as typeof clip;
    proto.drawImage = function (
      this: CanvasRenderingContext2D,
      ...args: unknown[]
    ) {
      if (this.canvas.classList.contains("creation-subject"))
        this.canvas.dataset.draws = String(
          Number(this.canvas.dataset.draws || 0) + 1,
        );
      Reflect.apply(draw, this, args);
    } as typeof draw;
  });
  await page.goto("/");
  const hero = page.locator(".hero .creation-artwork");
  await expect(hero).toHaveAttribute("data-ready", "true");
  const canvas = hero.locator("canvas.creation-subject");
  const paints = Number(await canvas.getAttribute("data-draws"));
  await expect
    .poll(async () => Number(await canvas.getAttribute("data-draws")))
    .toBeGreaterThan(paints + 12);
  expect(Number(await canvas.getAttribute("data-clips"))).toBe(0);
});

test("the original animated reel is presented only while in view", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto("/");
  const frame = page.locator(".reel-artwork");
  const still = frame.locator(".reel-artwork-still");
  const reel = frame.locator(".reel-artwork-loop");
  await page.locator(".network-map-wrap").scrollIntoViewIfNeeded();
  await expect(reel).toBeHidden();
  await frame.scrollIntoViewIfNeeded();
  await expect(still).toBeVisible();
  await expect(reel).toBeVisible();
  await expect(reel).toHaveAttribute("src", /\/media\/astra-reel-loop\.webp$/);
  await page.locator(".network-map-wrap").scrollIntoViewIfNeeded();
  await expect(reel).toBeHidden();
});
