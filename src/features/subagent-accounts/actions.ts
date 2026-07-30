"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireOperator } from "@/features/auth/guards";
import type { SubagentAccountFormState } from "@/features/subagent-accounts/state";
import {
  subagentAccountIdSchema,
  subagentAccountMovementSchema,
} from "@/features/subagent-accounts/validations";

export async function createSubagentAccountMovementAction(
  _previousState: SubagentAccountFormState,
  formData: FormData,
): Promise<SubagentAccountFormState> {
  const parsed = subagentAccountMovementSchema.safeParse({
    businessDate: formData.get("businessDate"),
    subagentId: formData.get("subagentId"),
    type: formData.get("type"),
    amount: formData.get("amount"),
    cashAccountId: formData.get("cashAccountId"),
    notes: formData.get("notes"),
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
    "create_subagent_account_movement",
    {
      p_business_date: parsed.data.businessDate,
      p_subagent_id: parsed.data.subagentId,
      p_type: parsed.data.type,
      p_amount: parsed.data.amount,
      p_cash_account_id: parsed.data.cashAccountId ?? undefined,
      p_notes: parsed.data.notes ?? undefined,
    },
  );

  if (error) {
    return {
      status: "error",
      message: error.message.includes("día operativo está cerrado")
        ? "El día operativo está cerrado. Reabrilo antes de registrar movimientos."
        : error.message.includes("supera la deuda")
          ? "El importe supera la deuda vigente. No se permiten adelantos."
          : "No se pudo registrar el movimiento.",
    };
  }

  revalidateAccountPaths(parsed.data.subagentId);
  redirect(
    `/subagentes/${parsed.data.subagentId}/cuenta-corriente?created=${id}`,
  );
}

export async function voidSubagentAccountMovementAction(formData: FormData) {
  const movementId = subagentAccountIdSchema.safeParse(
    formData.get("movementId"),
  );
  const subagentId = subagentAccountIdSchema.safeParse(
    formData.get("subagentId"),
  );
  const reason = String(formData.get("reason") ?? "").trim();

  if (!movementId.success || !subagentId.success || !reason) {
    redirect(
      `/subagentes/${String(formData.get("subagentId") ?? "")}/cuenta-corriente?voidError=validation`,
    );
  }

  const { supabase } = await requireOperator();
  const { error } = await supabase.rpc("void_subagent_account_movement", {
    p_movement_id: movementId.data,
    p_reason: reason,
  });

  if (error) {
    redirect(
      `/subagentes/${subagentId.data}/cuenta-corriente?voidError=${
        error.message.includes("día operativo está cerrado")
          ? "closed"
          : "operation"
      }`,
    );
  }

  revalidateAccountPaths(subagentId.data);
  redirect(
    `/subagentes/${subagentId.data}/cuenta-corriente?voided=${movementId.data}`,
  );
}

function revalidateAccountPaths(subagentId: string) {
  revalidatePath(`/subagentes/${subagentId}`);
  revalidatePath(`/subagentes/${subagentId}/cuenta-corriente`);
  revalidatePath("/dashboard");
  revalidatePath("/caja");
}
