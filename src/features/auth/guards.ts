import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function requireOwnerAdmin() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    throw new Error("AUTH_REQUIRED");
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("role, status")
    .eq("id", user.id)
    .maybeSingle();

  if (
    profileError ||
    profile?.role !== "owner_admin" ||
    profile.status !== "active"
  ) {
    throw new Error("OWNER_ADMIN_REQUIRED");
  }

  return {
    supabase,
    user,
  };
}
