// @vitest-environment node

import { createHash, randomUUID } from "node:crypto";
import { readFileSync } from "node:fs";
import { PGlite } from "@electric-sql/pglite";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { pathwayQuestions } from "@/components/pathway-questions";

// Real embedded Postgres SQL tests. Provider schemas are minimal synthetic
// fixtures; these do NOT certify hosted Supabase Auth/Storage behavior.
const pg = new PGlite();
const owner = randomUUID();
const round = randomUUID();
const hash = "a".repeat(64);
beforeAll(async () => {
  await pg.exec(`
    create role anon;
    create role authenticated;
    create role service_role bypassrls;
    create schema auth;
    create table auth.users(id uuid primary key,raw_user_meta_data jsonb default '{}'::jsonb,raw_app_meta_data jsonb default '{}'::jsonb);
    create schema storage;
    create table storage.buckets(id text primary key,name text,public boolean,file_size_limit bigint,allowed_mime_types text[]);
    create table storage.objects(id uuid primary key default gen_random_uuid(),bucket_id text,name text);
    alter table storage.objects enable row level security;
    grant usage on schema storage to anon, authenticated;
    grant select,insert,update,delete on storage.objects to anon, authenticated;
    create policy existing_overbroad_policy on storage.objects for all to anon,authenticated using(true) with check(true);
  `);
  await pg.exec(
    readFileSync("supabase/migrations/202611150001_pathways.sql", "utf8"),
  );
  await pg.query("insert into auth.users(id) values($1)", [owner]);
  await pg.query(
    "insert into public.astra_rounds(id,name,opens_at,closes_at,is_active) values($1,'Synthetic round',now()-interval '1 day',now()+interval '1 day',true)",
    [round],
  );
}, 30000);
afterAll(async () => {
  if (!pg.closed) await pg.close();
});

