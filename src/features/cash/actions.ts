"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import {
  requireOperator,
  requireOwnerAdmin,
} from "@/features/auth/guards";
import type { CashFormState } from "@/features/cash/state";
import {
  cashCategorySchema,
  cashMovementSchema,
} from "@/features/cash/validations";

export async function createCashMovementAction(
  _previousState: CashFormState,
  formData: FormData,
): Promise<CashFormState> {
  const parsed = cashMovementSchema.safeParse({
    businessDate: formData.get("businessDate"),
    type: formData.get("type"),
    direction: formData.get("direction"),
    accountId: formData.get("accountId"),
    categoryId: formData.get("categoryId"),
    amount: formData.get("amount"),
    ownerName: formData.get("ownerName"),
    description: formData.get("description"),
    note: formData.get("note"),
  });

  if (!parsed.success) {
    return {
      status: "error",
      message: "Revisá los campos indicados.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  const { supabase } = await requireOperator();
  const { data: id, error } = await supabase.rpc(
    "create_manual_cash_movement",
    {
      p_business_date: parsed.data.businessDate,
      p_type: parsed.data.type,
      p_cash_account_id: parsed.data.accountId,
      p_category_id: parsed.data.categoryId ?? null,
      p_amount: parsed.data.amount,
      p_direction: parsed.data.direction,
      p_owner_name: parsed.data.ownerName ?? null,
      p_description: parsed.data.description ?? null,
      p_note: parsed.data.note ?? null,
    },
  );

  if (error) {
    return {
      status: "error",
      message: error.message.includes("día operativo está cerrado")
        ? "El día operativo está cerrado. Reabrilo antes de registrar movimientos."
        : error.message.includes("saldo")
          ? "El saldo de la cuenta es insuficiente."
          : "No se pudo registrar el movimiento.",
    };
  }

  revalidatePath("/caja");
  revalidatePath("/dashboard");
  redirect(`/caja?created=${id}`);
}

export async function saveCashCategoryAction(formData: FormData) {
  const parsed = cashCategorySchema.safeParse({
    id: formData.get("id") || undefined,
    name: formData.get("name"),
    type: formData.get("type"),
  });

  if (!parsed.success) {
    redirect("/configuracion/categorias-caja?error=validation");
  }

  const { supabase } = await requireOwnerAdmin();
  const operation = parsed.data.id
    ? supabase
        .from("cash_categories")
        .update({ name: parsed.data.name, type: parsed.data.type })
        .eq("id", parsed.data.id)
        .eq("is_system", false)
    : supabase.from("cash_categories").insert({
        name: parsed.data.name,
        type: parsed.data.type,
        is_system: false,
      });
  const { error } = await operation;

  if (error) {
    redirect("/configuracion/categorias-caja?error=save");
  }

  revalidatePath("/caja");
  revalidatePath("/configuracion/categorias-caja");
  redirect("/configuracion/categorias-caja?saved=1");
}

export async function toggleCashCategoryAction(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  const { supabase } = await requireOwnerAdmin();
  const { data: category } = await supabase
    .from("cash_categories")
    .select("status, is_system")
    .eq("id", id)
    .maybeSingle();

  if (!category || category.is_system) {
    redirect("/configuracion/categorias-caja?error=protected");
  }

  await supabase
    .from("cash_categories")
    .update({ status: category.status === "active" ? "inactive" : "active" })
    .eq("id", id);

  revalidatePath("/caja");
  revalidatePath("/configuracion/categorias-caja");
  redirect("/configuracion/categorias-caja?saved=1");
}
