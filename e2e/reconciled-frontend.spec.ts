import { expect, test } from "@playwright/test";

test.describe.configure({ timeout: 180000 });

test("all retained public and application routes resolve", async ({
  request,
}) => {
  for (const path of [
    "/",
    "/about",
    "/contact",
    "/privacy",
    "/network",
    "/join",
    "/events",
    "/programs",
    "/the-idea",
    "/whats-next",
    "/schools",
    "/schools/birla-public-school",
    "/schools/birla-public-school/apply",
    "/apply/core",
    "/apply/fellow",
    "/admin/login",
  ]) {
    const response = await request.get(path);
    expect(response.status(), path).toBe(200);
  }
  expect((await request.get("/apply/unknown-pathway")).status()).toBe(404);
  // Receipts are shown only after confirmed submission, never by visiting a URL.
  expect((await request.get("/apply/received")).status()).toBe(404);
  expect((await request.get("/schools/unknown-school")).status()).toBe(404);
  for (const path of ["/multistep-form-preview", "/sterling-preview"]) {
    expect((await request.get(path)).status(), path).toBe(404);
  }
  const admin = await request.get("/admin");
  expect(admin.url()).toContain("/admin/login");
});

test("approved branding, fixed header, sky and scroll lifecycle survive navigation", async ({
  page,
}, testInfo) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/");
  const header = page.locator(".site-header");
  await expect(header).toHaveCSS("position", "fixed");
  const logo = header.getByRole("img", {
    name: "Astra Youth Innovation Network",
  });
  await expect(logo).toHaveAttribute("src", "/branding/astra-logo-light.png");
  await expect
    .poll(() =>
      logo.evaluate((image) => (image as HTMLImageElement).naturalWidth),
    )
    .toBeGreaterThan(0);
  await expect(page.locator(".global-starfield canvas")).toHaveCount(1);
  await expect(page.locator(".global-starfield")).toHaveCSS(
    "pointer-events",
    "none",
  );
  await expect
    .poll(() =>
      page.evaluate(
        () => typeof (window as Window & { __LENIS__?: unknown }).__LENIS__,
      ),
    )
    .toBe("object");
  await page.mouse.wheel(0, 650);
  await expect
    .poll(() => page.evaluate(() => window.scrollY))
    .toBeGreaterThan(0);
  await expect(header).toBeVisible();
  await page.screenshot({ path: testInfo.outputPath("reconciled-home.png") });
  await header.getByRole("link", { name: "Astra home", exact: true }).click();
  for (const path of [
    "/the-idea",
    "/whats-next",
    "/apply/core",
    "/apply/fellow",
  ]) {
    await page.goto(path);
    await expect(header).toHaveCSS("position", "fixed");
    await expect(page.locator(".global-starfield canvas")).toHaveCount(1);
    await expect
      .poll(() =>
        page.evaluate(
          () => typeof (window as Window & { __LENIS__?: unknown }).__LENIS__,
        ),
      )
      .toBe("object");
    await expect(page.locator("body")).not.toHaveCSS("overflow", "hidden");
  }
  expect(errors).toEqual([]);
});
