"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireOperator } from "@/features/auth/guards";
import type { SettlementFormState } from "@/features/settlements/state";
import {
  settlementIdSchema,
  settlementSchema,
  type SettlementInput,
  voidSettlementSchema,
} from "@/features/settlements/validations";
import { calculateSettlementAmounts } from "@/lib/commissions";
import type { Database } from "@/types/database";
import type { SupabaseClient } from "@supabase/supabase-js";

function parseSettlementForm(formData: FormData) {
  return settlementSchema.safeParse({
    settlementDate: formData.get("settlementDate"),
    subagentId: formData.get("subagentId"),
    paymentMethod: formData.get("paymentMethod"),
    cashAmount: formData.get("cashAmount"),
    bankAmount: formData.get("bankAmount"),
    salesAmount: formData.get("salesAmount"),
    commissionAmount: formData.get("commissionAmount"),
    prizesPaidAmount: formData.get("prizesPaidAmount"),
    expectedAmount: formData.get("expectedAmount"),
    notes: formData.get("notes"),
  });
}

async function getRpcArgs(
  supabase: SupabaseClient<Database>,
  input: SettlementInput,
) {
  const { data: subagent, error } = await supabase
    .from("subagents")
    .select("commission_percentage")
    .eq("id", input.subagentId)
    .eq("status", "active")
    .maybeSingle();

  if (error || !subagent) {
    throw new Error("SUBAGENT_NOT_AVAILABLE");
  }

  const calculated = calculateSettlementAmounts(
    input.salesAmount ?? null,
    subagent.commission_percentage,
    input.prizesPaidAmount ?? null,
  );

  return {
    p_settlement_date: input.settlementDate,
    p_subagent_id: input.subagentId,
    p_cash_amount: input.cashAmount,
    p_bank_amount: input.bankAmount,
    p_sales_amount: input.salesAmount ?? null,
    p_commission_amount: calculated.commissionAmount,
    p_prizes_paid_amount: input.prizesPaidAmount ?? null,
    p_expected_amount: calculated.expectedAmount,
    p_notes: input.notes ?? null,
  };
}

function getMutationMessage(code?: string, message?: string) {
  if (code === "23505") {
    return "Ya existe una rendición activa para ese Subagente y fecha.";
  }

  if (message?.includes("superar el importe esperado")) {
    return "El importe recibido no puede superar el importe esperado.";
  }

  if (message?.includes("día operativo está cerrado")) {
    return "El día operativo está cerrado. Reabrilo antes de modificar rendiciones.";
  }

  return "No se pudo guardar la rendición. Intentá nuevamente.";
}

export async function createSettlementAction(
  _previousState: SettlementFormState,
  formData: FormData,
): Promise<SettlementFormState> {
  const parsed = parseSettlementForm(formData);

  if (!parsed.success) {
    return {
      status: "error",
      message: "Revisá los campos indicados.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  const { supabase } = await requireOperator();
  let rpcArgs;

  try {
    rpcArgs = await getRpcArgs(supabase, parsed.data);
  } catch {
    return {
      status: "error",
      message: "El Subagente ya no está disponible.",
    };
  }

  const { data: id, error } = await supabase.rpc(
    "create_daily_settlement",
    rpcArgs,
  );

  if (error) {
    return {
      status: "error",
      message: getMutationMessage(error.code, error.message),
    };
  }

  revalidatePath("/dashboard");
  revalidatePath("/rendiciones");
  redirect(`/rendiciones/${id}?created=1`);
}

export async function updateSettlementAction(
  _previousState: SettlementFormState,
  formData: FormData,
): Promise<SettlementFormState> {
  const parsedId = settlementIdSchema.safeParse(formData.get("id"));
  const parsed = parseSettlementForm(formData);

  if (!parsedId.success || !parsed.success) {
    return {
      status: "error",
      message: "Revisá los campos indicados.",
      fieldErrors: parsed.success
        ? undefined
        : parsed.error.flatten().fieldErrors,
    };
  }

  const { supabase } = await requireOperator();
  let rpcArgs;

  try {
    rpcArgs = await getRpcArgs(supabase, parsed.data);
  } catch {
    return {
      status: "error",
      message: "El Subagente ya no está disponible.",
    };
  }

  const { data: id, error } = await supabase.rpc("replace_daily_settlement", {
    p_previous_settlement_id: parsedId.data,
    ...rpcArgs,
  });

  if (error) {
    return {
      status: "error",
      message: getMutationMessage(error.code, error.message),
    };
  }

  revalidatePath("/dashboard");
  revalidatePath("/rendiciones");
  redirect(`/rendiciones/${id}?updated=1`);
}

export async function voidSettlementAction(
  _previousState: SettlementFormState,
  formData: FormData,
): Promise<SettlementFormState> {
  const parsed = voidSettlementSchema.safeParse({
    id: formData.get("id"),
    reason: formData.get("reason"),
  });

  if (!parsed.success) {
    return {
      status: "error",
      message: "Ingresá un motivo válido.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  const { supabase } = await requireOperator();
  const { error } = await supabase.rpc("void_daily_settlement", {
    p_settlement_id: parsed.data.id,
    p_reason: parsed.data.reason,
  });

  if (error) {
    return {
      status: "error",
      message: getMutationMessage(error.code, error.message),
    };
  }

  revalidatePath("/dashboard");
  revalidatePath("/rendiciones");
  revalidatePath(`/rendiciones/${parsed.data.id}`);
  redirect(`/rendiciones/${parsed.data.id}?voided=1`);
}