function payload(track: "core" | "fellow", email = "synthetic@example.org") {
  return {
    track,
    email,
    fullName: "Synthetic Applicant",
    school: "Synthetic School",
    grade: "grade-9-year-10",
    ageEligible: true,
    questionResponses: Object.fromEntries(
      pathwayQuestions[track].questions.map((q) => [
        q.id,
        q.type === "textarea"
          ? "A".repeat(q.minimum)
          : q.type === "multi-select"
            ? [q.options[0]]
            : q.options[0],
      ]),
    ),
    projects: [{ title: "Project", description: "Synthetic project" }],
    links: [],
  };
}
async function begin(
  track: "core" | "fellow",
  email: string,
  key = randomUUID(),
) {
  const attempt = randomUUID();
  const file = {
    id: randomUUID(),
    path: `${attempt}/${randomUUID()}.pdf`,
    size: 100,
    sha256: hash,
  };
  const result = await pg.query<{ state: { state: string; id?: string } }>(
    "select public.astra_begin($1,$2,$3,$4,$5,$6,$7,$8,$9) as state",
    [
      key,
      owner,
      round,
      email,
      createHash("sha256").update(email).digest("hex"),
      track,
      hash,
      attempt,
      [file.path],
    ],
  );
  return { key, attempt, file, state: result.rows[0]?.state };
}
async function finish(
  start: Awaited<ReturnType<typeof begin>>,
  value: ReturnType<typeof payload>,
) {
  await pg.query(
    "insert into storage.objects(bucket_id,name) values('astra-cvs',$1)",
    [start.file.path],
  );
  return pg.query<{ id: string }>(
    "select public.astra_finalize($1,$2,$3,$4,$5,90) as id",
    [
      start.key,
      start.attempt,
      owner,
      JSON.stringify(value),
      JSON.stringify([start.file]),
    ],
  );
}
describe("pathway persistence in embedded Postgres", () => {
  it("tags only new intake signups, never existing users editing their metadata", async () => {
    const managed = randomUUID();
    const existing = randomUUID();
    await pg.query(
      "insert into auth.users(id,raw_user_meta_data) values($1,$2)",
      [managed, JSON.stringify({ astra_intake_signup: true })],
    );
    await pg.query("insert into auth.users(id) values($1)", [existing]);
    await pg.query("update auth.users set raw_user_meta_data=$1 where id=$2", [
      JSON.stringify({ astra_intake_signup: true }),
      existing,
    ]);
    const result = await pg.query<{
      id: string;
      raw_app_meta_data: Record<string, unknown>;
    }>("select id,raw_app_meta_data from auth.users where id=any($1)", [
      [managed, existing],
    ]);
    expect(
      result.rows.find((row) => row.id === managed)?.raw_app_meta_data
        .astra_intake_managed,
    ).toBe(true);
    expect(
      result.rows.find((row) => row.id === existing)?.raw_app_meta_data
        .astra_intake_managed,
    ).toBeUndefined();
  });
  it("keeps database question rules aligned with the unchanged frontend questions", async () => {
    for (const track of ["core", "fellow"] as const) {
      const result = await pg.query<{
        question_id: string;
        kind: string;
        minimum: number | null;
        maximum: number | null;
        options: string[] | null;
      }>(
        "select question_id,kind,minimum,maximum,options from public.astra_question_rules where track=$1",
        [track],
      );
      for (const q of pathwayQuestions[track].questions) {
        const rule = result.rows.find((r) => r.question_id === q.id);
        expect(rule?.kind).toBe(q.type);
        if (q.type === "textarea") {
          expect(rule?.minimum).toBe(q.minimum);
          expect(rule?.maximum).toBe(q.maximum);
        } else expect(rule?.options).toEqual(q.options);
      }
    }
  });
  it("enforces rate limits in the database", async () => {
    const values = [];
    for (let i = 0; i < 6; i++) {
      const result = await pg.query<{ allowed: boolean }>(
        "select public.astra_limit($1,5) as allowed",
        ["b".repeat(64)],
      );
      values.push(result.rows[0]?.allowed);
    }
    expect(values).toEqual([true, true, true, true, true, false]);
  });
  it("blocks anonymous and ordinary authenticated table reads and privileged RPCs", async () => {
    for (const role of ["anon", "authenticated"]) {
      // Role identifiers are fixed test constants, never request input.
      await pg.exec(
        role === "anon" ? "set role anon" : "set role authenticated",
      );
      try {
        await expect(
          pg.query("select * from public.astra_applications"),
        ).rejects.toThrow(/permission denied/u);
        await expect(pg.query("select public.astra_intake()")).rejects.toThrow(
          /permission denied/u,
        );
      } finally {
        await pg.exec("reset role");
      }
    }
  });
  it("denies bucket listing despite an unrelated pre-existing permissive storage policy", async () => {
    await pg.exec(
      "insert into storage.objects(bucket_id,name) values('astra-cvs','synthetic.pdf'); set role anon",
    );
    try {
      const result = await pg.query(
        "select * from storage.objects where bucket_id='astra-cvs'",
      );
      expect(result.rows).toHaveLength(0);
    } finally {
      await pg.exec("reset role");
    }
  });
  it("accepts Core and Fellow once each and recovers a lost receipt idempotently", async () => {
    for (const track of ["core", "fellow"] as const) {
      const start = await begin(track, "synthetic@example.org");
      expect(start.state?.state).toBe("new");
      const saved = await finish(start, payload(track));
      expect(saved.rows[0]?.id).toMatch(/^[a-f0-9-]{36}$/u);
      const retry = await begin(track, "synthetic@example.org", start.key);
      expect(retry.state).toEqual({ state: "accepted", id: saved.rows[0]?.id });
      const duplicate = await begin(track, "synthetic@example.org");
      expect(duplicate.state?.state).toBe("duplicate");
    }
  });
  it("rejects a sixth project atomically without creating a partial application", async () => {
    const start = await begin("core", "invalid@example.org");
    const value = payload("core", "invalid@example.org");
    value.projects = Array.from({ length: 6 }, () => ({
      title: "Project",
      description: "Synthetic",
    }));
    await expect(finish(start, value)).rejects.toThrow(/Invalid counts/u);
    expect(
      (
        await pg.query(
          "select id from public.astra_applications where email='invalid@example.org'",
        )
      ).rows,
    ).toHaveLength(0);
  });
  it("requires projects and registered CVs for both pathways at persistence", async () => {
    for (const track of ["core", "fellow"] as const) {
      const email = `missing-project-${track}@example.org`;
      const start = await begin(track, email);
      const value = payload(track, email);
      value.projects = [];
      await expect(finish(start, value)).rejects.toThrow(/Invalid counts/u);
      const missingCv = await begin(track, `missing-cv-${track}@example.org`);
      await expect(
        pg.query("select public.astra_finalize($1,$2,$3,$4,$5,90)", [
          missingCv.key,
          missingCv.attempt,
          owner,
          JSON.stringify(payload(track, `missing-cv-${track}@example.org`)),
          "[]",
        ]),
      ).rejects.toThrow(/Invalid counts/u);
      expect(
        (
          await pg.query(
            "select id from public.astra_applications where email in ($1,$2)",
            [email, `missing-cv-${track}@example.org`],
          )
        ).rows,
      ).toHaveLength(0);
    }
  });
  it("persists authorized review notes/status and rejects revoked reviewers", async () => {
    const reviewer = randomUUID();
    await pg.query("insert into auth.users(id) values($1)", [reviewer]);
    const email = "review-fixture@example.org";
    const saved = await finish(
      await begin("core", email),
      payload("core", email),
    );
    const id = saved.rows[0]?.id;
    await expect(
      pg.query("select public.astra_review($1,$2,$3,$4)", [
        reviewer,
        id,
        "under_review",
        "Synthetic note",
      ]),
    ).rejects.toThrow();
    await pg.query(
      "insert into public.astra_admin_roles(user_id,role) values($1,'reviewer')",
      [reviewer],
    );
    await pg.query("select public.astra_review($1,$2,$3,$4)", [
      reviewer,
      id,
      "under_review",
      "Synthetic note",
    ]);
    expect(
      (
        await pg.query(
          "select status from public.astra_applications where id=$1",
          [id],
        )
      ).rows,
    ).toEqual([{ status: "under_review" }]);
    expect(
      (
        await pg.query(
          "select note from public.astra_review_notes where application_id=$1",
          [id],
        )
      ).rows,
    ).toEqual([{ note: "Synthetic note" }]);
    await pg.query("delete from public.astra_admin_roles where user_id=$1", [
      reviewer,
    ]);
    await expect(
      pg.query("select public.astra_review($1,$2,$3,$4)", [
        reviewer,
        id,
        "accepted",
        "Must not persist",
      ]),
    ).rejects.toThrow();
    expect(
      (
        await pg.query(
          "select status from public.astra_applications where id=$1",
          [id],
        )
      ).rows,
    ).toEqual([{ status: "under_review" }]);
  });
  it("rejects a second lease while the first idempotency lease is live", async () => {
    const start = await begin("core", "race@example.org");
    const retry = await begin("core", "race@example.org", start.key);
    expect(start.state?.state).toBe("new");
    expect(retry.state?.state).toBe("processing");
  });
  it("rejects an expired upload attempt after a retry owns a new prefix", async () => {
    const start = await begin("core", "expired@example.org");
    await pg.query(
      "update public.astra_submission_requests set lease_until=now()-interval '1 minute' where id=$1",
      [start.key],
    );
    const retry = await begin("core", "expired@example.org", start.key);
    expect(retry.state?.state).toBe("new");
    expect(retry.file.path).not.toBe(start.file.path);
    await expect(
      finish(start, payload("core", "expired@example.org")),
    ).rejects.toThrow(/lease expired/u);
  });
  it("keeps the once-per-round rule after deleting applicant content", async () => {
    const email = "deleted@example.org";
    const start = await begin("core", email);
    const saved = await finish(start, payload("core", email));
    const id = saved.rows[0]?.id;
    await pg.query(
      "insert into public.astra_admin_roles(user_id,role) values($1,'admin')",
      [owner],
    );
    await pg.query("select public.astra_delete($1,$2,false)", [owner, id]);
    await pg.query("delete from storage.objects where name=$1", [
      start.file.path,
    ]);
    await pg.query("select public.astra_delete($1,$2,true)", [owner, id]);
    const again = await begin("core", email);
    expect(again.state?.state).toBe("duplicate");
  });
});
