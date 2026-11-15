import { expect, type Page, test } from "@playwright/test";

test.describe.configure({ timeout: 120000 });

async function profile(page: Page) {
  await page.goto("/apply/core");
  await page.getByRole("button", { name: "Start Application" }).click();
  await page.getByLabel("Full name").fill("Synthetic Applicant");
  await page
    .getByLabel("Email address", { exact: true })
    .fill("synthetic@example.org");
  await page
    .getByLabel("School name", { exact: true })
    .fill("Synthetic School");
  await page.getByRole("combobox", { name: /Grade \/ academic year/i }).click();
  await page.getByRole("option", { name: "Grade 9 / Year 10" }).click();
  await page.getByLabel(/I confirm that I am aged/).check();
  await page
    .getByRole("button", { name: "Projects & programs", exact: true })
    .click();
  await page.getByRole("button", { name: "Next", exact: true }).click();
}

test("Core option cards support label, native pointer and keyboard input", async ({
  page,
}) => {
  await profile(page);
  const checkbox = page.getByLabel("Plan and coordinate tasks", {
    exact: true,
  });
  const label = page.locator('label[for="core-responsibilities-0"]');
  await label.click();
  await expect(checkbox).toBeChecked();
  await label.click();
  await expect(checkbox).not.toBeChecked();
  await checkbox.focus();
  await page.keyboard.press("Space");
  await expect(checkbox).toBeChecked();
  await page.keyboard.press("Space");
  await expect(checkbox).not.toBeChecked();
  await page.keyboard.press("Tab");
  await expect(
    page.getByLabel("Create or improve digital tools", { exact: true }),
  ).toBeFocused();
  await checkbox.click();
  await expect(checkbox).toBeChecked();
  const radio = page.getByLabel("3–4 hours", { exact: true });
  await radio.click();
  await expect(radio).toBeChecked();
  await page.getByLabel("5–6 hours", { exact: true }).click();
  await expect(radio).not.toBeChecked();
});

test("Core option cards support touch without forced events", async ({
  page,
}, testInfo) => {
  test.skip(!testInfo.project.use.hasTouch, "Touch-capable projects only.");
  await profile(page);
  const checkbox = page.getByLabel("Plan and coordinate tasks", {
    exact: true,
  });
  await checkbox.tap();
  await expect(checkbox).toBeChecked();
  await checkbox.tap();
  await expect(checkbox).not.toBeChecked();
  const radio = page.getByLabel("3–4 hours", { exact: true });
  await radio.tap();
  await expect(radio).toBeChecked();
});

test("unauthenticated admin and cross-origin writes are rejected", async ({
  request,
  baseURL,
}) => {
  expect((await request.get("/api/admin/applications")).status()).toBe(401);
  const denied = await request.post("/api/pathway/email", {
    headers: {
      origin: "https://other.example",
      "content-type": "application/json",
    },
    data: {
      action: "send",
      email: "synthetic@example.org",
      track: "core",
      captcha: "synthetic",
    },
  });
  expect(denied.status()).toBe(403);
  expect((await request.get(`${baseURL}/admin`)).url()).toContain(
    "/admin/login",
  );
});
