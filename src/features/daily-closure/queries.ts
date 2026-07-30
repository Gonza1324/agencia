import { cache } from "react";

import { requireOwnerAdmin } from "@/features/auth/guards";
import { closureDateSchema } from "@/features/daily-closure/validations";
import { getArgentinaDateKey } from "@/lib/operational-days";

export const getDailyClosureData = cache(async (requestedDate?: string) => {
  const parsedDate = closureDateSchema.safeParse(requestedDate);
  const businessDate = parsedDate.success
    ? parsedDate.data
    : getArgentinaDateKey();
  const { supabase } = await requireOwnerAdmin();
  const [summaryResult, closureResult] = await Promise.all([
    supabase.rpc("get_daily_closure_summary", {
      p_business_date: businessDate,
    }),
    supabase
      .from("cash_closures")
      .select(
        "*, business_day:business_days!inner(id, date, status), closed_by_profile:profiles!cash_closures_closed_by_fkey(full_name), reopened_by_profile:profiles!cash_closures_reopened_by_fkey(full_name)",
      )
      .eq("business_day.date", businessDate)
      .maybeSingle(),
  ]);

  if (summaryResult.error) {
    throw new Error(
      `No se pudo calcular el resumen del cierre: ${summaryResult.error.message}`,
    );
  }

  if (closureResult.error) {
    throw new Error(
      `No se pudo cargar el cierre: ${closureResult.error.message}`,
    );
  }

  return {
    businessDate,
    closure: closureResult.data,
    summary: summaryResult.data[0],
  };
});
