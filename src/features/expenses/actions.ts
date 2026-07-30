"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireOperator } from "@/features/auth/guards";
import type { ExpenseFormState } from "@/features/expenses/state";
import {
  cancelExpenseObligationSchema,
  expenseObligationIdSchema,
  expenseObligationSchema,
  payExpenseSchema,
} from "@/features/expenses/validations";

function parseExpenseForm(formData: FormData) {
  return expenseObligationSchema.safeParse({
    description: formData.get("description"),
    categoryId: formData.get("categoryId"),
    amount: formData.get("amount"),
    dueDate: formData.get("dueDate"),
    recurrenceMonths: formData.get("recurrenceMonths"),
    notes: formData.get("notes"),
  });
}

export async function createExpenseObligationAction(
  _previousState: ExpenseFormState,
  formData: FormData,
): Promise<ExpenseFormState> {
  const parsed = parseExpenseForm(formData);

  if (!parsed.success) {
    return {
      status: "error",
      message: "Revisá los campos indicados.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  const { supabase } = await requireOperator();
  const { data: id, error } = await supabase.rpc("create_expense_obligation", {
    p_description: parsed.data.description,
    p_category_id: parsed.data.categoryId,
    p_amount: parsed.data.amount,
    p_due_date: parsed.data.dueDate,
    p_recurrence_months: parsed.data.recurrenceMonths ?? undefined,
    p_notes: parsed.data.notes ?? undefined,
  });

  if (error) {
    return {
      status: "error",
      message: "No se pudo guardar el gasto. Intentá nuevamente.",
    };
  }

  revalidatePath("/gastos");
  revalidatePath("/dashboard");
  redirect(`/gastos?created=${id}`);
}

export async function updateExpenseObligationAction(
  _previousState: ExpenseFormState,
  formData: FormData,
): Promise<ExpenseFormState> {
  const parsedId = expenseObligationIdSchema.safeParse(
    formData.get("obligationId"),
  );
  const parsed = parseExpenseForm(formData);

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
  const { data: id, error } = await supabase.rpc(
    "update_expense_obligation",
    {
      p_obligation_id: parsedId.data,
      p_description: parsed.data.description,
      p_category_id: parsed.data.categoryId,
      p_amount: parsed.data.amount,
      p_due_date: parsed.data.dueDate,
      p_recurrence_months: parsed.data.recurrenceMonths ?? undefined,
      p_notes: parsed.data.notes ?? undefined,
    },
  );

  if (error) {
    return {
      status: "error",
      message: error.message.includes("pendientes")
        ? "La obligación ya no está pendiente y no se puede modificar."
        : "No se pudo actualizar el gasto. Intentá nuevamente.",
    };
  }

  revalidatePath("/gastos");
  revalidatePath("/dashboard");
  redirect(`/gastos?updated=${id}`);
}

export async function cancelExpenseObligationAction(
  _previousState: ExpenseFormState,
  formData: FormData,
): Promise<ExpenseFormState> {
  const parsed = cancelExpenseObligationSchema.safeParse({
    obligationId: formData.get("obligationId"),
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
  const { data: id, error } = await supabase.rpc(
    "cancel_expense_obligation",
    {
      p_obligation_id: parsed.data.obligationId,
      p_reason: parsed.data.reason,
    },
  );

  if (error) {
    return {
      status: "error",
      message: error.message.includes("pendientes")
        ? "La obligación ya no está pendiente."
        : "No se pudo cancelar la obligación. Intentá nuevamente.",
    };
  }

  revalidatePath("/gastos");
  revalidatePath("/dashboard");
  redirect(`/gastos?cancelled=${id}`);
}

export async function payExpenseObligationAction(formData: FormData) {
  const parsed = payExpenseSchema.safeParse({
    obligationId: formData.get("obligationId"),
    businessDate: formData.get("businessDate"),
    cashAccountId: formData.get("cashAccountId"),
  });

  if (!parsed.success) {
    redirect("/gastos?error=validation");
  }

  const { supabase } = await requireOperator();
  const { error } = await supabase.rpc("pay_expense_obligation", {
    p_obligation_id: parsed.data.obligationId,
    p_business_date: parsed.data.businessDate,
    p_cash_account_id: parsed.data.cashAccountId,
  });

  if (error) {
    const code = error.message.includes("saldo")
      ? "balance"
      : error.message.includes("cerrado")
        ? "closed"
        : "save";
    redirect(`/gastos?error=${code}`);
  }

  revalidatePath("/gastos");
  revalidatePath("/caja");
  revalidatePath("/dashboard");
  redirect(`/gastos?paid=${parsed.data.obligationId}`);
}
