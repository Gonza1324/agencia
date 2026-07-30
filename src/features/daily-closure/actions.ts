"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireOwnerAdmin } from "@/features/auth/guards";
import type { DailyClosureFormState } from "@/features/daily-closure/state";
import {
  dailyClosureSchema,
  reopenBusinessDaySchema,
} from "@/features/daily-closure/validations";

export async function closeBusinessDayAction(
  _previousState: DailyClosureFormState,
  formData: FormData,
): Promise<DailyClosureFormState> {
  const parsed = dailyClosureSchema.safeParse({
    businessDate: formData.get("businessDate"),
    countedCashAmount: formData.get("countedCashAmount"),
    reportedBankAmount: formData.get("reportedBankAmount"),
    note: formData.get("note"),
  });

  if (!parsed.success) {
    return {
      status: "error",
      message: "Revisá los campos indicados.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  const { supabase } = await requireOwnerAdmin();
  const { data: id, error } = await supabase.rpc("close_business_day", {
    p_business_date: parsed.data.businessDate,
    p_counted_cash_amount: parsed.data.countedCashAmount,
    p_reported_bank_amount: parsed.data.reportedBankAmount,
    p_note: parsed.data.note ?? null,
  });

  if (error) {
    return {
      status: "error",
      message: error.message.includes("diferencias")
        ? "Explicá el motivo de las diferencias para cerrar el día."
        : error.message.includes("ya está cerrado")
          ? "El día operativo ya está cerrado."
          : "No se pudo cerrar el día.",
    };
  }

  revalidateClosurePaths();
  redirect(`/cierre-diario?date=${parsed.data.businessDate}&closed=${id}`);
}

export async function reopenBusinessDayAction(
  _previousState: DailyClosureFormState,
  formData: FormData,
): Promise<DailyClosureFormState> {
  const parsed = reopenBusinessDaySchema.safeParse({
    businessDate: formData.get("businessDate"),
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
  const { data: id, error } = await supabase.rpc("reopen_business_day", {
    p_business_date: parsed.data.businessDate,
    p_reason: parsed.data.reason,
  });

  if (error) {
    return {
      status: "error",
      message: "No se pudo reabrir el día.",
    };
  }

  revalidateClosurePaths();
  redirect(`/cierre-diario?date=${parsed.data.businessDate}&reopened=${id}`);
}

function revalidateClosurePaths() {
  revalidatePath("/cierre-diario");
  revalidatePath("/dashboard");
  revalidatePath("/caja");
  revalidatePath("/rendiciones");
}
