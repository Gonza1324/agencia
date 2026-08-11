"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import {
  requireOperator,
  requireOwnerAdmin,
} from "@/features/auth/guards";
import type { MaquinolaFormState } from "@/features/maquinolas/state";
import {
  maquinolaIdSchema,
  maquinolaSchema,
  maquinolaSettlementSchema,
  voidMaquinolaSettlementSchema,
} from "@/features/maquinolas/validations";

function parseEntity(formData: FormData) {
  return maquinolaSchema.safeParse({
    number: formData.get("number"),
    subagentId: formData.get("subagentId"),
  });
}

function parseSettlement(formData: FormData) {
  return maquinolaSettlementSchema.safeParse({
    settlementDate: formData.get("settlementDate"),
    maquinolaId: formData.get("maquinolaId"),
    paymentMethod: formData.get("paymentMethod"),
    cashAmount: formData.get("cashAmount"),
    bankAmount: formData.get("bankAmount"),
    salesAmount: formData.get("salesAmount"),
    prizesPaidAmount: formData.get("prizesPaidAmount"),
    confirmOverpayment: formData.get("confirmOverpayment"),
    notes: formData.get("notes"),
  });
}

function mutationError(code?: string, message?: string) {
  if (code === "23505") return "Ya existe ese número o un cierre para esa fecha.";
  if (message?.includes("inactiva")) return message;
  return "No se pudo guardar. Intentá nuevamente.";
}

function revalidateMaquinolas() {
  revalidatePath("/dashboard");
  revalidatePath("/maquinolas");
  revalidatePath("/mi-cuenta");
  revalidatePath("/caja");
}

export async function createMaquinolaAction(
  _state: MaquinolaFormState,
  formData: FormData,
): Promise<MaquinolaFormState> {
  const parsed = parseEntity(formData);
  if (!parsed.success) return { status: "error", message: "Revisá los campos.", fieldErrors: parsed.error.flatten().fieldErrors };
  const { supabase, user } = await requireOperator();
  const { data, error } = await supabase
    .from("maquinolas")
    .insert({ number: parsed.data.number, subagent_id: parsed.data.subagentId, created_by: user.id, updated_by: user.id })
    .select("id")
    .single();
  if (error) return { status: "error", message: mutationError(error.code, error.message) };
  revalidateMaquinolas();
  redirect(`/maquinolas/${data.id}?created=1`);
}

export async function updateMaquinolaAction(
  _state: MaquinolaFormState,
  formData: FormData,
): Promise<MaquinolaFormState> {
  const id = maquinolaIdSchema.safeParse(formData.get("id"));
  const parsed = parseEntity(formData);
  if (!id.success || !parsed.success) return { status: "error", message: "Revisá los campos.", fieldErrors: parsed.success ? undefined : parsed.error.flatten().fieldErrors };
  const { supabase, user } = await requireOperator();
  const { data, error } = await supabase
    .from("maquinolas")
    .update({ number: parsed.data.number, subagent_id: parsed.data.subagentId, updated_by: user.id })
    .eq("id", id.data)
    .select("id")
    .maybeSingle();
  if (error || !data) return { status: "error", message: mutationError(error?.code, error?.message) };
  revalidateMaquinolas();
  redirect(`/maquinolas/${data.id}?updated=1`);
}

export async function toggleMaquinolaStatusAction(formData: FormData) {
  const id = maquinolaIdSchema.parse(formData.get("id"));
  const { supabase, user } = await requireOperator();
  const { data: current } = await supabase.from("maquinolas").select("status").eq("id", id).maybeSingle();
  if (!current) redirect("/maquinolas?error=not-found");
  const next = current.status === "active" ? "inactive" : "active";
  const { error } = await supabase.from("maquinolas").update({ status: next, updated_by: user.id }).eq("id", id);
  if (error) redirect(`/maquinolas/${id}?statusError=1`);
  revalidateMaquinolas();
  redirect(`/maquinolas/${id}?status=${next}`);
}

export async function createMaquinolaSettlementAction(
  _state: MaquinolaFormState,
  formData: FormData,
): Promise<MaquinolaFormState> {
  const parsed = parseSettlement(formData);
  if (!parsed.success) return { status: "error", message: "Revisá los campos.", fieldErrors: parsed.error.flatten().fieldErrors };
  const { supabase } = await requireOperator();
  const { data, error } = await supabase.rpc("create_maquinola_settlement", {
    p_settlement_date: parsed.data.settlementDate,
    p_maquinola_id: parsed.data.maquinolaId,
    p_cash_amount: parsed.data.cashAmount,
    p_bank_amount: parsed.data.bankAmount,
    p_sales_amount: parsed.data.salesAmount,
    p_prizes_paid_amount: parsed.data.prizesPaidAmount,
    p_notes: parsed.data.notes,
  });
  if (error) return { status: "error", message: mutationError(error.code, error.message) };
  revalidateMaquinolas();
  redirect(`/maquinolas/cierres/${data}?created=1`);
}

export async function updateMaquinolaSettlementAction(
  _state: MaquinolaFormState,
  formData: FormData,
): Promise<MaquinolaFormState> {
  const id = maquinolaIdSchema.safeParse(formData.get("id"));
  const parsed = parseSettlement(formData);
  if (!id.success || !parsed.success) return { status: "error", message: "Revisá los campos.", fieldErrors: parsed.success ? undefined : parsed.error.flatten().fieldErrors };
  const { supabase } = await requireOwnerAdmin();
  const { data, error } = await supabase.rpc("replace_maquinola_settlement", {
    p_previous_settlement_id: id.data,
    p_settlement_date: parsed.data.settlementDate,
    p_maquinola_id: parsed.data.maquinolaId,
    p_cash_amount: parsed.data.cashAmount,
    p_bank_amount: parsed.data.bankAmount,
    p_sales_amount: parsed.data.salesAmount,
    p_prizes_paid_amount: parsed.data.prizesPaidAmount,
    p_notes: parsed.data.notes,
  });
  if (error) return { status: "error", message: mutationError(error.code, error.message) };
  revalidateMaquinolas();
  redirect(`/maquinolas/cierres/${data}?updated=1`);
}

export async function voidMaquinolaSettlementAction(
  _state: MaquinolaFormState,
  formData: FormData,
): Promise<MaquinolaFormState> {
  const parsed = voidMaquinolaSettlementSchema.safeParse({ id: formData.get("id"), reason: formData.get("reason") });
  if (!parsed.success) return { status: "error", message: "Ingresá un motivo válido.", fieldErrors: parsed.error.flatten().fieldErrors };
  const { supabase } = await requireOwnerAdmin();
  const { error } = await supabase.rpc("void_maquinola_settlement", { p_settlement_id: parsed.data.id, p_reason: parsed.data.reason });
  if (error) return { status: "error", message: mutationError(error.code, error.message) };
  revalidateMaquinolas();
  redirect(`/maquinolas/cierres/${parsed.data.id}?voided=1`);
}
