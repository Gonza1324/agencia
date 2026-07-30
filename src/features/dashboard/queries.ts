import { cache } from "react";

import { requireInternalUser } from "@/features/auth/guards";
import {
  addDaysToDateKey,
  calculateExpenseForecast,
} from "@/features/dashboard/expense-forecast";
import { getArgentinaDateKey, isWorkingDay } from "@/lib/operational-days";
import { canOperate } from "@/lib/permissions";
import type { UserRole } from "@/types/domain";

export const getDailyDashboard = cache(async () => {
  const now = new Date();
  const operationalDate = getArgentinaDateKey(now);
  const workingDay = isWorkingDay(now);
  const { profile, supabase } = await requireInternalUser();
  const userCanOperate = canOperate(profile.role as UserRole);
  const expenseHorizonDate = addDaysToDateKey(operationalDate, 7);

  let businessDay = null;

  if (workingDay) {
    const { data, error } = userCanOperate
      ? await supabase.rpc("ensure_current_business_day")
      : await supabase
          .from("business_days")
          .select("*")
          .eq("date", operationalDate)
          .limit(1);

    if (error) {
      throw new Error(`No se pudo abrir el día operativo: ${error.message}`);
    }

    businessDay = data[0] ?? null;

    if (!businessDay && userCanOperate) {
      throw new Error("No se pudo obtener el día operativo actual.");
    }
  }

  const [
    dashboardResult,
    closureResult,
    expensesResult,
    cashSummaryResult,
    dailyReportResult,
  ] = await Promise.all([
    supabase.rpc("get_subagent_dashboard", { p_date: operationalDate }),
    businessDay
      ? supabase
          .from("cash_closures")
          .select(
            "id, status, cash_difference, bank_difference, closed_at, reopened_at",
          )
          .eq("business_day_id", businessDay.id)
          .maybeSingle()
      : Promise.resolve({ data: null, error: null }),
    supabase
      .from("expense_obligations")
      .select("id, description, amount, due_date")
      .eq("status", "pending")
      .lte("due_date", expenseHorizonDate)
      .order("due_date")
      .limit(300),
    supabase.rpc("get_cash_summary"),
    supabase.rpc("get_daily_report", {
      p_date: operationalDate,
    }),
  ]);

  if (dashboardResult.error) {
    throw new Error(
      `No se pudo cargar el dashboard: ${dashboardResult.error.message}`,
    );
  }

  if (closureResult.error) {
    throw new Error(`No se pudo cargar el estado del cierre diario.`);
  }

  if (
    expensesResult.error ||
    cashSummaryResult.error ||
    dailyReportResult.error
  ) {
    throw new Error("No se pudo calcular el resumen financiero diario.");
  }

  const rows = dashboardResult.data;
  const settledToday = rows.filter(
    (row) =>
      row.dashboard_status === "settled" ||
      row.dashboard_status === "settled_with_debt",
  ).length;
  const pendingToday = rows.filter(
    (row) => row.dashboard_status === "pending",
  ).length;
  const alertCount = rows.filter((row) =>
    ["late", "late_serious", "late_critical"].includes(row.dashboard_status),
  ).length;
  const receivedToday = rows.reduce(
    (total, row) => total + Number(row.received_today),
    0,
  );
  const cashSummary = cashSummaryResult.data[0];
  const dailyFinancial = dailyReportResult.data[0];
  const availableCash = Number(cashSummary?.total_balance ?? 0);
  const expenseForecast = calculateExpenseForecast(
    expensesResult.data,
    availableCash,
    operationalDate,
  );

  return {
    alertCount,
    businessDay,
    cashSummary,
    closure: closureResult.data,
    dailyFinancial,
    expenseForecast,
    expenses: expensesResult.data,
    operationalDate,
    pendingToday,
    receivedToday,
    rows,
    settledToday,
    userCanOperate,
    workingDay,
  };
});
