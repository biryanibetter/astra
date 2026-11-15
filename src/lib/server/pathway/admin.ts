import "server-only";
import { timingSafeEqual } from "node:crypto";
import { z } from "zod";
import { csvCell } from "@/lib/pathway/csv";
import { emailSchema, trackSchema } from "@/lib/pathway/schema";
import { ADMIN_COOKIE, administrator, audit, setSession } from "./auth";
import { purgeIntakeAccounts } from "./auth-retention";
import { authClient, database, rate } from "./client";
import { assertOrigin, HttpError, readJson, reply, route } from "./http";

const statusSchema = z.enum([
  "pending",
  "under_review",
  "accepted",
  "rejected",
  "withdrawn",
]);
function applicationId(value: unknown) {
  const parsed = z.uuid().safeParse(value);
  if (!parsed.success)
    throw new HttpError(400, "Invalid application identifier.");
  return parsed.data;
}
export const adminSession = route(async (request) => {
  assertOrigin(request);
  if (request.method === "DELETE") {
    await setSession(ADMIN_COOKIE, "", 0);
    return reply({ signedOut: true });
  }
  const input = z
    .strictObject({ email: emailSchema, password: z.string().min(1).max(200) })
    .safeParse(await readJson(request));
  if (!input.success) throw new HttpError(400, "Check your sign-in fields.");
  await rate(request, "admin-login", 10, input.data.email);
  const result = await authClient().auth.signInWithPassword(input.data);
  const user = result.data.user;
  if (result.error || !result.data.session || !user?.email_confirmed_at)
    throw new HttpError(401, "Sign-in could not be verified.");
  const membership = await database()
    .from("astra_admin_roles")
    .select("role")
    .eq("user_id", user.id)
    .maybeSingle();
  if (membership.error || !membership.data)
    throw new HttpError(403, "Review access is not authorized.");
  await audit(user.id, "login");
  await setSession(
    ADMIN_COOKIE,
    result.data.session.access_token,
    result.data.session.expires_in,
  );
  return reply({ signedIn: true });
});

const listQuery = z.object({
  page: z.coerce.number().int().min(1).max(10000).default(1),
  q: z.string().trim().max(80).default(""),
  track: trackSchema.optional(),
  status: statusSchema.optional(),
  sort: z.enum(["submitted_at", "status", "track"]).default("submitted_at"),
  direction: z.enum(["asc", "desc"]).default("desc"),
  export: z.enum(["csv"]).optional(),
});
export const adminApplications = route(async (request) => {
  if (request.method !== "GET") assertOrigin(request);
  if (request.headers.get("sec-fetch-site") === "cross-site")
    throw new HttpError(403, "This request is not allowed.");
  const user = await administrator(request.method === "DELETE");
  const db = database();
  const url = new URL(request.url);
  if (request.method === "PATCH") {
    const input = z
      .strictObject({
        id: z.uuid(),
        status: statusSchema,
        note: z.string().trim().max(5000).default(""),
      })
      .safeParse(await readJson(request));
    if (!input.success) throw new HttpError(400, "Check the review fields.");
    const result = await db.rpc("astra_review", {
      p_actor: user.id,
      p_id: input.data.id,
      p_status: input.data.status,
      p_note: input.data.note,
    });
    if (result.error)
      throw new HttpError(503, "The review could not be saved.");
    return reply({ saved: true });
  }
  if (request.method === "DELETE") {
    const id = applicationId(url.searchParams.get("id"));
    await deleteApplication(user.id, id);
    return reply({ deleted: true });
  }
  if (request.method === "POST") {
    const input = z
      .strictObject({ id: z.uuid(), fileId: z.uuid() })
      .safeParse(await readJson(request));
    if (!input.success) throw new HttpError(400, "Invalid CV request.");
    const app = await db
      .from("astra_applications")
      .select("id,status")
      .eq("id", input.data.id)
      .maybeSingle();
    if (app.error || !app.data || app.data.status === "deleting")
      throw new HttpError(404, "The CV is unavailable.");
    const file = await db
      .from("astra_cv_files")
      .select("object_path")
      .eq("application_id", input.data.id)
      .eq("id", input.data.fileId)
      .maybeSingle();
    if (file.error || !file.data)
      throw new HttpError(404, "The CV is unavailable.");
    await audit(user.id, "cv", input.data.id);
    const signed = await db.storage
      .from("astra-cvs")
      .createSignedUrl(file.data.object_path, 60, { download: "astra-cv.pdf" });
    if (signed.error)
      throw new HttpError(503, "CV access could not be created.");
    return reply({ url: signed.data.signedUrl, expiresIn: 60 });
  }
  if (url.searchParams.has("id")) {
    const id = applicationId(url.searchParams.get("id"));
    await audit(user.id, "detail", id);
    const result = await db
      .from("astra_applications")
      .select(
        "id,email,track,status,submitted_at,expires_at,astra_profiles(*),astra_answers(question_id,value),astra_projects(ordinal,title,description),astra_links(ordinal,type,label,url),astra_cv_files(id,ordinal,file_size),astra_review_notes(id,note,created_at)",
      )
      .eq("id", id)
      .single();
    if (result.error)
      throw new HttpError(404, "The application is unavailable.");
    return reply(result.data);
  }
  const input = listQuery.safeParse(Object.fromEntries(url.searchParams));
  if (!input.success) throw new HttpError(400, "Invalid list filters.");
  const filters = input.data;
  if (filters.export && user.role !== "admin")
    throw new HttpError(403, "Export requires administrator access.");
  await audit(user.id, filters.export ? "export" : "list");
  const makeQuery = () => {
    let query = db
      .from("astra_applications")
      .select(
        "id,track,status,submitted_at,astra_profiles!inner(full_name,school,grade)",
        { count: "exact" },
      );
    if (filters.track) query = query.eq("track", filters.track);
    if (filters.status) query = query.eq("status", filters.status);
    if (filters.q)
      query = query.ilike(
        "astra_profiles.full_name",
        `%${filters.q.replaceAll("\\", "\\\\").replaceAll("%", "\\%").replaceAll("_", "\\_")}%`,
      );
    return query
      .order(filters.sort, { ascending: filters.direction === "asc" })
      .order("id", { ascending: true });
  };
  if (filters.export) {
    // Bounded to 1000 records per export; refuse truncation rather than silently omit.
    const result = await makeQuery().range(0, 999);
    if (result.error)
      throw new HttpError(503, "Export could not be generated.");
    if ((result.count ?? 0) > 1000)
      throw new HttpError(
        400,
        "Narrow the filters to at most 1000 applications before exporting.",
      );
    const rows = [
      ["Name", "School", "Grade", "Pathway", "Submitted", "Status"]
        .map(csvCell)
        .join(","),
    ];
    for (const app of result.data ?? []) {
      const profile = Array.isArray(app.astra_profiles)
        ? app.astra_profiles[0]
        : app.astra_profiles;
      rows.push(
        [
          profile?.full_name,
          profile?.school,
          profile?.grade,
          app.track,
          app.submitted_at,
          app.status,
        ]
          .map(csvCell)
          .join(","),
      );
    }
    return new Response(`\uFEFF${rows.join("\r\n")}\r\n`, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": 'attachment; filename="astra-applications.csv"',
        "Cache-Control": "no-store, private",
        "X-Content-Type-Options": "nosniff",
      },
    });
  }
  const result = await makeQuery().range(
    (filters.page - 1) * 25,
    filters.page * 25 - 1,
  );
  if (result.error)
    throw new HttpError(503, "Applications could not be loaded.");
  return reply({
    applications: result.data,
    count: result.count,
    page: filters.page,
    pageSize: 25,
  });
});

