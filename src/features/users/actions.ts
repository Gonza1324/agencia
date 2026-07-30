"use server";

import { revalidatePath } from "next/cache";

import { requireOwnerAdmin } from "@/features/auth/guards";
import type { UserFormState } from "@/features/users/state";
import {
  createUserSchema,
  resetUserPasswordSchema,
  subagentAssignmentsSchema,
  updateUserSchema,
} from "@/features/users/validations";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import type { Json } from "@/types/database";

function adminConfigurationError(): UserFormState {
  return {
    status: "error",
    message:
      "La administración de usuarios todavía no tiene configurada la clave segura del servidor.",
  };
}

async function registerAudit({
  action,
  actorId,
  entityId,
  newValues,
  oldValues,
  reason,
}: {
  action: string;
  actorId: string;
  entityId: string;
  newValues?: Json;
  oldValues?: Json;
  reason?: string;
}) {
  const admin = createAdminSupabaseClient();
  await admin.from("audit_logs").insert({
    action,
    entity_type: "profile",
    entity_id: entityId,
    user_id: actorId,
    new_values: newValues ?? null,
    old_values: oldValues ?? null,
    reason: reason ?? null,
  });
}

export async function createUserAction(
  _previousState: UserFormState,
  formData: FormData,
): Promise<UserFormState> {
  const parsedInput = createUserSchema.safeParse({
    email: formData.get("email"),
    fullName: formData.get("fullName"),
    role: formData.get("role"),
    temporaryPassword: formData.get("temporaryPassword"),
  });

  if (!parsedInput.success) {
    return {
      status: "error",
      message: "Revisá los campos indicados.",
      fieldErrors: parsedInput.error.flatten().fieldErrors,
    };
  }

  const { user: actor } = await requireOwnerAdmin();
  let admin;

  try {
    admin = createAdminSupabaseClient();
  } catch {
    return adminConfigurationError();
  }

  const { data: authData, error: authError } =
    await admin.auth.admin.createUser({
      email: parsedInput.data.email,
      password: parsedInput.data.temporaryPassword,
      email_confirm: true,
      user_metadata: {
        full_name: parsedInput.data.fullName,
      },
    });

  if (authError || !authData.user) {
    return {
      status: "error",
      message: authError?.message.toLowerCase().includes("already")
        ? "Ya existe un usuario con ese email."
        : "No se pudo crear el acceso. Intentá nuevamente.",
    };
  }

  const { error: profileError } = await admin.from("profiles").insert({
    id: authData.user.id,
    email: parsedInput.data.email,
    full_name: parsedInput.data.fullName,
    role: parsedInput.data.role,
    status: "active",
  });

  if (profileError) {
    await admin.auth.admin.deleteUser(authData.user.id);
    return {
      status: "error",
      message: "No se pudo completar el perfil del usuario.",
    };
  }

  await registerAudit({
    action: "create_user",
    actorId: actor.id,
    entityId: authData.user.id,
    newValues: {
      email: parsedInput.data.email,
      full_name: parsedInput.data.fullName,
      role: parsedInput.data.role,
      status: "active",
    },
  });

  revalidatePath("/configuracion/usuarios");

  return {
    status: "success",
    message: "Usuario creado. Ya puede ingresar con la contraseña temporal.",
  };
}

