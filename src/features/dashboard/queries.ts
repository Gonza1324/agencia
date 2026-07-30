import { cache } from "react";

import { requireOwnerAdmin } from "@/features/auth/guards";
import { getArgentinaDateKey, isWorkingDay } from "@/lib/operational-days";

export const getDailyDashboard = cache(async () => {
  const now = new Date();
  const operationalDate = getArgentinaDateKey(now);
  const workingDay = isWorkingDay(now);
  const { supabase } = await requireOwnerAdmin();

  let businessDay = null;

  if (workingDay) {
    const { data, error } = await supabase.rpc("ensure_current_business_day");

    if (error) {
      throw new Error(`No se pudo abrir el día operativo: ${error.message}`);
    }

    businessDay = data[0] ?? null;

    if (!businessDay) {
      throw new Error("No se pudo obtener el día operativo actual.");
    }
  }

  const [dashboardResult, closureResult] = await Promise.all([
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
  ]);

  if (dashboardResult.error) {
    throw new Error(
      `No se pudo cargar el dashboard: ${dashboardResult.error.message}`,
    );
  }

  if (closureResult.error) {
    throw new Error(`No se pudo cargar el estado del cierre diario.`);
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

  return {
    alertCount,
    businessDay,
    closure: closureResult.data,
    operationalDate,
    pendingToday,
    receivedToday,
    rows,
    settledToday,
    workingDay,
  };
});
