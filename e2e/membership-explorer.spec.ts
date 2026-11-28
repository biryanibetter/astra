import { expect, test } from "@playwright/test";

test("membership selection is keyboard accessible and preserves the exploration layout", async ({
  page,
  hasTouch,
}) => {
  test.setTimeout(60_000);
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/the-idea");
  const explorer = page.getByRole("region", { name: "Membership Explorer" });
  const tabs = explorer.getByRole("tablist", { name: "Membership pathways" });
  const core = tabs.getByRole("tab", { name: "Astra Core" });
  const fellow = tabs.getByRole("tab", { name: "Astra Fellow" });
  const panel = explorer.getByRole("tabpanel");
  const exploration = page.getByRole("region", {
    name: "Explore interest areas",
  });
  // Its sticky heading can move when browser focus scrolls; the track is in flow.
  const explorationTop = () =>
    exploration.evaluate(
      (track) => track.getBoundingClientRect().top + scrollY,
    );

  await expect(core).toHaveAttribute("aria-selected", "true", {
    timeout: 3000,
  });
  await expect(panel).toHaveAccessibleName("Astra Core");
  await expect(panel.getByRole("listitem")).toHaveCount(4);
  await expect(
    panel.getByRole("heading", { name: "Technology, design & media" }),
  ).toBeVisible();
  await page.evaluate(() => document.fonts.ready.then(() => undefined));
  const initialExplorationTop = await explorationTop();
  const panelHeight = (await panel.boundingBox())?.height;

  await core.focus();
  await core.press("ArrowRight");
  await expect(fellow).toBeFocused();
  await expect(panel).toHaveAccessibleName("Astra Fellow");
  await expect(panel.getByRole("listitem")).toHaveCount(4);
  await expect(
    panel.getByRole("heading", { name: "Cross-school collaboration" }),
  ).toBeVisible();
  await fellow.press("Tab");
  await expect(panel).toBeFocused();
  expect((await panel.boundingBox())?.height).toBe(panelHeight);
  expect(await explorationTop()).toBeCloseTo(initialExplorationTop, 0);

  await fellow.focus();
  await fellow.press("Home");
  await expect(core).toBeFocused();
  await core.press("End");
  await expect(fellow).toBeFocused();
  await fellow.press("ArrowRight");
  await expect(core).toBeFocused();
  if (hasTouch) await fellow.tap();
  else await fellow.click();
  await expect(panel).toHaveAccessibleName("Astra Fellow");
  await expect(
    panel.getByRole("heading", { name: "Take your ideas further." }),
  ).toBeVisible();
  expect(await explorationTop()).toBeCloseTo(initialExplorationTop, 0);
});
