"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireOperator } from "@/features/auth/guards";
import type { SubagentFormState } from "@/features/subagents/state";
import {
  subagentIdSchema,
  subagentSchema,
} from "@/features/subagents/validations";

function getSubagentInput(formData: FormData) {
  return subagentSchema.safeParse({
    name: formData.get("name"),
    machineCode: formData.get("machineCode"),
    commissionPercentage: formData.get("commissionPercentage"),
    notes: formData.get("notes"),
  });
}

function getMutationErrorMessage(code?: string) {
  if (code === "23505") {
    return "Ya existe un Subagente activo con ese código de máquina.";
  }

  return "No se pudo guardar el Subagente. Intentá nuevamente.";
}

export async function createSubagentAction(
  _previousState: SubagentFormState,
  formData: FormData,
): Promise<SubagentFormState> {
  const parsedInput = getSubagentInput(formData);

  if (!parsedInput.success) {
    return {
      status: "error",
      message: "Revisá los campos indicados.",
      fieldErrors: parsedInput.error.flatten().fieldErrors,
    };
  }

  const { supabase, user } = await requireOperator();
  const { data, error } = await supabase
    .from("subagents")
    .insert({
      name: parsedInput.data.name,
      machine_code: parsedInput.data.machineCode,
      commission_percentage: parsedInput.data.commissionPercentage,
      notes: parsedInput.data.notes ?? null,
      created_by: user.id,
      updated_by: user.id,
    })
    .select("id")
    .single();

  if (error) {
    return {
      status: "error",
      message: getMutationErrorMessage(error.code),
    };
  }

  revalidatePath("/subagentes");
  redirect(`/subagentes/${data.id}?created=1`);
}

export async function updateSubagentAction(
  _previousState: SubagentFormState,
  formData: FormData,
): Promise<SubagentFormState> {
  const parsedId = subagentIdSchema.safeParse(formData.get("id"));
  const parsedInput = getSubagentInput(formData);

  if (!parsedId.success || !parsedInput.success) {
    return {
      status: "error",
      message: "Revisá los campos indicados.",
      fieldErrors: parsedInput.success
        ? undefined
        : parsedInput.error.flatten().fieldErrors,
    };
  }

  const { supabase, user } = await requireOperator();
  const { data, error } = await supabase
    .from("subagents")
    .update({
      name: parsedInput.data.name,
      machine_code: parsedInput.data.machineCode,
      commission_percentage: parsedInput.data.commissionPercentage,
      notes: parsedInput.data.notes ?? null,
      updated_by: user.id,
    })
    .eq("id", parsedId.data)
    .select("id")
    .maybeSingle();

  if (error) {
    return {
      status: "error",
      message: getMutationErrorMessage(error.code),
    };
  }

  if (!data) {
    return {
      status: "error",
      message: "El Subagente ya no existe o no tenés acceso para editarlo.",
    };
  }

  revalidatePath("/subagentes");
  revalidatePath(`/subagentes/${parsedId.data}`);
  redirect(`/subagentes/${parsedId.data}?updated=1`);
}

export async function toggleSubagentStatusAction(formData: FormData) {
  const parsedId = subagentIdSchema.safeParse(formData.get("id"));

  if (!parsedId.success) {
    redirect("/subagentes?error=invalid");
  }

  const { supabase, user } = await requireOperator();
  const { data: currentSubagent, error: readError } = await supabase
    .from("subagents")
    .select("status")
    .eq("id", parsedId.data)
    .maybeSingle();

  if (readError || !currentSubagent) {
    redirect("/subagentes?error=not-found");
  }

  const nextStatus =
    currentSubagent.status === "active" ? "inactive" : "active";
  const { error: updateError } = await supabase
    .from("subagents")
    .update({
      status: nextStatus,
      updated_by: user.id,
    })
    .eq("id", parsedId.data);

  if (updateError) {
    const errorCode = updateError.code === "23505" ? "machine-code" : "save";
    redirect(`/subagentes/${parsedId.data}?statusError=${errorCode}`);
  }

  revalidatePath("/subagentes");
  revalidatePath(`/subagentes/${parsedId.data}`);
  redirect(`/subagentes/${parsedId.data}?status=${nextStatus}`);
}
