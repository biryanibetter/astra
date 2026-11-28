import { expect, test } from "@playwright/test";

const introHeading = "One network. Two ways to be part of it.";
const chapterHeading = "Where your interests can take you.";
const galleryHeading = "Why Astra exists.";
const editorialStart =
  "Astra brings together students with different ambitions";
const coreDescription =
  "Contribute to Astra's development through its operations, events and student-led initiatives, working alongside students from across Qatar.";
const fellowDescription =
  "Pursue independent ideas, develop your interests and connect with a wider network of young innovators.";

test("membership titles stay centered without moving the next section", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto("/the-idea");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(
    introHeading,
  );
  const title = page.getByTestId("idea-membership-title");
  const prefix = title.getByText("Astra", { exact: true });
  const highlight = page.getByTestId("idea-membership-highlight");
  const titleCenterOffset = async () => {
    const [row, first, last] = await Promise.all(
      [title, prefix, highlight].map((element) => element.boundingBox()),
    );
    if (!row || !first || !last) throw new Error("Membership title is missing");
    return Math.abs(
      (first.x + last.x + last.width) / 2 - (row.x + row.width / 2),
    );
  };
  const chapter = page.getByTestId("programs-scroll-track");
  const rotation = page.getByTestId("idea-membership-rotation");
  const activeIndicator = rotation.locator(
    '[data-pathway][data-active="true"]',
  );
  const description = rotation
    .locator("p")
    .filter({ hasText: coreDescription });
  await page.waitForFunction(() => "__LENIS__" in window);
  await page.evaluate(() => document.fonts.ready.then(() => undefined));

  await expect(highlight).toHaveText("Core");
  await expect(rotation.getByText(coreDescription, { exact: true })).toHaveCSS(
    "opacity",
    "1",
  );
  await expect(activeIndicator).toHaveAttribute("data-pathway", "Core");
  const coreWidth = (await highlight.boundingBox())?.width ?? 0;
  const coreHeight = (await highlight.boundingBox())?.height ?? 0;
  expect(await titleCenterOffset()).toBeLessThan(1);
  const chapterY = (await chapter.boundingBox())?.y ?? 0;
  const descriptionHeight = (await description.boundingBox())?.height ?? 0;

  await expect(highlight).toHaveText("Fellow", { timeout: 9000 });
  const fellowStartedAt = Date.now();
  await expect(page.getByRole("tab", { name: "Astra Core" })).toHaveAttribute(
    "aria-selected",
    "true",
  );
  await expect(
    rotation.getByText(fellowDescription, { exact: true }),
  ).toHaveCSS("opacity", "1");
  await expect(rotation.getByText(coreDescription, { exact: true })).toHaveCSS(
    "opacity",
    "0",
  );
  await expect(activeIndicator).toHaveAttribute("data-pathway", "Fellow");
  await expect
    .poll(async () => (await highlight.boundingBox())?.width ?? 0)
    .toBeGreaterThan(coreWidth);
  await expect.poll(titleCenterOffset).toBeLessThan(1);
  expect((await chapter.boundingBox())?.y).toBeCloseTo(chapterY, 0);
  expect((await highlight.boundingBox())?.height).toBeCloseTo(coreHeight, 0);
  expect((await description.boundingBox())?.height).toBeCloseTo(
    descriptionHeight,
    0,
  );
  await expect(highlight).toHaveText("Core", { timeout: 9000 });
  expect(Date.now() - fellowStartedAt).toBeGreaterThan(2500);
});

test("the converging pathways bridge membership and exploration", async ({
  page,
}) => {
  await page.goto("/the-idea");
  const main = page.getByRole("main");
  const statement = main.getByText("Different pathways. Shared possibilities.");
  await expect(statement).toHaveRole("paragraph");
  await expect(main.getByText(new RegExp(`^${editorialStart}`))).toHaveCount(0);
  const indicator = main.locator('[data-pathway="Core"]');
  const graphic = statement.locator("..").locator("svg");
  const chapter = main.getByRole("heading", { name: chapterHeading });
  const tabs = main.getByRole("tablist", { name: "Membership pathways" });
  await expect(
    main.getByRole("heading", { name: "Find your place." }),
  ).toHaveCount(0);
  const statementBox = await statement.boundingBox();
  const tabsBox = await tabs.boundingBox();
  if (!statementBox || !tabsBox)
    throw new Error("Membership transition is missing");
  const tabGap = tabsBox.y - statementBox.y - statementBox.height;
  expect(tabGap).toBeGreaterThan(0);
  expect(tabGap).toBeLessThanOrEqual(33);
  const bounds = await Promise.all(
    [indicator, graphic, statement, tabs, chapter].map((element) =>
      element.boundingBox(),
    ),
  );
  for (const [index, box] of bounds.entries()) {
    if (!box) throw new Error("Expected the transition to be rendered.");
    if (index === 0) continue;
    const previous = bounds[index - 1];
    expect(box.y).toBeGreaterThanOrEqual(
      (previous?.y ?? 0) + (previous?.height ?? 0),
    );
  }
});

