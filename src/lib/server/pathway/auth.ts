import "server-only";
import { cookies } from "next/headers";
import { authClient, database } from "./client";
import { HttpError } from "./http";

export const APPLICANT_COOKIE = "astra_applicant";
export const ADMIN_COOKIE = "astra_admin";
export async function setSession(name: string, token: string, seconds: number) {
  (await cookies()).set(name, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: Math.max(0, Math.min(seconds, 3600)),
  });
}
export async function identity(admin = false) {
  const token = (await cookies()).get(
    admin ? ADMIN_COOKIE : APPLICANT_COOKIE,
  )?.value;
  if (!token) throw new HttpError(401, "Please verify your email or sign in.");
  const result = await authClient().auth.getUser(token);
  const user = result.data.user;
  if (result.error || !user?.email || !user.email_confirmed_at)
    throw new HttpError(401, "Your session expired. Please verify again.");
  return { id: user.id, email: user.email.trim().toLowerCase() };
}
export async function administrator(requireOwner = false) {
  const user = await identity(true);
  const role = await database()
    .from("astra_admin_roles")
    .select("role")
    .eq("user_id", user.id)
    .maybeSingle();
  if (role.error) throw new HttpError(503, "Review access is unavailable.");
  if (!role.data || (requireOwner && role.data.role !== "admin"))
    throw new HttpError(403, "Administrator access is required.");
  return { ...user, role: String(role.data.role) };
}
export async function audit(
  actor: string,
  action: string,
  application?: string,
) {
  const result = await database()
    .from("astra_audit_records")
    .insert({
      actor_id: actor,
      action,
      application_id: application ?? null,
    });
  if (result.error)
    throw new HttpError(503, "The operation could not be audited.");
}
