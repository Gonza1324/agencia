import { createServerSupabaseClient } from "@/lib/supabase/server";
import {
  canAccessInternalApp,
  canManageSensitiveOperation,
  canOperate,
} from "@/lib/permissions";
import type { UserRole } from "@/types/domain";

async function requireProfile() {
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
    .select("full_name, role, status")
    .eq("id", user.id)
    .maybeSingle();

  if (profileError || !profile || profile.status !== "active") {
    throw new Error("ACTIVE_PROFILE_REQUIRED");
  }

  return {
    profile,
    supabase,
    user,
  };
}

export async function requireInternalUser() {
  const context = await requireProfile();

  if (!canAccessInternalApp(context.profile.role as UserRole)) {
    throw new Error("INTERNAL_USER_REQUIRED");
  }

  return context;
}

export async function requireOperator() {
  const context = await requireProfile();

  if (!canOperate(context.profile.role as UserRole)) {
    throw new Error("OPERATOR_REQUIRED");
  }

  return context;
}

export async function requireOwnerAdmin() {
  const context = await requireProfile();

  if (!canManageSensitiveOperation(context.profile.role as UserRole)) {
    throw new Error("OWNER_ADMIN_REQUIRED");
  }

  return context;
}

export async function requireSubagentUser() {
  const context = await requireProfile();

  if (context.profile.role !== "subagent") {
    throw new Error("SUBAGENT_USER_REQUIRED");
  }

  return context;
}
