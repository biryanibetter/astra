import { expect, type Page, test } from "@playwright/test";
import {
  type Pathway,
  pathwayQuestions,
} from "../src/components/pathway-questions";

function validAnswer(min: number, max: number) {
  const base =
    "I planned the work carefully, shared updates with my team, and adapted when new information changed our approach. ";
  const answer = base.repeat(Math.ceil(min / base.length));
  return answer.slice(0, Math.min(max, answer.length));
}

async function completeApplicationQuestions(page: Page, track: Pathway) {
  let textareaIndex = 0;
  let fieldsetIndex = 0;

  for (const question of pathwayQuestions[track].questions.slice(1)) {
    if (question.type === "textarea") {
      const answer = validAnswer(question.minimum, question.maximum);
      const textarea = page
        .locator(".pathway-questions textarea")
        .nth(textareaIndex++);
      await textarea.fill(answer);
      await expect(textarea).toHaveValue(answer);
    } else {
      const choice = page
        .locator(".pathway-questions fieldset")
        .nth(fieldsetIndex++)
        .locator("label.interest-card-label")
        .first();
      await choice.click();
      await expect(choice.locator("input")).toBeChecked();
    }
  }
}

for (const track of ["core", "fellow"] as const) {
  test(`${track} review supports editing portfolio data and keeps completion local`, async ({
    page,
  }) => {
    test.setTimeout(90_000);
    const posts: string[] = [];
    page.on("request", (request) => {
      if (request.method() === "POST") posts.push(request.url());
    });
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(`/apply/${track}`);
    await page.getByRole("button", { name: "Start Application" }).click();

    await page.getByLabel("Full name").fill("Sam Student");
    await page.getByLabel("Email address").fill("sam@example.org");
    await page.getByLabel("School name").fill("Example School");
    await page
      .getByRole("combobox", { name: /Grade \/ academic year/i })
      .click();
    await page.getByRole("option", { name: "Grade 9 / Year 10" }).click();
    await page.getByLabel(/I confirm that I am aged/).check();
    await page
      .getByRole("button", {
        name:
          track === "core"
            ? "Events & experiences"
            : "Artificial intelligence & technology",
      })
      .click();
    await page.getByRole("button", { name: "Next", exact: true }).click();

    await completeApplicationQuestions(page, track);
    await page.getByRole("button", { name: "Next", exact: true }).click();
    await expect(
      page.getByRole("button", { name: "Go to Portfolio & Experience" }),
    ).toHaveAttribute("aria-current", "step");
    await page.getByRole("button", { name: "Next", exact: true }).click();
    await expect(
      page.getByRole("heading", { name: "Sam Student" }),
    ).toBeVisible();

    await page
      .getByRole("button", { name: /Edit Projects & Experience/ })
      .click();
    await expect(
      page.getByRole("button", { name: "Go to Portfolio & Experience" }),
    ).toHaveAttribute("aria-current", "step");
    await page.getByRole("button", { name: "Review", exact: true }).click();
    await expect(
      page.getByRole("heading", { name: "Sam Student" }),
    ).toBeVisible();
    const done = page.getByRole("button", { name: "Done Now" });
    await expect(done).toBeDisabled();
    await expect(done).toHaveAttribute(
      "aria-describedby",
      "application-done-unavailable",
    );
    await expect(page.locator("#application-done-unavailable")).toContainText(
      "Submissions aren’t open yet. Your answers remain on this page.",
    );
    expect(posts).toEqual([]);
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
  });
}
