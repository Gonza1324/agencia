import { cache } from "react";

import { requireSubagentUser } from "@/features/auth/guards";
import {
  buildHistoricalOverdueAlerts,
  DEFAULT_OVERDUE_LOOKBACK_DAYS,
  getOverdueLookbackStart,
} from "@/features/dashboard/overdue-alerts";
import { getArgentinaDateKey } from "@/lib/operational-days";

export const getMySubagentAccounts = cache(async () => {
  const { supabase, user } = await requireSubagentUser();
  const [linksResult, alertPreferencesResult] = await Promise.all([
    supabase
      .from("subagent_user_links")
      .select(
        "subagent_id, subagent:subagents(id, name, machine_code, commission_percentage, status, maquinola_overdue_alerts_enabled, maquinola_overdue_min_days)",
      )
      .eq("user_id", user.id)
      .eq("status", "active")
      .order("created_at"),
    supabase
      .from("user_alert_preferences")
      .select("overdue_alerts_enabled, overdue_min_days, overdue_lookback_days")
      .eq("user_id", user.id)
      .maybeSingle(),
  ]);

  if (linksResult.error || alertPreferencesResult.error) {
    throw new Error("No se pudieron cargar las máquinas asignadas.");
  }

  const links = linksResult.data;
  const alertPreferences = alertPreferencesResult.data ?? {
    overdue_alerts_enabled: true,
    overdue_lookback_days: DEFAULT_OVERDUE_LOOKBACK_DAYS,
    overdue_min_days: 1,
  };
  const operationalDate = getArgentinaDateKey();

  const subagentIds = links.map((link) => link.subagent_id);

  if (!subagentIds.length) {
    return {
      accounts: [],
      alertPreferences,
      alerts: [],
      maquinolaAlerts: [],
    };
  }

  const [
    settlementsResult,
    movementsResult,
    summaries,
    dashboardResult,
    maquinolasResult,
    maquinolaSettlementsResult,
    maquinolaDashboardResult,
    gapSummaryResult,
  ] = await Promise.all([
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
    supabase.rpc("get_subagent_dashboard", {
      p_date: operationalDate,
    }),
    supabase
      .from("maquinolas")
      .select("id, number, subagent_id, status, assigned_at")
      .in("subagent_id", subagentIds)
      .order("number"),
    supabase
      .from("maquinola_settlements")
      .select(
        "id, maquinola_id, subagent_id, settlement_date, status, sales_amount, prizes_paid_amount, expected_amount, received_amount, debt_amount, prize_credit_amount, overpayment_credit_amount, notes, payments:maquinola_settlement_payments(method, amount, voided_at)",
      )
      .in("subagent_id", subagentIds)
      .order("settlement_date", { ascending: false })
      .limit(300),
    supabase.rpc("get_maquinola_dashboard", {
      p_date: operationalDate,
    }),
    supabase.rpc("get_settlement_gap_summary", {
      p_from: getOverdueLookbackStart(
        operationalDate,
        alertPreferences.overdue_lookback_days,
      ),
      p_to: operationalDate,
    }),
  ]);

  if (
    settlementsResult.error ||
    movementsResult.error ||
    dashboardResult.error ||
    maquinolasResult.error ||
    maquinolaSettlementsResult.error ||
    maquinolaDashboardResult.error ||
    gapSummaryResult.error
  ) {
    throw new Error("No se pudo cargar el historial de la cuenta corriente.");
  }

  return {
    accounts: links.map((link) => ({
      subagent: link.subagent,
      summary:
        summaries.find((item) => item.subagentId === link.subagent_id)
          ?.summary ?? null,
      settlements: settlementsResult.data.filter(
        (settlement) => settlement.subagent_id === link.subagent_id,
      ),
      movements: movementsResult.data.filter(
        (movement) => movement.subagent_id === link.subagent_id,
      ),
      maquinolas: maquinolasResult.data
        .filter((unit) => unit.subagent_id === link.subagent_id)
        .map((unit) => ({
          ...unit,
          settlements: maquinolaSettlementsResult.data.filter(
            (settlement) => settlement.maquinola_id === unit.id,
          ),
        })),
    })),
    alertPreferences,
    alerts: alertPreferences.overdue_alerts_enabled
      ? buildHistoricalOverdueAlerts(
          dashboardResult.data,
          gapSummaryResult.data,
          alertPreferences,
          operationalDate,
        )
      : [],
    maquinolaAlerts: maquinolaDashboardResult.data.filter(
      (row) =>
        row.overdue_alerts_enabled &&
        row.delay_days >= row.overdue_min_days &&
        ["late", "late_serious", "late_critical"].includes(
          row.dashboard_status,
        ),
    ),
  };
});