async function deleteApplication(actor: string, id: string) {
  const db = database();
  const marked = await db.rpc("astra_delete", {
    p_actor: actor,
    p_id: id,
    p_finish: false,
  });
  if (marked.error) throw new HttpError(503, "Deletion could not be prepared.");
  const files = await db
    .from("astra_cv_files")
    .select("object_path")
    .eq("application_id", id);
  if (files.error)
    throw new HttpError(503, "Deletion could not read CV metadata.");
  if (files.data.length) {
    const removed = await db.storage
      .from("astra-cvs")
      .remove(files.data.map((f) => String(f.object_path)));
    if (removed.error)
      throw new HttpError(
        503,
        "Deletion is pending. Retry to finish removing CVs.",
      );
  }
  const finished = await db.rpc("astra_delete", {
    p_actor: actor,
    p_id: id,
    p_finish: true,
  });
  if (finished.error)
    throw new HttpError(503, "Deletion is pending. Retry to finish.");
}

export const maintenance = route(async (request) => {
  const secret = process.env.APPLICATION_MAINTENANCE_SECRET ?? "";
  const supplied =
    request.headers.get("authorization")?.replace(/^Bearer /u, "") ?? "";
  const trustedJob =
    secret.length >= 32 &&
    Buffer.byteLength(secret) === Buffer.byteLength(supplied) &&
    timingSafeEqual(Buffer.from(secret), Buffer.from(supplied));
  let actor: string;
  if (trustedJob) {
    actor = z.uuid().parse(process.env.APPLICATION_MAINTENANCE_ACTOR_ID);
    const role = await database()
      .from("astra_admin_roles")
      .select("role")
      .eq("user_id", actor)
      .maybeSingle();
    if (role.error || role.data?.role !== "admin")
      throw new HttpError(403, "Maintenance actor is not authorized.");
  } else {
    assertOrigin(request);
    actor = (await administrator(true)).id;
  }
  await audit(actor, "maintenance");
  const db = database();
  const attempts = await db
    .from("astra_upload_attempts")
    .select("id,paths")
    .eq("accepted", false)
    .is("cleaned_at", null)
    .lt("created_at", new Date(Date.now() - 3600000).toISOString())
    .limit(50);
  if (attempts.error)
    throw new HttpError(503, "Cleanup could not read pending attempts.");
  let cleaned = 0;
  for (const attempt of attempts.data) {
    const removed = await db.storage
      .from("astra-cvs")
      .remove(attempt.paths as string[]);
    if (removed.error)
      throw new HttpError(503, "Storage cleanup needs a retry.");
    const marked = await db
      .from("astra_upload_attempts")
      .update({ cleaned_at: new Date().toISOString() })
      .eq("id", attempt.id)
      .eq("accepted", false);
    if (marked.error)
      throw new HttpError(503, "Cleanup state could not be recorded.");
    cleaned++;
  }
  const expired = await db
    .from("astra_applications")
    .select("id")
    .lt("expires_at", new Date().toISOString())
    .limit(25);
  if (expired.error)
    throw new HttpError(503, "Retention could not be checked.");
  for (const app of expired.data)
    await deleteApplication(actor, String(app.id));
  const limits = await db
    .from("astra_rate_limits")
    .delete()
    .lt("starts_at", new Date(Date.now() - 86400000).toISOString());
  if (limits.error) throw new HttpError(503, "Abuse counter cleanup failed.");
  const coordination = await db.rpc("astra_purge_coordination");
  if (coordination.error)
    throw new HttpError(503, "Coordination cleanup needs a retry.");
  const expiredAuthAccounts = await purgeIntakeAccounts(actor);
  return reply({
    expiredAuthAccounts,
    cleanedAttempts: cleaned,
    expiredApplications: expired.data.length,
  });
});