export async function updateUserAction(
  _previousState: UserFormState,
  formData: FormData,
): Promise<UserFormState> {
  const parsedInput = updateUserSchema.safeParse({
    id: formData.get("id"),
    fullName: formData.get("fullName"),
    role: formData.get("role"),
    status: formData.get("status"),
  });

  if (!parsedInput.success) {
    return {
      status: "error",
      message: "Revisá los campos indicados.",
      fieldErrors: parsedInput.error.flatten().fieldErrors,
    };
  }

  const { user: actor } = await requireOwnerAdmin();
  let admin;

  try {
    admin = createAdminSupabaseClient();
  } catch {
    return adminConfigurationError();
  }

  const { data: currentProfile, error: currentError } = await admin
    .from("profiles")
    .select("id, email, full_name, role, status")
    .eq("id", parsedInput.data.id)
    .maybeSingle();

  if (currentError || !currentProfile) {
    return {
      status: "error",
      message: "El usuario ya no existe.",
    };
  }

  if (
    actor.id === parsedInput.data.id &&
    (parsedInput.data.role !== currentProfile.role ||
      parsedInput.data.status !== currentProfile.status)
  ) {
    return {
      status: "error",
      message:
        "No podés cambiar tu propio rol o estado. Otro propietario debe hacerlo.",
    };
  }

  const removesActiveOwner =
    currentProfile.role === "owner_admin" &&
    currentProfile.status === "active" &&
    (parsedInput.data.role !== "owner_admin" ||
      parsedInput.data.status !== "active");

  if (removesActiveOwner) {
    const { count } = await admin
      .from("profiles")
      .select("id", { count: "exact", head: true })
      .eq("role", "owner_admin")
      .eq("status", "active")
      .neq("id", parsedInput.data.id);

    if (!count) {
      return {
        status: "error",
        message: "Debe quedar al menos un propietario activo.",
      };
    }
  }

  const { error: metadataError } = await admin.auth.admin.updateUserById(
    parsedInput.data.id,
    {
      user_metadata: {
        full_name: parsedInput.data.fullName,
      },
    },
  );

  if (metadataError) {
    return {
      status: "error",
      message: "No se pudo actualizar el usuario de autenticación.",
    };
  }

  const { error: updateError } = await admin
    .from("profiles")
    .update({
      full_name: parsedInput.data.fullName,
      role: parsedInput.data.role,
      status: parsedInput.data.status,
    })
    .eq("id", parsedInput.data.id);

  if (updateError) {
    return {
      status: "error",
      message: "No se pudo guardar el rol o estado.",
    };
  }

  await registerAudit({
    action: "update_user",
    actorId: actor.id,
    entityId: parsedInput.data.id,
    oldValues: currentProfile,
    newValues: {
      ...currentProfile,
      full_name: parsedInput.data.fullName,
      role: parsedInput.data.role,
      status: parsedInput.data.status,
    },
  });

  revalidatePath("/configuracion/usuarios");

  return {
    status: "success",
    message: "Usuario actualizado correctamente.",
  };
}

export async function resetUserPasswordAction(
  _previousState: UserFormState,
  formData: FormData,
): Promise<UserFormState> {
  const parsedInput = resetUserPasswordSchema.safeParse({
    id: formData.get("id"),
    temporaryPassword: formData.get("temporaryPassword"),
  });

  if (!parsedInput.success) {
    return {
      status: "error",
      message:
        parsedInput.error.issues[0]?.message ??
        "La contraseña temporal no es válida.",
      fieldErrors: parsedInput.error.flatten().fieldErrors,
    };
  }

  const { user: actor } = await requireOwnerAdmin();
  let admin;

  try {
    admin = createAdminSupabaseClient();
  } catch {
    return adminConfigurationError();
  }

  const { error } = await admin.auth.admin.updateUserById(parsedInput.data.id, {
    password: parsedInput.data.temporaryPassword,
  });

  if (error) {
    return {
      status: "error",
      message: "No se pudo restablecer la contraseña.",
    };
  }

  await registerAudit({
    action: "reset_user_password",
    actorId: actor.id,
    entityId: parsedInput.data.id,
    reason: "Restablecimiento manual desde Configuración",
  });

  return {
    status: "success",
    message: "Contraseña temporal actualizada.",
  };
}

export async function updateSubagentAssignmentsAction(
  _previousState: UserFormState,
  formData: FormData,
): Promise<UserFormState> {
  const parsed = subagentAssignmentsSchema.safeParse({
    userId: formData.get("userId"),
    subagentIds: formData.getAll("subagentIds"),
  });

  if (!parsed.success) {
    return {
      status: "error",
      message: "Revisá las máquinas seleccionadas.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  const { supabase } = await requireOwnerAdmin();
  const { error } = await supabase.rpc("set_subagent_user_links", {
    p_user_id: parsed.data.userId,
    p_subagent_ids: parsed.data.subagentIds,
  });

  if (error) {
    return {
      status: "error",
      message: error.message.includes("rol Subagente")
        ? "El usuario debe tener rol Subagente antes de asignarle máquinas."
        : "No se pudieron guardar las máquinas asignadas.",
    };
  }

  revalidatePath("/configuracion/usuarios");

  return {
    status: "success",
    message: "Máquinas asignadas correctamente.",
  };
}
