// @vitest-environment node
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("pathway migration release contract (not a live database test)", () => {
  it("restricts every application table and privileged RPC", () => {
    const sql = readFileSync(
      "supabase/migrations/202611150001_pathways.sql",
      "utf8",
    );
    const tables = [...sql.matchAll(/create table public\.(astra_\w+)/g)].map(
      (m) => m[1],
    );
    expect(tables.length).toBeGreaterThanOrEqual(12);
    for (const table of tables) {
      expect(sql).toContain(
        `alter table public.${table} enable row level security`,
      );
      expect(sql).toContain(
        `revoke all on public.${table} from public, anon, authenticated`,
      );
    }
    expect(sql).toContain("unique (round_id, track, email)");
    expect(sql).toContain("file_size between 1 and 5242880");
    expect(sql).toContain("ordinal between 1 and 5");
    expect(sql).toContain("'astra-cvs', 'astra-cvs', false");
    expect(sql).toContain("revoke all on function public.astra_finalize");
  });
});
