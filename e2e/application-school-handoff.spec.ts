import { expect, type Page, test } from "@playwright/test";

async function schoolLink(page: Page, track: "Core" | "Fellow") {
  const search = page.getByRole("combobox", {
    name: "Search your school in Qatar",
  });
  await search.click();
  await search.fill("Doha British School");
  await page
    .getByRole("option", { name: /^Doha British School\b/i })
    .first()
    .click();
  return page
    .getByRole("navigation", { name: "Choose an Astra application" })
    .getByRole("link", { name: new RegExp(`Astra ${track}`) });
}

async function expectAtTop(page: Page, track: "Core" | "Fellow") {
  await expect(
    page.getByRole("heading", { name: `Astra ${track}`, exact: true }),
  ).toBeInViewport();
  await expect(
    page.getByRole("progressbar", { name: "Application progress" }),
  ).toBeInViewport();
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBe(0);
}

for (const track of ["Core", "Fellow"] as const) {
  test(`${track}: selected school survives the homepage handoff`, async ({
    page,
  }) => {
    await page.goto("/");
    const link = await schoolLink(page, track);
    const href = await link.getAttribute("href");
    expect(href).toContain("?school=");
    await link.click();
    await expect(page).toHaveURL(
      new RegExp(`/apply/${track.toLowerCase()}\\?school=`),
    );
    await expectAtTop(page, track);

    await page.goBack();
    await expect(page).toHaveURL(/\/$/);
    await page.goForward();
    await expectAtTop(page, track);
    await page.goto(href?.split("#")[0] ?? `/apply/${track.toLowerCase()}`);
    await expectAtTop(page, track);
    await page.getByRole("button", { name: "Start Application" }).click();
    await expect(
      page.getByRole("combobox", { name: "School name" }),
    ).toHaveValue(/Doha British School/i);
  });
}

test("Core opens at the top on repeated keyboard navigation over a slower connection", async ({
  page,
}) => {
  const cdp = await page.context().newCDPSession(page);
  for (const edge of ["start", "end"] as const) {
    await page.goto("/");
    const link = await schoolLink(page, "Core");
    await link.evaluate((element, block) => {
      element.scrollIntoView({ block, behavior: "instant" });
      if (element instanceof HTMLElement)
        element.focus({ preventScroll: true });
    }, edge);
    const before = await page.evaluate(() => window.scrollY);
    await cdp.send("Network.emulateNetworkConditions", {
      offline: false,
      latency: 250,
      downloadThroughput: 512_000,
      uploadThroughput: 256_000,
    });
    await page.keyboard.press("Enter");
    await expectAtTop(page, "Core");
    await page.goBack();
    await expect
      .poll(() => page.evaluate((y) => Math.abs(window.scrollY - y), before))
      .toBeLessThanOrEqual(2);
    await cdp.send("Network.emulateNetworkConditions", {
      offline: false,
      latency: 0,
      downloadThroughput: -1,
      uploadThroughput: -1,
    });
  }
});
