import { act, createElement } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, describe, expect, it, vi } from "vitest";
import { AdminReview } from "@/components/admin-review";

afterEach(() => {
  vi.unstubAllGlobals();
  document.body.innerHTML = "";
});
describe("review rendering safety", () => {
  it("renders stored applicant markup as text, not executable elements", async () => {
    vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
    const payload = '<img src=x onerror="alert(1)">';
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        Response.json({
          applications: [
            {
              id: "d2a26f11-4595-4a04-8b51-e2d148d2ba28",
              track: "core",
              status: "pending",
              submitted_at: "2026-11-15T00:00:00Z",
              astra_profiles: {
                full_name: payload,
                school: "Synthetic School",
                grade: "grade-9-year-10",
              },
            },
          ],
          count: 1,
        }),
      ),
    );
    const element = document.createElement("div");
    document.body.append(element);
    const root = createRoot(element);
    try {
      await act(async () => {
        root.render(createElement(AdminReview, { owner: false }));
      });
      expect(element.textContent).toContain(payload);
      expect(element.querySelector("img")).toBeNull();
      expect(element.querySelector("script")).toBeNull();
    } finally {
      await act(async () => root.unmount());
    }
  });
});
