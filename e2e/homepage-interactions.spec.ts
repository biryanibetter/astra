import { expect, test } from "@playwright/test";

test("clears transient experience hover on window blur and resumes on pointer movement", async ({
  page,
}, testInfo) => {
  test.skip(testInfo.project.name !== "desktop", "Desktop hover rail");
  await page.goto("/", { waitUntil: "domcontentloaded" });
  await expect(page.locator("#events [data-ready]")).toHaveAttribute(
    "data-ready",
    "true",
  );
  const card = page.locator("[data-experience-index]").first();
  await card.scrollIntoViewIfNeeded();
  await card.hover();
  await expect(card).toHaveAttribute("data-active", "true");

  await page.evaluate(() => window.dispatchEvent(new Event("blur")));
  await expect(card).toHaveAttribute("data-active", "false");

  await card.hover({ position: { x: 30, y: 40 } });
  await expect(card).toHaveAttribute("data-active", "true");
});

test("keeps an intentional keyboard experience selection on window blur", async ({
  page,
}) => {
  await page.goto("/", { waitUntil: "domcontentloaded" });
  await expect(page.locator("#events [data-ready]")).toHaveAttribute(
    "data-ready",
    "true",
  );
  const cards = page.locator("[data-experience-index]");
  await cards.first().getByRole("group").press("ArrowRight");
  await expect(cards.nth(1)).toHaveAttribute("data-active", "true");

  await page.evaluate(() => window.dispatchEvent(new Event("blur")));
  await expect(cards.nth(1)).toHaveAttribute("data-active", "true");
});

test("founding members reveal is decorative and can be toggled and dismissed", async ({
  page,
}, testInfo) => {
  await page.goto("/", { waitUntil: "domcontentloaded" });
  const section = page.locator(".members-section");
  const toggle = section.getByRole("button", {
    name: "Reveal founding member placeholders",
  });
  const grid = section.locator(".member-grid");
  await expect(section.getByRole("button")).toHaveCount(1);
  await expect(grid.locator(".member-card")).toHaveCount(20);
  await expect(grid).toHaveCSS("opacity", "0");

  if (testInfo.project.name === "desktop") {
    await toggle.press("Enter");
    await expect(toggle).toHaveAttribute("aria-pressed", "true");
    await expect(grid).toHaveCSS("opacity", "0.6");
    await toggle.press("Escape");
  } else {
    await toggle.tap();
    await expect(toggle).toHaveAttribute("aria-pressed", "true");
    await expect(grid).toHaveCSS("opacity", "0.6");
    await toggle.tap();
    await expect(toggle).toHaveAttribute("aria-pressed", "false");
    await toggle.tap();
    await page.getByRole("heading", { name: "Founding members." }).tap();
  }

  await expect(toggle).toHaveAttribute("aria-pressed", "false");
  await expect(grid).toHaveCSS("opacity", "0");
});
