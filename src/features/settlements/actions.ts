"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireOwnerAdmin } from "@/features/auth/guards";
import type { SettlementFormState } from "@/features/settlements/state";
import {
  settlementIdSchema,
  settlementSchema,
  type SettlementInput,
  voidSettlementSchema,
} from "@/features/settlements/validations";

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

function getRpcArgs(input: SettlementInput) {
  return {
    p_settlement_date: input.settlementDate,
    p_subagent_id: input.subagentId,
    p_cash_amount: input.cashAmount,
    p_bank_amount: input.bankAmount,
    p_sales_amount: input.salesAmount ?? null,
    p_commission_amount: input.commissionAmount ?? null,
    p_prizes_paid_amount: input.prizesPaidAmount ?? null,
    p_expected_amount: input.expectedAmount ?? null,
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

  const { supabase } = await requireOwnerAdmin();
  const { data: id, error } = await supabase.rpc(
    "create_daily_settlement",
    getRpcArgs(parsed.data),
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

  const { supabase } = await requireOwnerAdmin();
  const { data: id, error } = await supabase.rpc("replace_daily_settlement", {
    p_previous_settlement_id: parsedId.data,
    ...getRpcArgs(parsed.data),
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

  const { supabase } = await requireOwnerAdmin();
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
