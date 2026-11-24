import { expect, type Page, test } from "@playwright/test";

async function approachMap(page: Page) {
  await page.waitForFunction(() => "__LENIS__" in window);
  await page.locator(".network-map-wrap").evaluate((element) => {
    const top = window.scrollY + element.getBoundingClientRect().top;
    window.scrollTo({
      top: top - window.innerHeight - 100,
      behavior: "instant",
    });
  });
}

test("menu and scrolling remain available while the map is preparing", async ({
  page,
}) => {
  let release = () => {};
  const hold = new Promise<void>((resolve) => {
    release = resolve;
  });
  await page.route(
    "https://tiles.openfreemap.org/styles/dark",
    async (route) => {
      await hold;
      await route.abort();
    },
  );
  try {
    const styleRequest = page.waitForRequest(
      "https://tiles.openfreemap.org/styles/dark",
    );
    await page.goto("/", { waitUntil: "domcontentloaded" });
    await approachMap(page);
    await styleRequest;
    await expect(page.locator(".school-map-frame")).toHaveAttribute(
      "data-map-state",
      "loading",
    );
    await page.getByRole("button", { name: "Menu", exact: true }).click();
    const close = page.getByRole("button", { name: "Close", exact: true });
    await expect(close).toBeVisible();
    await close.click();
    await expect(
      page.getByRole("button", { name: "Menu", exact: true }),
    ).toBeVisible();
    const beforeWheel = await page.evaluate(() => window.scrollY);
    await page.mouse.wheel(0, 500);
    await expect
      .poll(() => page.evaluate(() => window.scrollY))
      .not.toBe(beforeWheel);
  } finally {
    release();
  }
});

test("prepares the real map on approach without a loading message and reuses it", async ({
  page,
}) => {
  const tileCache = process.env.ASTRA_TILE_CACHE;
  test.skip(
    !tileCache,
    "Set ASTRA_TILE_CACHE to the recorded OpenFreeMap fixture",
  );
  await page.routeFromHAR(tileCache ?? "", {
    url: "https://tiles.openfreemap.org/**",
    notFound: "abort",
  });
  await page.goto("/");
  const wrap = page.locator(".network-map-wrap");
  await expect(wrap.getByText(/map loads|loading map/i)).toHaveCount(0);
  await expect(wrap.locator(".school-map-frame")).toHaveCount(0);
  await approachMap(page);
  await expect(wrap).not.toBeInViewport();
  const map = wrap.locator('[data-prepared="true"]');
  await expect(map).toBeAttached({ timeout: 25_000 });
  await expect(wrap).not.toBeInViewport();
  const canvas = map.locator("canvas.maplibregl-canvas");
  const initial = await canvas.elementHandle();
  await wrap.scrollIntoViewIfNeeded();
  const search = page.getByRole("combobox", {
    name: "Search your school in Qatar",
  });
  await search.fill("Birla Public School");
  await search.press("ArrowDown");
  await search.press("Enter");
  await expect(wrap.locator(".school-map-popup")).toContainText(
    "Birla Public School",
  );
  expect(
    await canvas.evaluate((el, previous) => el === previous, initial),
  ).toBe(true);
  await expect(canvas).toHaveCount(1);
});
