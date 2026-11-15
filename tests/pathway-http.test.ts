// @vitest-environment node
import { afterEach, describe, expect, it, vi } from "vitest";
import { assertOrigin, readBytes } from "@/lib/server/pathway/http";
import { sendEmail } from "@/lib/server/pathway/intake";

afterEach(() => vi.unstubAllEnvs());
describe("pathway request boundaries", () => {
  it("rejects cross-origin requests", () => {
    expect(() =>
      assertOrigin(
        new Request("http://localhost:3000/api/pathway/email", {
          method: "POST",
          headers: { origin: "https://other.example" },
        }),
      ),
    ).toThrow();
  });
  it("bounds actual bytes without relying on content-length", async () => {
    const req = new Request("http://localhost:3000", {
      method: "POST",
      body: "123456",
    });
    await expect(readBytes(req, 5)).rejects.toThrow();
  });
  it("does not manufacture success when intake is unconfigured", async () => {
    vi.stubEnv("APPLICATIONS_OPEN", "");
    const req = new Request("http://localhost:3000/api/pathway/email", {
      method: "POST",
      headers: {
        origin: "http://localhost:3000",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        action: "send",
        email: "synthetic@example.org",
        track: "core",
        captcha: "",
      }),
    });
    const response = await sendEmail(req);
    expect(response.status).toBe(503);
    expect(await response.json()).not.toHaveProperty("success", true);
  });
});