test("leaving view mid-exit keeps the current pathway", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto("/the-idea");
  const highlight = page.getByTestId("idea-membership-highlight");
  await page.waitForFunction(
    () => {
      const element = document.querySelector(
        '[data-testid="idea-membership-highlight"]',
      );
      const letter = element?.firstElementChild?.lastElementChild;
      if (
        element?.textContent !== "Core" ||
        !letter ||
        new DOMMatrixReadOnly(getComputedStyle(letter).transform).m42 >= -3
      ) {
        return false;
      }
      window.scrollTo({ top: document.body.scrollHeight, behavior: "instant" });
      return true;
    },
    undefined,
    { timeout: 9000 },
  );
  await expect(highlight).not.toBeInViewport();
  await expect(highlight.locator("span")).toHaveCount(0);
  await expect(highlight).toHaveText("Core");
});

test("local review keeps membership motion when the browser requests reduced motion", async ({
  page,
}) => {
  test.skip(
    process.env.PLAYWRIGHT_PRODUCTION === "true",
    "Development preview only",
  );
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/the-idea");
  const main = page.getByRole("main");
  await expect(main.getByRole("heading", { level: 1 })).toHaveAccessibleName(
    introHeading,
  );
  await expect(main.getByRole("heading", { level: 2 })).toHaveText([
    "Help shape Astra.",
    chapterHeading,
    "Technology & AI",
    galleryHeading,
  ]);
  const rotation = page.getByTestId("idea-membership-rotation");
  const highlight = page.getByTestId("idea-membership-highlight");
  const intro = main.getByRole("heading", { level: 1 });
  const exploration = main.getByRole("heading", { name: chapterHeading });
  const shimmer = intro.locator("[data-shimmer]");
  const explorationShimmer = exploration.locator("[data-shimmer]");
  await expect(shimmer).toHaveAttribute("data-shimmer-active", "true");
  await expect(explorationShimmer).toHaveAttribute(
    "data-shimmer-ready",
    "true",
  );
  const timing = (node: Element) =>
    node.getAnimations()[0]?.effect?.getTiming();
  expect(await shimmer.evaluate(timing)).toMatchObject({
    duration: 5600,
    delay: 500,
    easing: "linear",
    iterations: Infinity,
  });
  expect(await shimmer.evaluate(timing)).toEqual(
    await explorationShimmer.evaluate(timing),
  );
  await expect(highlight.locator("[data-shimmer-text]")).toHaveCount(0);
  await expect(rotation).toBeVisible();
  await expect(highlight).toHaveText("Core");

  const pathways = main
    .getByRole("region", { name: introHeading })
    .getByRole("list");
  await expect(pathways).toHaveCSS("clip-path", "inset(50%)");
  const accessibleCopy = await pathways.ariaSnapshot();
  expect(accessibleCopy).toContain("Astra Core");
  expect(accessibleCopy).toContain("Astra Fellow");
  expect(accessibleCopy).toContain(coreDescription);
  expect(accessibleCopy).toContain(fellowDescription);

  const fellowCopy = rotation.getByText(fellowDescription, { exact: true });
  const fellowIndicator = rotation.locator('[data-pathway="Fellow"]');
  await expect(fellowCopy).toHaveCSS("transition-property", "opacity");
  await expect(fellowIndicator).toHaveCSS(
    "transition-property",
    "width, background-color",
  );
  await expect(highlight).toHaveText("Fellow", { timeout: 9000 });
  await expect(fellowCopy).toHaveCSS("opacity", "1");
  await expect(fellowIndicator).toHaveAttribute("data-active", "true");
});

