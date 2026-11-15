export type AuthCandidate = {
  id: string;
  email?: string;
  created_at: string;
  last_sign_in_at?: string;
  app_metadata: Record<string, unknown>;
};
export function isManagedAuthCandidate(user: AuthCandidate, cutoff: number) {
  if (
    user.app_metadata.astra_intake_managed !== true ||
    user.app_metadata.astra_shared_account === true ||
    !user.email
  )
    return false;
  const created = Date.parse(user.created_at);
  const activity = user.last_sign_in_at
    ? Date.parse(user.last_sign_in_at)
    : created;
  return (
    Number.isFinite(created) &&
    Number.isFinite(activity) &&
    Math.max(created, activity) < cutoff
  );
}
