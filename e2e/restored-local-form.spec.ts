import { expect, test } from "@playwright/test";
import { PDFDocument } from "pdf-lib";

const carouselSlides = {
  core: [
    "Behind the scenes.",
    "From concept to reality.",
    "Building connections.",
    "Make your skills count.",
  ],
  fellow: [
    "Start with an idea.",
    "Go deeper.",
    "Build independently.",
    "Take your work further.",
  ],
};

for (const track of ["core", "fellow"] as const) {
  test(`${track}: required answers reach 100% and finish in the local preview`, async ({
    page,
  }, testInfo) => {
    test.setTimeout(120000);
    const posts: string[] = [];
    const pageErrors: string[] = [];
    page.on("pageerror", (error) => pageErrors.push(error.message));
    page.on("request", (request) => {
      if (request.method() === "POST") posts.push(request.url());
    });
    const reducedMotion = testInfo.project.name === "tablet";
    await page.emulateMedia({
      reducedMotion: reducedMotion ? "reduce" : "no-preference",
    });
    await page.goto(`/apply/${track}`);
    const panel = page.locator(".astra-application-panel");
    await expect(panel.locator(".application-step-content")).toHaveCSS(
      "opacity",
      "1",
    );
    await expect(panel).not.toContainText("Applications are not open");
    await expect(panel).not.toContainText("Keep this page open");
    for (const [index, title] of carouselSlides[track].entries()) {
      if (index > 0)
        await panel.getByRole("button", { name: "Next slide" }).click();
      await expect(
        panel.getByRole("heading", { name: title, exact: true }),
      ).toBeVisible();
      const slide = panel.getByRole("article", {
        name: `${index + 1} of 4: ${title}`,
      });
      await expect(
        panel.getByRole("article", { name: /^\d of 4:/ }),
      ).toHaveCount(1);
      await expect
        .poll(() =>
          slide
            .getByRole("img")
            .evaluate(
              (image) =>
                image instanceof HTMLImageElement &&
                image.complete &&
                image.naturalWidth > 0,
            ),
        )
        .toBe(true);
    }
    await expect(
      page.getByRole("progressbar", { name: "Application progress" }),
    ).toHaveAttribute("aria-valuemax", track === "core" ? "6" : "5");
    const markerPositions = await panel
      .locator(".astra-step-marker")
      .evaluateAll((markers) =>
        markers.map((marker) => marker.getBoundingClientRect().top),
      );
    expect(new Set(markerPositions).size).toBe(1);
    await page.getByRole("button", { name: "Start Application" }).click();
    await page.getByRole("button", { name: "Next", exact: true }).click();
    await expect(page.getByLabel("Full name")).toBeFocused();
    const name =
      testInfo.project.name === "mobile"
        ? "SyntheticApplicantWithAnUnusuallyLongUnbrokenName Student"
        : "Synthetic Applicant";
    await page.getByLabel("Full name").fill(name);
    await page
      .getByLabel("Email address", { exact: true })
      .fill("synthetic@example.org");
    await page
      .getByLabel("School name", { exact: true })
      .fill("Synthetic School");
    await page
      .getByRole("combobox", { name: /Grade \/ academic year/i })
      .click();
    await expect(page.getByRole("listbox").getByRole("option")).toHaveCount(4);
    await page.getByRole("option", { name: "Grade 9 / Year 10" }).click();
    await page
      .getByLabel(
        "I confirm that I am aged 14–18 and currently a student in Qatar.",
      )
      .check();
    const profileGap = await page
      .locator('label[for="profile-eligibility"]')
      .evaluate((label) => {
        const legend = label.closest("section")?.querySelector("legend");
        return legend
          ? legend.getBoundingClientRect().top -
              label.getBoundingClientRect().bottom
          : -1;
      });
    expect(profileGap).toBeGreaterThanOrEqual(28);
    expect(profileGap).toBeLessThanOrEqual(34);
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
    const sampleResponse =
      "I want to help students turn an initial idea into a project they can share with their school. I would keep track of what the team agrees to do, ask for feedback early, and help document what we learn. ";
    const response = sampleResponse.repeat(3).trim();
    for (const textarea of await page
      .locator(".pathway-questions textarea[required]")
      .all())
      await textarea.fill(response);
    if (track === "core") {
      await page.getByLabel("3–4 hours", { exact: true }).check();
      await page.getByLabel("Friday", { exact: true }).check();
      await page.getByLabel("Saturday", { exact: true }).check();
      await page.getByLabel("Yes", { exact: true }).check();
    } else {
      await page
        .getByLabel("Hackathons & competitions", { exact: true })
        .check();
      await page
        .getByLabel("I would prefer to work independently.", { exact: true })
        .check();
      await page.getByLabel("Finding collaborators", { exact: true }).check();
    }
    await page.getByRole("button", { name: "Next", exact: true }).click();
    await expect(
      page.getByRole("heading", { name: "Build your profile.", exact: true }),
    ).toBeVisible();
    if (track === "core") {
      await page.getByRole("button", { name: "Next", exact: true }).click();
      await expect(
        page.getByText("Choose a PDF CV to continue."),
      ).toBeVisible();
      const pdf = await PDFDocument.create();
      pdf.addPage();
      await page.locator('input[type="file"]').setInputFiles({
        name: "synthetic.pdf",
        mimeType: "application/pdf",
        buffer: Buffer.from(await pdf.save({ useObjectStreams: false })),
      });
    } else {
      await page.locator('input[type="file"]').setInputFiles({
        name: "not-a-cv.txt",
        mimeType: "text/plain",
        buffer: Buffer.from("test"),
      });
      await expect(
        page.getByText("Unsupported file type. Choose a PDF.", { exact: true }),
      ).toBeVisible();
      await page.getByRole("button", { name: "Remove not-a-cv.txt" }).click();
    }
    await page.getByRole("button", { name: "Back", exact: true }).click();
    await expect(
      page.locator(".pathway-questions textarea").first(),
    ).toHaveValue(response);
    await page.getByRole("button", { name: "Next", exact: true }).click();
    if (track === "core")
      await expect(
        page.getByText("synthetic.pdf", { exact: true }),
      ).toBeVisible();
    else
      await page.getByRole("button", { name: "Add your first link" }).click();
    await page.getByRole("button", { name: "Next", exact: true }).click();
    if (track === "core") {
      const group = page.getByRole("group", {
        name: "Required Core commitments",
      });
      await expect(group.getByRole("checkbox")).toHaveCount(6);
      await expect(group.locator("input:checked")).toHaveCount(0);
      await expect(group.getByText("0 of 6 selected")).toBeVisible();
      const firstCommitment = group.getByRole("checkbox").first();
      const indicators = group.locator(".commitment-indicator");
      await expect(indicators).toHaveCount(6);
      for (const row of await group.locator("label").all()) {
        await expect(row).toHaveCSS("border-width", "0px");
        await expect(row).toHaveCSS("background-color", "rgba(0, 0, 0, 0)");
        await expect(row).toHaveCSS("padding", "0px");
        await expect(row).toHaveCSS("box-shadow", "none");
        await expect(row).toHaveCSS("border-radius", "0px");
        await expect(row.getByRole("checkbox")).toHaveCSS("opacity", "0");
        await expect(row.locator(".commitment-indicator")).toHaveCSS(
          "width",
          "20px",
        );
        await expect(row.locator(".commitment-indicator")).toHaveCSS(
          "height",
          "20px",
        );
      }
      await expect(group.locator(".commitments-actions")).toHaveCSS(
        "border-top-width",
        "0px",
      );
      await firstCommitment.press("Space");
      await expect(firstCommitment).toBeChecked();
      await expect(indicators.first()).toHaveCSS("outline-style", "solid");
      await expect(indicators.first()).toHaveCSS(
        "background-color",
        "rgb(198, 204, 213)",
      );
      await expect(group.getByText("1 of 6 selected")).toBeVisible();
      await group
        .getByRole("button", { name: "Select all commitments" })
        .click();
      await expect(group.locator("input:checked")).toHaveCount(6);
      await expect(group.getByText("6 of 6 selected")).toBeVisible();
      await group
        .getByRole("button", { name: "Deselect all commitments" })
        .click();
      await expect(group.locator("input:checked")).toHaveCount(0);
      await page.getByRole("button", { name: "Next", exact: true }).click();
      await expect(
        page.getByText("Acknowledge all six commitments to continue."),
      ).toBeVisible();
      for (const acknowledgment of await group.getByRole("checkbox").all())
        await acknowledgment.check();
      await page.getByRole("button", { name: "Next", exact: true }).click();
    }
    await expect(
      page.getByRole("heading", { name, exact: true }),
    ).toBeVisible();
    await expect(
      page.getByRole("status", { name: /required items complete/ }),
    ).toHaveAttribute(
      "aria-label",
      track === "core"
        ? "17 of 17 required items complete"
        : "11 of 11 required items complete",
    );
    await expect(panel.getByText("100%", { exact: true })).toBeVisible();
    const overview = panel
      .getByRole("heading", { name, exact: true })
      .locator("xpath=ancestor::header");
    const progressFill = overview.getByRole("progressbar").locator("span");
    const perimeter = overview.locator(".shiny-button-border");
    await expect
      .poll(() =>
        perimeter.evaluate(
          (node) => getComputedStyle(node, "::before").animationName,
        ),
      )
      .toBe(reducedMotion ? "none" : "shiny-border-turn");
    await expect
      .poll(() =>
        progressFill.evaluate(
          (node) => getComputedStyle(node, "::after").opacity,
        ),
      )
      .toBe("1");
    const identityFits = await overview.evaluate((element) => {
      const name = element.querySelector("h2")?.getBoundingClientRect();
      const percentage = element
        .querySelector('[role="status"]')
        ?.getBoundingClientRect();
      if (!name || !percentage) return false;
      const { left, right } = element.getBoundingClientRect();
      return (
        name.left >= left &&
        name.right <= right &&
        (name.right <= percentage.left || name.bottom <= percentage.top)
      );
    });
    expect(identityFits).toBe(true);
    await expect(
      page.getByRole("button", { name: "Edit Membership Commitments" }),
    ).toHaveCount(track === "core" ? 1 : 0);
    if (track === "core" && testInfo.project.name === "desktop") {
      await page
        .getByRole("button", { name: "Edit Membership Commitments" })
        .click();
      const checkbox = page
        .getByRole("group", { name: "Required Core commitments" })
        .getByRole("checkbox")
        .first();
      await expect(checkbox).toBeChecked();
      await checkbox.uncheck();
      await expect(
        page.getByRole("button", { name: "Go to Review & Finish" }),
      ).toBeDisabled();
      await page.getByRole("button", { name: "Review", exact: true }).click();
      await expect(
        page.getByText("Acknowledge all six commitments to continue."),
      ).toBeVisible();
      await checkbox.check();
      await page.getByRole("button", { name: "Review", exact: true }).click();
    }
    await page
      .getByRole("button", { name: "Edit Personal Profile", exact: true })
      .click();
    await page
      .getByLabel("Email address", { exact: true })
      .fill("changed@example.org");
    await page.getByRole("button", { name: "Review", exact: true }).click();
    await expect(
      page.getByRole("heading", { name, exact: true }),
    ).toBeVisible();
    await expect(
      panel.getByText("changed@example.org", { exact: true }),
    ).toBeVisible();
    if (track === "fellow") {
      await page
        .getByRole("button", { name: "Edit Supporting Links & CV" })
        .click();
      const desktop = testInfo.project.name === "desktop";
      if (desktop) {
        await page
          .getByRole("button", { name: "Add your first project" })
          .click();
        await page
          .getByLabel("Title", { exact: true })
          .fill("Synthetic project");
        await page
          .getByRole("button", { name: "Save project", exact: true })
          .click();
      }
      await page.getByRole("button", { name: "Add your first link" }).click();
      const url = `https://example.org/portfolio?${new URLSearchParams(Array.from({ length: 25 }, (_, index) => [`key${index}`, "x".repeat(90)]))}`;
      const input = page.getByLabel("URL", { exact: true });
      await input.fill("not a URL");
      await page.getByRole("button", { name: "Review", exact: true }).click();
      await expect(
        page.getByText("Enter a complete http:// or https:// link."),
      ).toBeVisible();
      await input.fill(url);
      const withinViewport = (element: Element) => {
        const { left, right } = element.getBoundingClientRect();
        return left >= 0 && right <= document.documentElement.clientWidth;
      };
      const save = page.getByRole("button", { name: "Save link", exact: true });
      await expect.poll(() => save.evaluate(withinViewport)).toBe(true);
      await expect.poll(() => input.evaluate(withinViewport)).toBe(true);
      await expect
        .poll(() =>
          page
            .getByRole("button", { name: "Cancel", exact: true })
            .evaluate(withinViewport),
        )
        .toBe(true);
      await save.click();
      await page.getByRole("button", { name: "Review", exact: true }).click();
      await expect(
        panel.locator("a").filter({ hasText: "Supporting link:" }),
      ).toHaveAttribute("href", url);
      if (desktop) {
        await expect(
          page.getByRole("heading", { name: "Synthetic project" }),
        ).toBeVisible();
        await page
          .getByRole("button", { name: "Edit Projects", exact: true })
          .click();
        await page
          .getByRole("button", { name: "Remove Synthetic project" })
          .click();
        await page.getByRole("button", { name: "Confirm removal" }).click();
        await page
          .getByRole("button", { name: "Edit link 1", exact: true })
          .click();
        await expect(page.getByLabel("URL", { exact: true })).toHaveValue(url);
        await page.getByRole("button", { name: "Cancel", exact: true }).click();
        await page
          .getByRole("button", { name: "Remove link 1", exact: true })
          .click();
        await page.getByRole("button", { name: "Confirm removal" }).click();
        await page.getByRole("button", { name: "Review", exact: true }).click();
        await expect(panel.getByText("No projects added.")).toBeVisible();
        await expect(
          panel.getByText("No supporting links added."),
        ).toBeVisible();
      }
    }
    const done = page.getByRole("button", { name: "Done Now", exact: true });
    await done.click();
    await expect(page.getByRole("heading", { name: "Done." })).toBeVisible();
    await expect(panel.locator(".pathway-confirmation-icon")).toBeInViewport();
    await expect(panel).toContainText("Development preview");
    await expect(panel).toContainText("Nothing was sent to Astra.");
    await expect(panel).not.toContainText(
      "Your application has been submitted.",
    );
    await expect(panel.locator('[role="alert"]')).toHaveCount(0);
    await expect(panel).not.toContainText("Submissions aren’t open");
    expect(posts).toEqual([]);
    expect(pageErrors).toEqual([]);
    if (track === "core")
      await page.getByRole("button", { name: "Return to Home" }).click();
    await expect(page).toHaveURL(/\/(?:#top)?$/, { timeout: 20000 });
    await expect.poll(() => page.evaluate(() => window.scrollY)).toBe(0);
  });
}
