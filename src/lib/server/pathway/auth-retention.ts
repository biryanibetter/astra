import "server-only";
import { isManagedAuthCandidate } from "@/lib/pathway/auth-retention-policy";
import { audit } from "./auth";
import { config, database } from "./client";
import { HttpError } from "./http";

/** Bounded, retryable scan of this dedicated project's intake-created accounts. */
export async function purgeIntakeAccounts(actor: string) {
  const db = database();
  const state = await db
    .from("astra_maintenance_state")
    .select("page")
    .eq("id", "auth")
    .single();
  if (state.error || !state.data)
    throw new HttpError(503, "Auth cleanup cursor is unavailable.");
  const page = Number(state.data.page);
  const result = await db.auth.admin.listUsers({ page, perPage: 50 });
  if (result.error)
    throw new HttpError(503, "Auth cleanup inventory is unavailable.");
  const cutoff =
    Date.now() - config().APPLICATION_AUTH_RETENTION_DAYS * 86400000;
  let deleted = 0;
  const deadline = Date.now() + 20000;
  let scannedAll = true;
  for (const candidate of result.data.users) {
    if (Date.now() >= deadline || deleted >= 3) {
      scannedAll = false;
      break;
    }
    if (!isManagedAuthCandidate(candidate, cutoff)) continue;
    const [role, byEmail, byOwner, pending] = await Promise.all([
      db
        .from("astra_admin_roles")
        .select("user_id")
        .eq("user_id", candidate.id)
        .maybeSingle(),
      db
        .from("astra_applications")
        .select("id", { head: true, count: "exact" })
        .eq("email", candidate.email?.trim().toLowerCase()),
      db
        .from("astra_applications")
        .select("id", { head: true, count: "exact" })
        .eq("owner_id", candidate.id),
      db
        .from("astra_submission_requests")
        .select("id", { head: true, count: "exact" })
        .eq("owner_id", candidate.id)
        .is("application_id", null)
        .gt("created_at", new Date(Date.now() - 86400000).toISOString()),
    ]);
    if (role.error || byEmail.error || byOwner.error || pending.error) {
      throw new HttpError(
        503,
        "Auth cleanup could not verify account protections.",
      );
    }
    if (
      role.data ||
      byEmail.count !== 0 ||
      byOwner.count !== 0 ||
      pending.count !== 0
    )
      continue;
    const fresh = await db.auth.admin.getUserById(candidate.id);
    if (
      fresh.error ||
      !fresh.data.user ||
      !isManagedAuthCandidate(fresh.data.user, cutoff)
    )
      continue;
    // Check membership again immediately before the destructive provider call.
    const finalRole = await db
      .from("astra_admin_roles")
      .select("user_id")
      .eq("user_id", candidate.id)
      .maybeSingle();
    if (finalRole.error)
      throw new HttpError(503, "Auth cleanup protection check failed.");
    if (finalRole.data || Date.now() >= deadline) {
      scannedAll = false;
      continue;
    }
    const removed = await db.auth.admin.deleteUser(candidate.id);
    if (removed.error && removed.error.status !== 404)
      throw new HttpError(503, "Auth account cleanup needs a retry.");
    await audit(actor, "auth_delete");
    deleted++;
  }
  const nextPage =
    scannedAll && result.data.users.length === 50
      ? page + 1
      : scannedAll
        ? 1
        : page;
  const cursor = await db
    .from("astra_maintenance_state")
    .update({ page: nextPage })
    .eq("id", "auth")
    .eq("page", page);
  if (cursor.error)
    throw new HttpError(503, "Auth cleanup cursor could not be saved.");
  return deleted;
}
