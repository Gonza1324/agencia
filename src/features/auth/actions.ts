"use server";

import { redirect } from "next/navigation";
import type { LoginState } from "@/features/auth/state";
import { loginSchema } from "@/features/auth/validations";
import { canAccessInternalApp } from "@/lib/permissions";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { UserRole } from "@/types/domain";

export async function loginAction(
  _previousState: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const parsedInput = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsedInput.success) {
    return {
      status: "error",
      message:
        parsedInput.error.issues[0]?.message ?? "Revisá los datos ingresados.",
    };
  }

  const supabase = await createServerSupabaseClient();
  const { data: signInData, error: signInError } =
    await supabase.auth.signInWithPassword(parsedInput.data);

  if (signInError || !signInData.user) {
    return {
      status: "error",
      message: "El email o la contraseña no son correctos.",
    };
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("role, status")
    .eq("id", signInData.user.id)
    .maybeSingle();

  const hasInternalAccess =
    !profileError &&
    profile &&
    canAccessInternalApp(profile.role as UserRole) &&
    profile.status === "active";
  const hasSubagentAccess =
    !profileError &&
    profile?.role === "subagent" &&
    profile.status === "active";

  if (!hasInternalAccess && !hasSubagentAccess) {
    await supabase.auth.signOut();

    return {
      status: "error",
      message: "Tu usuario no tiene un acceso activo.",
    };
  }

  redirect(hasSubagentAccess ? "/mi-cuenta" : "/dashboard");
}

export async function logoutAction() {
  const supabase = await createServerSupabaseClient();
  await supabase.auth.signOut();
  redirect("/login");
}
