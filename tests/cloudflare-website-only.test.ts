import { expect, it } from "vitest";
import { websiteOnlyResponse } from "../worker/website-only";

it.each([
  "/api/applications",
  "/api/pathway/email",
  "/api/pathway/eligibility",
  "/api/pathway-applications",
  "/api/admin/applications",
  "/api/admin/session",
  "/api/admin/maintenance",
  "/api/unknown",
  "/%61pi/pathway/email",
  "/api%2fpathway-applications",
])("never reaches a backend handler for %s", async (path) => {
  for (const method of ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"]) {
    const response = websiteOnlyResponse(
      new Request(`https://astra.example.org${path}`, { method }),
    );
    expect(response?.status).toBe(503);
    expect(response?.headers.get("cache-control")).toBe("no-store, private");
    expect(await response?.json()).toEqual({
      message: "Live submissions are disabled.",
    });
  }
});

it("also rejects server actions and other writes outside API routes", () => {
  expect(
    websiteOnlyResponse(
      new Request("https://astra.example.org/apply/core", {
        method: "POST",
        body: "synthetic applicant data",
      }),
    )?.status,
  ).toBe(503);
});

it.each(["/", "/apply/core", "/apply/fellow", "/programs", "/images/logo.svg"])(
  "leaves website reads unchanged for %s",
  (path) => {
    for (const method of ["GET", "HEAD"])
      expect(
        websiteOnlyResponse(
          new Request(`https://astra.example.org${path}`, { method }),
        ),
      ).toBeUndefined();
  },
);
