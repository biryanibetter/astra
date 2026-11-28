import { expect, type Page, test } from "@playwright/test";
import type Lenis from "lenis";

type ScrollTestWindow = Window & {
  __LENIS__?: Lenis;
  scrollRecovery?: Promise<{ fraction: number; target: number }>;
  scrollSamples?: { time: number; position: number; target: number }[];
};

test.describe.configure({ timeout: 180000 });

async function expectExperiencesBelowHeader(page: Page) {
  await expect
    .poll(() =>
      page.evaluate(() => {
        const heading = document.getElementById("events-heading");
        const header = document.querySelector(".site-header");
        if (!heading || !header) return false;
        const bounds = heading.getBoundingClientRect();
        return (
          bounds.top >= header.getBoundingClientRect().bottom &&
          bounds.bottom <= innerHeight
        );
      }),
    )
    .toBe(true);
}

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
    "/programs",
    "/the-idea",
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

test("legacy event URLs redirect directly to Experiences", async ({
  request,
}) => {
  for (const path of ["/events", "/whats-next"]) {
    const response = await request.get(path, { maxRedirects: 0 });
    expect(response.status(), path).toBe(308);
    expect(response.headers().location, path).toBe("/#events");
  }
});

for (const path of ["/", "/the-idea", "/apply/core", "/apply/fellow"]) {
  test(`What's Next menu opens Experiences from ${path}`, async ({ page }) => {
    await page.goto(path);
    await page.getByRole("button", { name: "Menu", exact: true }).click();
    await page
      .getByRole("navigation", { name: "Expanded main navigation" })
      .getByRole("link", { name: "What's Next" })
      .click();
    // The dev server may compile the destination's RSC response on demand.
    await expect(page).toHaveURL(/\/#events$/, { timeout: 15000 });
    await expect(
      page.getByRole("dialog", { name: "Main navigation" }),
    ).toHaveCount(0);
    if (path === "/") await expect(page.locator("#events")).toBeFocused();
    await expectExperiencesBelowHeader(page);
  });
}

test("What's Next uses the homepage scroll lifecycle with a query string", async ({
  page,
}) => {
  await page.goto("/?ref=bookmark");
  await page.getByRole("button", { name: "Menu", exact: true }).click();
  await page
    .getByRole("navigation", { name: "Expanded main navigation" })
    .getByRole("link", { name: "What's Next" })
    .click();
  await expect(page).toHaveURL(/\/\?ref=bookmark#events$/);
  await expect(page.locator("#events")).toBeFocused();
  await expectExperiencesBelowHeader(page);
});

test("legacy bookmarks position the Experiences heading below the header", async ({
  page,
}) => {
  for (const path of ["/whats-next", "/events"]) {
    await page.goto(path);
    await expect(page).toHaveURL(/\/#events$/);
    await expectExperiencesBelowHeader(page);
  }
});

test("What's Next from the footer lands at Experiences without showing the homepage footer", async ({
  page,
}) => {
  await page.goto("/the-idea");
  await page.evaluate(() => {
    const sample = () => {
      const footer = document.querySelector("body > footer");
      if (document.getElementById("events") && footer) {
        const bounds = footer.getBoundingClientRect();
        if (bounds.top < innerHeight && bounds.bottom > 0)
          document.body.dataset.homeFooterFlashed = "true";
      }
      requestAnimationFrame(sample);
    };
    requestAnimationFrame(sample);
  });
  await page
    .getByRole("contentinfo")
    .getByRole("link", { name: "What's Next" })
    .click();
  await expect(page).toHaveURL(/\/#events$/);
  await expectExperiencesBelowHeader(page);
  await expect(page.locator("body")).not.toHaveAttribute(
    "data-home-footer-flashed",
    "true",
  );
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
  for (const path of ["/the-idea", "/apply/core", "/apply/fellow"]) {
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

test("wheel scrolling reaches its target after a blocked frame", async ({
  page,
  isMobile,
}) => {
  test.skip(isMobile, "Uses desktop wheel input.");
  await page.goto("/");
  await page.waitForFunction(
    () => (window as ScrollTestWindow).__LENIS__?.time,
  );
  await page.mouse.move((page.viewportSize()?.width ?? 800) / 2, 160);
  await page.evaluate(() => {
    const host = window as ScrollTestWindow;
    const lenis = host.__LENIS__;
    if (!lenis) throw new Error("Expected Lenis before sending wheel input");
    host.scrollRecovery = new Promise((resolve) => {
      window.addEventListener(
        "wheel",
        () => {
          requestAnimationFrame(() => {
            const before = lenis.animatedScroll;
            const target = lenis.targetScroll;
            // Model an interrupted paint while interpolation is still active.
            const resumeAt = performance.now() + 180;
            while (performance.now() < resumeAt) {
              // Fit the whole stall in one task.
            }
            requestAnimationFrame(() => {
              resolve({
                fraction: (lenis.animatedScroll - before) / (target - before),
                target,
              });
            });
          });
        },
        { capture: true, once: true, passive: true },
      );
    });
  });
  await page.mouse.wheel(0, 320);
  const sample = await page.evaluate(
    () => (window as ScrollTestWindow).scrollRecovery,
  );
  expect(sample?.target).toBe(320);
  expect(sample?.fraction).toBeGreaterThan(0.01);
  expect(sample?.fraction).toBeLessThanOrEqual(1);
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBe(320);
});

test("consecutive wheel inputs follow the weighted Lenis curve", async ({
  page,
  isMobile,
}) => {
  test.skip(isMobile, "Uses desktop wheel input.");
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.clock.install();
  await page.goto("/");
  await page.waitForFunction(
    () => (window as ScrollTestWindow).__LENIS__?.time,
  );
  await page.clock.pauseAt(
    new Date((await page.evaluate(() => Date.now())) + 100),
  );

  await page.evaluate(() => {
    const host = window as ScrollTestWindow;
    const samples: NonNullable<ScrollTestWindow["scrollSamples"]> = [];
    host.scrollSamples = samples;
    host.__LENIS__?.on("scroll", (lenis) => {
      samples.push({
        time: performance.now(),
        position: lenis.animatedScroll,
        target: lenis.targetScroll,
      });
    });
  });

  // Normalize progress by time and remaining distance, so two inputs can be
  // compared even if they fall on different browser frame boundaries.
  const wheel = () =>
    page.evaluate(() => {
      document.querySelector(".hero")?.dispatchEvent(
        new WheelEvent("wheel", {
          deltaY: 120,
          bubbles: true,
          cancelable: true,
          composed: true,
        }),
      );
    });
  await wheel();
  await page.clock.runFor(80);
  await wheel();
  await page.clock.runFor(64);
  const samples = await page.evaluate(
    () => (window as ScrollTestWindow).scrollSamples ?? [],
  );
  const gains = (target: number) => {
    const frames = samples.filter((s) => s.target === target);
    return frames.flatMap((frame, index) => {
      const previous = frames[index - 1];
      if (!previous) return [];
      return [
        Math.log((target - previous.position) / (target - frame.position)) /
          (frame.time - previous.time),
      ];
    });
  };
  const [early] = gains(120);
  const [later] = gains(240);
  if (early === undefined || later === undefined)
    throw new Error("Expected consecutive animation frames for both inputs");
  expect(early).toBeCloseTo(0.0039, 5);
  expect(later).toBeCloseTo(early, 5);
  await page.clock.runFor(1800);
  expect(await page.evaluate(() => scrollY)).toBe(240);
});

test("only nearby cinematic surfaces request compositor layers", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto("/");
  const hero = page.locator(".hero .creation-subject-depth");
  const reel = page.locator(".reel-media-perspective");
  await expect(hero).toHaveCSS("will-change", "transform");
  await reel.scrollIntoViewIfNeeded();
  await expect(reel).toHaveCSS("will-change", "transform");
  await page.evaluate(() => scrollTo({ top: 1800, behavior: "instant" }));
  await expect(hero).not.toHaveCSS("will-change", "transform");
  await expect(reel).not.toHaveCSS("will-change", "transform");
});

test("keyboard page scrolling works with Lenis under reduced motion", async ({
  page,
  isMobile,
}) => {
  test.skip(isMobile, "Uses desktop wheel and keyboard input.");
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  await page.waitForFunction(
    () => (window as ScrollTestWindow).__LENIS__?.time,
  );
  expect(
    await page.evaluate(
      () => (window as ScrollTestWindow).__LENIS__?.prefersReducedMotion,
    ),
  ).toBe(false);
  await page.mouse.move((page.viewportSize()?.width ?? 800) / 2, 160);
  await page.mouse.wheel(0, 120);
  await expect.poll(() => page.evaluate(() => scrollY)).toBe(120);
  await page.keyboard.press("PageDown");
  await expect.poll(() => page.evaluate(() => scrollY)).toBeGreaterThan(120);
});

test("a mobile swipe scrolls the document natively", async ({
  page,
  isMobile,
  browserName,
}) => {
  test.skip(
    !isMobile || browserName !== "chromium",
    "Uses Chromium touch input.",
  );
  await page.goto("/");
  await page.waitForFunction(
    () => (window as ScrollTestWindow).__LENIS__?.time,
  );
  const session = await page.context().newCDPSession(page);
  await session.send("Input.dispatchTouchEvent", {
    type: "touchStart",
    touchPoints: [{ x: 190, y: 590 }],
  });
  for (const y of [560, 530, 490, 450, 410, 370]) {
    await session.send("Input.dispatchTouchEvent", {
      type: "touchMove",
      touchPoints: [{ x: 190, y }],
    });
  }
  await session.send("Input.dispatchTouchEvent", {
    type: "touchEnd",
    touchPoints: [],
  });
  await expect.poll(() => page.evaluate(() => scrollY)).toBeGreaterThan(100);
});
