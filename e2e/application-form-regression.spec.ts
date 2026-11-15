import { expect, type Page, test } from "@playwright/test";

// The full five-step form plus limit exercises is intentionally long.
test.describe.configure({ timeout: 120_000 });

type Track = "core" | "fellow";

const longAnswer = "A".repeat(220);

async function startApplication(page: Page, track: Track) {
  await page.goto(`/apply/${track}`);
  await page.getByRole("button", { name: "Start Application" }).click();
  await page.getByLabel("Full name").fill("Demo Person");
  await page.getByLabel("Email address").fill("demo@example.org");
  await page.getByLabel("School name").fill("Example School");
  await page.getByRole("combobox", { name: /Grade \/ academic year/i }).click();
  await page.getByRole("option", { name: "Grade 9 / Year 10" }).click();
  await page.getByLabel(/I confirm that I am aged/).check();
  const interest =
    track === "core"
      ? "Projects & programs"
      : "Artificial intelligence & technology";
  await page.getByRole("button", { name: interest }).click();
  await page.getByRole("button", { name: "Next", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Application Questions" }),
  ).toBeVisible();
}

async function answerQuestions(page: Page, track: Track) {
  for (const textarea of await page
    .locator(".pathway-questions textarea")
    .all()) {
    await textarea.fill(longAnswer);
  }
  if (track === "core") {
    await page.getByText("Plan and coordinate tasks", { exact: true }).click();
    await page.getByText("3–4 hours", { exact: true }).click();
  }
  // Fellow pathway questions step only has textareas, no select options
  await page.getByRole("button", { name: "Next", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Build your profile." }),
  ).toBeVisible();
}

async function addMinimalProjectAndCV(page: Page) {
  await page.locator("#projects-add").click();
  await page.getByLabel("Title", { exact: true }).fill("Test Project");
  await page
    .getByLabel("Description", { exact: true })
    .fill("Test Description");
  await page.getByRole("button", { name: "Save project" }).click();
  await expect(
    page.getByRole("button", { name: "Test Project", exact: true }),
  ).toBeVisible();
  const cvInput = page.locator('input[type="file"]');
  await cvInput.setInputFiles({
    name: "cv.pdf",
    mimeType: "application/pdf",
    buffer: Buffer.from("%PDF-1.4 synthetic test file"),
  });
  await expect(page.getByText("cv.pdf")).toBeVisible();
}

async function addProject(page: Page, index: number) {
  await page.locator("#projects-add").click();
  await page.getByLabel("Title", { exact: true }).fill(`Project ${index}`);
  await page
    .getByLabel("Description", { exact: true })
    .fill(`Description ${index}`);
  await page.getByRole("button", { name: "Save project" }).click();
  await expect(
    page.getByRole("button", { name: `Project ${index}`, exact: true }),
  ).toBeVisible();
}

async function addLink(page: Page, index: number) {
  await page.locator("#links-add").click();
  await page.getByLabel("URL").fill(`https://example.org/link-${index}`);
  await page.getByRole("button", { name: "Save link" }).click();
  await expect(
    page
      .locator('section[aria-label="Supporting links"]')
      .getByText(`https://example.org/link-${index}`, { exact: true }),
  ).toBeVisible();
}

for (const track of ["core", "fellow"] as const) {
  test(`${track} pathway focuses the first invalid field on Next`, async ({
    page,
  }) => {
    await page.goto(`/apply/${track}`);
    await page.getByRole("button", { name: "Start Application" }).click();

    await page.getByRole("button", { name: "Next", exact: true }).click();
    await expect(page.getByRole("alert").first()).toBeVisible();
    await expect(page.getByLabel("Full name")).toBeFocused();

    await page.getByLabel("Full name").fill("Focus Tester");
    await page.getByLabel("Email address").fill("not-an-email");
    await page.getByLabel("School name").fill("Example School");
    await page
      .getByRole("combobox", { name: /Grade \/ academic year/i })
      .click();
    await page.getByRole("option", { name: "Grade 9 / Year 10" }).click();
    await page.getByLabel(/I confirm that I am aged/).check();
    const interest =
      track === "core"
        ? "Projects & programs"
        : "Artificial intelligence & technology";
    await page.getByRole("button", { name: interest }).click();
    await page.getByRole("button", { name: "Next", exact: true }).click();
    await expect(page.getByLabel("Email address")).toBeFocused();

    await page.getByLabel("Email address").fill("focus@example.org");
    await page.getByRole("button", { name: "Next", exact: true }).click();
    await expect(
      page.getByRole("heading", { name: "Application Questions" }),
    ).toBeVisible();
    await page.getByRole("button", { name: "Next", exact: true }).click();
    await expect(
      page.locator(".pathway-questions textarea").first(),
    ).toBeFocused();
  });
}

test("core pathway enforces five-project and five-link limits without saving empty drafts", async ({
  page,
}) => {
  await startApplication(page, "core");
  await answerQuestions(page, "core");

  const projects = page.locator('section[aria-label="Projects"]');
  const links = page.locator('section[aria-label="Supporting links"]');

  // A cancelled draft never enters the saved list.
  await page.locator("#projects-add").click();
  await page.getByLabel("Title", { exact: true }).fill("Abandoned project");
  await page.getByRole("button", { name: "Cancel" }).click();
  await expect(projects.locator("article")).toHaveCount(0);
  await expect(projects.getByText("Abandoned project")).toHaveCount(0);
  await expect(projects.getByText(/Untitled project/)).toHaveCount(0);

  // Rapid clicks in the same frame open exactly one draft.
  await page.locator("#projects-add").evaluate((button) => {
    (button as HTMLButtonElement).click();
    (button as HTMLButtonElement).click();
    (button as HTMLButtonElement).click();
  });
  await expect(projects.getByText("New project", { exact: true })).toHaveCount(
    1,
  );
  await page.getByRole("button", { name: "Cancel" }).click();
  await expect(projects.locator("article")).toHaveCount(0);

  for (let index = 1; index <= 5; index += 1) await addProject(page, index);
  await expect(projects.locator("article")).toHaveCount(5);
  await expect(page.locator("#projects-add")).toBeDisabled();
  await expect(page.getByText("Maximum 5 projects")).toBeVisible();

  // Removing one project re-enables adding.
  await page.getByRole("button", { name: "Remove Project 1" }).click();
  await page.getByRole("button", { name: "Confirm removal" }).click();
  await expect(projects.locator("article")).toHaveCount(4);
  await expect(page.getByText("Maximum 5 projects")).toHaveCount(0);
  await expect(page.locator("#projects-add")).toBeEnabled();
  await addProject(page, 6);

  // Editing keeps the same saved entry instead of duplicating it.
  await page.getByRole("button", { name: "Edit Project 6" }).click();
  await page.getByLabel("Title", { exact: true }).fill("Project 6 revised");
  await page.getByRole("button", { name: "Save project" }).click();
  await expect(
    page.getByRole("button", { name: "Project 6 revised", exact: true }),
  ).toBeVisible();
  await expect(projects.locator("article")).toHaveCount(5);

  // Invalid links cannot be saved; valid links save up to the cap.
  await page.locator("#links-add").click();
  await page.getByLabel("URL").fill("not a complete url");
  await page.getByRole("button", { name: "Save link" }).click();
  await expect(
    page.getByRole("alert").filter({ hasText: "Enter a complete" }),
  ).toBeVisible();
  await expect(links.locator("[id^='link-row-']")).toHaveCount(0);
  await expect(page.getByLabel("URL")).toHaveValue("not a complete url");
  await page.getByRole("button", { name: "Cancel" }).click();
  await expect(links.locator("[id^='link-row-']")).toHaveCount(0);

  for (let index = 1; index <= 5; index += 1) await addLink(page, index);
  await expect(page.locator("#links-add")).toBeDisabled();
  await expect(page.getByText("Maximum 5 links")).toBeVisible();

  await page.getByRole("button", { name: "Remove link 1" }).click();
  await page.getByRole("button", { name: "Confirm removal" }).click();
  await expect(page.getByText("Maximum 5 links")).toHaveCount(0);
  await expect(page.locator("#links-add")).toBeEnabled();
  await addLink(page, 6);

  // CV handling: a PDF is accepted.
  const cvInput = page.locator('input[type="file"]');
  await cvInput.setInputFiles({
    name: "cv.pdf",
    mimeType: "application/pdf",
    buffer: Buffer.from("%PDF-1.4 synthetic test file"),
  });
  await expect(page.getByText("cv.pdf")).toBeVisible();

  await page.getByRole("button", { name: "Next", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Demo Person" }),
  ).toBeVisible();
  await expect(page.getByText("Astra Core applicant")).toBeVisible();

  // Review links return to the correct step, and saved data is still there.
  await page.getByRole("button", { name: "Edit Personal Profile" }).click();
  await expect(
    page.getByRole("heading", { name: "Your profile & interests" }),
  ).toBeVisible();
  await expect(page.getByLabel("Full name")).toHaveValue("Demo Person");
  await page.getByRole("button", { name: "Go to Review & Finish" }).click();
  await expect(
    page.getByRole("heading", { name: "Demo Person" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Edit Projects" }).click();
  await expect(
    page.getByRole("heading", { name: "Build your profile." }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Project 6 revised", exact: true }),
  ).toBeVisible();

  // The review shortcut closes again when a required step is invalid.
  await page.getByRole("button", { name: "Go to Profile & Interests" }).click();
  await page.getByLabel("Full name").fill("");
  await expect(
    page.getByRole("button", { name: "Go to Review & Finish" }),
  ).toBeDisabled();
  await page.getByLabel("Full name").fill("Demo Person");
  await expect(
    page.getByRole("button", { name: "Go to Review & Finish" }),
  ).toBeEnabled();
});

test("fellow pathway keeps data across Back and Next and reaches review", async ({
  page,
}) => {
  await startApplication(page, "fellow");
  await answerQuestions(page, "fellow");
  await addMinimalProjectAndCV(page);

  await page.getByRole("button", { name: "Back", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Application Questions" }),
  ).toBeVisible();
  for (const textarea of await page
    .locator(".pathway-questions textarea")
    .all()) {
    await expect(textarea).toHaveValue(longAnswer);
  }
  await page.getByRole("button", { name: "Back", exact: true }).click();
  await expect(page.getByLabel("Full name")).toHaveValue("Demo Person");
  await page.getByRole("button", { name: "Next", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Application Questions" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Next", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Build your profile." }),
  ).toBeVisible();

  await addProject(page, 1);
  await page.getByRole("button", { name: "Edit Project 1" }).click();
  await page.getByLabel("Description", { exact: true }).fill("Revised detail");
  await page.getByRole("button", { name: "Save project" }).click();
  await expect(
    page.locator('section[aria-label="Projects"] article'),
  ).toHaveCount(2);
  await expect(
    page.getByRole("button", { name: "Project 1", exact: true }),
  ).toBeVisible();
  await addLink(page, 1);

  await page.getByRole("button", { name: "Next", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Demo Person" }),
  ).toBeVisible();
  await expect(page.getByText("Astra Fellow applicant")).toBeVisible();

  // Editing the portfolio from review returns to the portfolio step.
  await page.getByRole("button", { name: "Edit Projects" }).click();
  await expect(
    page.getByRole("heading", { name: "Build your profile." }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Project 1", exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Go to Review & Finish" }).click();
  await expect(
    page.getByRole("heading", { name: "Demo Person" }),
  ).toBeVisible();
});
