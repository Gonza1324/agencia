import { cache } from "react";

import { requireOwnerAdmin } from "@/features/auth/guards";
import { getReportRange } from "@/features/reports/date-ranges";
import {
  reportDateSchema,
  reportViewSchema,
} from "@/features/reports/validations";
import { getArgentinaDateKey } from "@/lib/operational-days";

export const getReportsData = cache(
  async (requestedView?: string, requestedDate?: string) => {
    const parsedView = reportViewSchema.safeParse(requestedView);
    const parsedDate = reportDateSchema.safeParse(requestedDate);
    const view = parsedView.success ? parsedView.data : "daily";
    const anchorDate = parsedDate.success
      ? parsedDate.data
      : getArgentinaDateKey();
    const rawRange = getReportRange(view, anchorDate);
    const today = getArgentinaDateKey();
    const range = {
      from: rawRange.from,
      to: rawRange.to > today ? today : rawRange.to,
    };
    const { supabase } = await requireOwnerAdmin();

    if (view === "daily") {
      const [reportResult, closureResult] = await Promise.all([
        supabase.rpc("get_daily_report", {
          p_date: anchorDate,
        }),
        supabase
          .from("cash_closures")
          .select("id, status, business_day:business_days!inner(date)")
          .eq("business_day.date", anchorDate)
          .maybeSingle(),
      ]);

      if (reportResult.error || closureResult.error) {
        throw new Error(
          `No se pudo cargar el reporte diario: ${
            reportResult.error?.message ?? closureResult.error?.message
          }`,
        );
      }

      return {
        anchorDate,
        daily: reportResult.data[0],
        dailyClosure: closureResult.data,
        period: null,
        range,
        ranking: [],
        series: [],
        view,
        withdrawals: [],
      };
    }

    const [periodResult, seriesResult, rankingResult, withdrawalsResult] =
      await Promise.all([
        supabase.rpc("get_period_report", {
          p_from: range.from,
          p_to: range.to,
        }),
        supabase.rpc("get_report_daily_series", {
          p_from: range.from,
          p_to: range.to,
        }),
        supabase.rpc("get_report_subagent_ranking", {
          p_from: range.from,
          p_to: range.to,
        }),
        supabase.rpc("get_report_owner_withdrawals", {
          p_from: range.from,
          p_to: range.to,
        }),
      ]);

    const firstError = [
      periodResult.error,
      seriesResult.error,
      rankingResult.error,
      withdrawalsResult.error,
    ].find(Boolean);

    if (firstError) {
      throw new Error(`No se pudo cargar el reporte: ${firstError.message}`);
    }

    if (!periodResult.data?.[0]) {
      throw new Error("El reporte no devolvió un resumen para el período.");
    }

    return {
      anchorDate,
      daily: null,
      dailyClosure: null,
      period: periodResult.data[0],
      range,
      ranking: rankingResult.data ?? [],
      series: seriesResult.data ?? [],
      view,
      withdrawals: withdrawalsResult.data ?? [],
    };
  },
);
