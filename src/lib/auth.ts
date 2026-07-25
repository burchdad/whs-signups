import { hasSupabaseEnv, createSupabaseServerClient } from "./supabase/clients";

export async function requireAdmin() {
  if (!hasSupabaseEnv()) {
    return { user: { id: "local-admin", email: "local-admin@whssignups.test" }, organizationId: "11111111-1111-4111-8111-111111111111" };
  }
  const supabase = await createSupabaseServerClient();
  const { data: userData, error } = await supabase.auth.getUser();
  if (error || !userData.user) throw new Error("Unauthorized.");
  const { data: membership, error: membershipError } = await supabase
    .from("organization_admins")
    .select("organization_id")
    .eq("user_id", userData.user.id)
    .limit(1)
    .maybeSingle();
  if (membershipError || !membership) throw new Error("Unauthorized.");
  return { user: userData.user, organizationId: membership.organization_id as string };
}
