// @vitest-environment node

import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("next/headers", () => ({
  cookies: async () => ({ get: () => undefined }),
}));

import { AdminLogin } from "@/components/admin-review";
import { adminApplications } from "@/lib/server/pathway/admin";

afterEach(() => vi.unstubAllEnvs());
describe("private review boundaries", () => {
  it("rejects unauthenticated reads before accessing the database", async () => {
    const response = await adminApplications(
      new Request("http://localhost:3000/api/admin/applications"),
    );
    expect(response.status).toBe(401);
    expect(await response.json()).not.toHaveProperty("applications");
  });
  it("provides labeled administrator sign-in fields without public signup", () => {
    const html = renderToStaticMarkup(createElement(AdminLogin));
    expect(html).toContain('type="email"');
    expect(html).toContain('type="password"');
    expect(html).not.toContain("Create account");
  });
});