test("the chapter stage pins after the introduction and releases into the photographic cards", async ({
  page,
  hasTouch,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
  await page.goto("/the-idea");

  const stage = page.getByTestId("programs-scroll-track");
  const navigation = page.getByTestId("programs-timeline");
  const gallery = page.getByTestId("programs-gallery");
  const active = navigation.locator('[aria-current="step"]');
  await expect(gallery.getByRole("img")).toHaveAttribute("data-loaded", "true");
  await expect(stage).toHaveAttribute("data-programs-state", "FREE_BEFORE");
  await expect(active).toContainText("01");

  // A short viewport can need multiple steps through the sticky runway.
  await expect
    .poll(() =>
      stage.evaluate((track) => {
        const state = track.getAttribute("data-programs-state");
        const shell = track.querySelector("[data-programs-composition]");
        if (state !== "FREE_BEFORE" || !shell) return state;
        const bounds = shell.getBoundingClientRect();
        const style = getComputedStyle(shell);
        const top = Number.parseFloat(
          style.getPropertyValue("--programs-header-clearance"),
        );
        const bottom =
          Number.parseFloat(
            style.getPropertyValue("--programs-bottom-clearance"),
          ) || 32;
        const height = window.visualViewport?.height ?? window.innerHeight;
        const center = (height + top - bottom) / 2;
        window.scrollBy({
          top: bounds.top + bounds.height / 2 - center,
          behavior: "instant",
        });
        return state;
      }),
    )
    .toBe("LOCKED");
  const pinnedY = await page.evaluate(() => window.scrollY);

  const select = async (name: string) => {
    const button = stage.getByRole("button", { name });
    if (hasTouch) await button.tap();
    else await button.click();
  };
  await expect(gallery.getByText(/Develop software, experiment/)).toBeVisible();
  if (hasTouch) {
    const box = await gallery.boundingBox();
    if (!box) throw new Error("Expected an on-screen photographic panel.");
    const x = Math.round(box.x + box.width / 2);
    const y = Math.round(box.y + box.height / 2);
    const session = await page.context().newCDPSession(page);
    await session.send("Input.dispatchTouchEvent", {
      type: "touchStart",
      touchPoints: [{ x, y }],
    });
    await session.send("Input.dispatchTouchEvent", {
      type: "touchMove",
      touchPoints: [{ x, y: y - 110 }],
    });
    await session.send("Input.dispatchTouchEvent", {
      type: "touchEnd",
      touchPoints: [],
    });
    await session.detach();
  } else {
    await page.keyboard.press("ArrowDown");
  }
  await expect(active).toContainText("02");
  await expect(gallery.getByRole("heading")).toHaveText("Design & Creation");
  await expect(gallery.getByText(/Turn concepts into products/)).toBeVisible();
  await expect(gallery.getByRole("img")).toHaveAttribute(
    "src",
    "/images/idea-stock/design.webp",
  );
  await select("Next interest");
  await expect(active).toContainText("03");
  await expect(gallery.getByRole("heading")).toHaveText("Business & Startups");
  await expect(gallery.getByText(/Identify opportunities/)).toBeVisible();
  await select("Previous interest");
  await expect(active).toContainText("02");
  await select("Science, Media & More");
  await expect(active).toContainText("04");
  await expect(gallery.getByRole("heading")).toHaveText(
    "Science, Media & More",
  );
  await expect(
    gallery.getByText(/Investigate scientific questions/),
  ).toBeVisible();
  await expect(stage).toHaveAttribute("data-programs-boundary", "FINAL_READY");
  expect(await page.evaluate(() => window.scrollY)).toBeCloseTo(pinnedY, 0);

  await active.blur();
  await page.keyboard.press("PageDown");
  await expect(stage).toHaveAttribute("data-programs-state", "FREE_AFTER");

  const cards = page.getByRole("group", { name: "Reasons Astra exists" });
  await expect(cards.getByRole("heading")).toHaveText([
    "Beyond school boundaries.",
    "Beyond the curriculum.",
    "Beyond individual effort.",
  ]);
  for (const [index, card] of (
    await cards.getByRole("button").all()
  ).entries()) {
    await card.scrollIntoViewIfNeeded();
    await expect(card).toContainText(`0${index + 1}`);
    const image = card.getByRole("img");
    await expect
      .poll(() =>
        image.evaluate((element: HTMLImageElement) => element.naturalWidth),
      )
      .toBeGreaterThan(0);
    const cardBox = await card.boundingBox();
    for (const text of [card.getByRole("heading"), card.locator("p")]) {
      const box = await text.boundingBox();
      expect(box?.y).toBeGreaterThan(cardBox?.y ?? 0);
      expect((box?.y ?? 0) + (box?.height ?? 0)).toBeLessThan(
        (cardBox?.y ?? 0) + (cardBox?.height ?? 0),
      );
    }
    await card.click();
    await expect(card).toHaveAttribute("aria-pressed", "true");
  }
  expect(
    await page.evaluate(
      () =>
        document.documentElement.scrollWidth <=
        document.documentElement.clientWidth,
    ),
  ).toBe(true);
  expect(errors).toEqual([]);
});
