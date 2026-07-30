import { cache } from "react";

import { requireOperator } from "@/features/auth/guards";
import { subagentAccountIdSchema } from "@/features/subagent-accounts/validations";

export const getSubagentAccountSummary = cache(async (subagentId: string) => {
  const parsedId = subagentAccountIdSchema.safeParse(subagentId);

  if (!parsedId.success) {
    return null;
  }

  const { supabase } = await requireOperator();
  const { data, error } = await supabase.rpc("get_subagent_account_summary", {
    p_subagent_id: parsedId.data,
  });

  if (error) {
    throw new Error(`No se pudo calcular el saldo: ${error.message}`);
  }

  return data[0];
});

export const getSubagentAccountPageData = cache(async (subagentId: string) => {
  const parsedId = subagentAccountIdSchema.safeParse(subagentId);

  if (!parsedId.success) {
    return null;
  }

  const { supabase } = await requireOperator();
  const [subagentResult, summaryResult, movementsResult, accountsResult] =
    await Promise.all([
      supabase
        .from("subagents")
        .select("id, name, machine_code, status")
        .eq("id", parsedId.data)
        .maybeSingle(),
      supabase.rpc("get_subagent_account_summary", {
        p_subagent_id: parsedId.data,
      }),
      supabase
        .from("subagent_account_movements")
        .select(
          "*, business_day:business_days(date), settlement:daily_settlements(id, settlement_date, status)",
        )
        .eq("subagent_id", parsedId.data)
        .order("created_at", { ascending: false })
        .limit(200),
      supabase
        .from("cash_accounts")
        .select("id, name, type")
        .eq("status", "active")
        .order("name"),
    ]);

  if (subagentResult.error) {
    throw new Error(
      `No se pudo cargar el Subagente: ${subagentResult.error.message}`,
    );
  }

  if (!subagentResult.data) {
    return null;
  }

  if (summaryResult.error || movementsResult.error || accountsResult.error) {
    throw new Error("No se pudo cargar la cuenta corriente del Subagente.");
  }

  return {
    subagent: subagentResult.data,
    summary: summaryResult.data[0],
    movements: movementsResult.data,
    accounts: accountsResult.data,
  };
});
