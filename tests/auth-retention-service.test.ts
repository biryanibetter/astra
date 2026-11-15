// @vitest-environment node
import { describe, expect, it, vi } from "vitest";

const doubles = vi.hoisted(() => ({
  remove: vi.fn(async () => ({ error: null })),
  audit: vi.fn(async () => {}),
}));
const candidates = ["admin", "retained", "pending", "abandoned"].map((id) => ({
  id,
  email: `${id}@example.org`,
  created_at: "2020-01-01T00:00:00Z",
  app_metadata: { astra_intake_managed: true },
}));
vi.mock("@/lib/server/pathway/auth", () => ({ audit: doubles.audit }));
vi.mock("@/lib/server/pathway/client", () => ({
  config: () => ({ APPLICATION_AUTH_RETENTION_DAYS: 30 }),
  database: () => ({
    auth: {
      admin: {
        listUsers: async () => ({ data: { users: candidates }, error: null }),
        getUserById: async (id: string) => ({
          data: { user: candidates.find((u) => u.id === id) },
          error: null,
        }),
        deleteUser: doubles.remove,
      },
    },
    from: (table: string) => {
      const filters: Record<string, unknown> = {};
      const value = () => ({
        error: null,
        data:
          table === "astra_maintenance_state"
            ? { page: 1 }
            : table === "astra_admin_roles" && filters.user_id === "admin"
              ? { user_id: "admin" }
              : null,
        count:
          (table === "astra_applications" && filters.owner_id === "retained") ||
          (table === "astra_submission_requests" &&
            filters.owner_id === "pending")
            ? 1
            : 0,
      });
      const chain = {
        select: () => chain,
        update: () => chain,
        is: () => chain,
        gt: () => chain,
        eq: (key: string, val: unknown) => {
          filters[key] = val;
          return chain;
        },
        single: async () => value(),
        maybeSingle: async () => value(),
        // biome-ignore lint/suspicious/noThenProperty: models Supabase's intentional thenable query builder.
        then: (resolve: (v: ReturnType<typeof value>) => void) =>
          Promise.resolve(value()).then(resolve),
      };
      return chain;
    },
  }),
}));

import { purgeIntakeAccounts } from "@/lib/server/pathway/auth-retention";

describe("managed Auth cleanup with explicit provider doubles", () => {
  it("deletes only the old abandoned account, preserving admin, retained and pending accounts", async () => {
    expect(await purgeIntakeAccounts("synthetic-actor")).toBe(1);
    expect(doubles.remove).toHaveBeenCalledExactlyOnceWith("abandoned");
    expect(doubles.audit).toHaveBeenCalledWith(
      "synthetic-actor",
      "auth_delete",
    );
  });
});
