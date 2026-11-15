import { expect, test } from "@playwright/test";
import { PDFDocument } from "pdf-lib";

for (const track of ["core", "fellow"] as const) {
  test(`${track}: original five steps work locally without OTP or submission`, async ({
    page,
  }) => {
    test.setTimeout(120000);
    const posts: string[] = [];
    page.on("request", (request) => {
      if (request.method() === "POST") posts.push(request.url());
    });
    await page.goto(`/apply/${track}`);
    const panel = page.locator(".astra-application-panel");
    await expect(panel).not.toContainText("Applications are not open");
    await expect(panel).not.toContainText("Keep this page open");
    await page.getByRole("button", { name: "Start Application" }).click();
    await page.getByRole("button", { name: "Next", exact: true }).click();
    await expect(page.getByLabel("Full name")).toBeFocused();
    await page.getByLabel("Full name").fill("Synthetic Applicant");
    await page
      .getByLabel("Email address", { exact: true })
      .fill("synthetic@example.org");
    await page
      .getByLabel("School name", { exact: true })
      .fill("Synthetic School");
    await page
      .getByRole("combobox", { name: /Grade \/ academic year/i })
      .click();
    await page.getByRole("option", { name: "Grade 9 / Year 10" }).click();
    await page.getByLabel(/I confirm that I am aged/).check();
    await page
      .getByRole("button", {
        name:
          track === "core"
            ? "Projects & programs"
            : "Artificial intelligence & technology",
        exact: true,
      })
      .click();
    await expect(
      page.getByRole("button", { name: "Send verification code" }),
    ).toHaveCount(0);
    await page.getByRole("button", { name: "Next", exact: true }).click();
    await expect(
      page.getByRole("heading", { name: "Application Questions", exact: true }),
    ).toBeVisible();
    for (const textarea of await page
      .locator(".pathway-questions textarea")
      .all())
      await textarea.fill("A".repeat(220));
    if (track === "core") {
      await page
        .getByLabel("Plan and coordinate tasks", { exact: true })
        .check();
      await page.getByLabel("3–4 hours", { exact: true }).check();
    }
    await page.getByRole("button", { name: "Next", exact: true }).click();
    await expect(
      page.getByRole("heading", { name: "Build your profile.", exact: true }),
    ).toBeVisible();
    await page.locator("#projects-add").click();
    await page.getByLabel("Title", { exact: true }).fill("Synthetic project");
    await page
      .getByLabel("Description", { exact: true })
      .fill("Synthetic description");
    await page
      .getByRole("button", { name: "Save project", exact: true })
      .click();
    const pdf = await PDFDocument.create();
    pdf.addPage();
    await page.locator('input[type="file"]').setInputFiles({
      name: "synthetic.pdf",
      mimeType: "application/pdf",
      buffer: Buffer.from(await pdf.save({ useObjectStreams: false })),
    });
    await page.getByRole("button", { name: "Back", exact: true }).click();
    await expect(
      page.locator(".pathway-questions textarea").first(),
    ).toHaveValue("A".repeat(220));
    await page.getByRole("button", { name: "Next", exact: true }).click();
    await expect(
      page.getByText("synthetic.pdf", { exact: true }),
    ).toBeVisible();
    await page.getByRole("button", { name: "Next", exact: true }).click();
    await expect(
      page.getByRole("heading", { name: "Synthetic Applicant", exact: true }),
    ).toBeVisible();
    await page
      .getByRole("button", { name: "Edit Personal Profile", exact: true })
      .click();
    await page
      .getByLabel("Email address", { exact: true })
      .fill("changed@example.org");
    await page.getByRole("button", { name: "Review", exact: true }).click();
    await expect(
      page.getByRole("heading", { name: "Synthetic Applicant", exact: true }),
    ).toBeVisible();
    const done = page.getByRole("button", { name: "Done Now", exact: true });
    await done.click();
    await expect(
      page.getByRole("heading", { name: "Synthetic Applicant", exact: true }),
    ).toBeVisible();
    await expect(panel.locator('[role="alert"]')).toHaveCount(0);
    await expect(panel).not.toContainText("Submissions aren’t open");
    expect(posts).toEqual([]);
  });
}
