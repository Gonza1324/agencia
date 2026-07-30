import { cache } from "react";

import { requireSubagentUser } from "@/features/auth/guards";

export const getMySubagentAccounts = cache(async () => {
  const { supabase, user } = await requireSubagentUser();
  const { data: links, error: linksError } = await supabase
    .from("subagent_user_links")
    .select(
      "subagent_id, subagent:subagents(id, name, machine_code, commission_percentage, status)",
    )
    .eq("user_id", user.id)
    .eq("status", "active")
    .order("created_at");

  if (linksError) {
    throw new Error("No se pudieron cargar las máquinas asignadas.");
  }

  const subagentIds = links.map((link) => link.subagent_id);

  if (!subagentIds.length) {
    return [];
  }

  const [settlementsResult, movementsResult, summaries] = await Promise.all([
    supabase
      .from("daily_settlements")
      .select(
        "id, subagent_id, settlement_date, status, sales_amount, commission_amount, prizes_paid_amount, expected_amount, received_amount, debt_amount, notes, payments:settlement_payments(method, amount, voided_at)",
      )
      .in("subagent_id", subagentIds)
      .order("settlement_date", { ascending: false })
      .limit(200),
    supabase
      .from("subagent_account_movements")
      .select(
        "id, subagent_id, type, direction, amount, notes, created_at, voided_at, business_day:business_days(date), settlement:daily_settlements(id, settlement_date)",
      )
      .in("subagent_id", subagentIds)
      .order("created_at", { ascending: false })
      .limit(300),
    Promise.all(
      subagentIds.map(async (subagentId) => {
        const { data, error } = await supabase.rpc(
          "get_subagent_account_summary",
          {
            p_subagent_id: subagentId,
          },
        );

        if (error) {
          throw new Error("No se pudo calcular un saldo de cuenta corriente.");
        }

        return {
          subagentId,
          summary: data[0],
        };
      }),
    ),
  ]);

  if (settlementsResult.error || movementsResult.error) {
    throw new Error("No se pudo cargar el historial de la cuenta corriente.");
  }

  return links.map((link) => ({
    subagent: link.subagent,
    summary:
      summaries.find((item) => item.subagentId === link.subagent_id)?.summary ??
      null,
    settlements: settlementsResult.data.filter(
      (settlement) => settlement.subagent_id === link.subagent_id,
    ),
    movements: movementsResult.data.filter(
      (movement) => movement.subagent_id === link.subagent_id,
    ),
  }));
});
