import { cache } from "react";

import { requireOperator } from "@/features/auth/guards";

export const getCashPageData = cache(async () => {
  const { supabase } = await requireOperator();
  const [summaryResult, movementsResult, accountsResult, categoriesResult] =
    await Promise.all([
      supabase.rpc("get_cash_summary"),
      supabase
        .from("cash_movements")
        .select(
          "*, account:cash_accounts(id, name, type), category:cash_categories(id, name, type)",
        )
        .order("created_at", { ascending: false })
        .limit(200),
      supabase
        .from("cash_accounts")
        .select("id, name, type")
        .eq("status", "active")
        .order("name"),
      supabase
        .from("cash_categories")
        .select("id, name, type")
        .eq("status", "active")
        .order("type")
        .order("name"),
    ]);

  if (summaryResult.error) {
    throw new Error(
      `No se pudieron calcular los saldos: ${summaryResult.error.message}`,
    );
  }
  if (movementsResult.error) {
    throw new Error(
      `No se pudieron cargar los movimientos: ${movementsResult.error.message}`,
    );
  }
  if (accountsResult.error || categoriesResult.error) {
    throw new Error("No se pudo cargar la configuración de Caja.");
  }

  return {
    accounts: accountsResult.data,
    categories: categoriesResult.data,
    movements: movementsResult.data,
    summary: summaryResult.data[0],
  };
});

export const getCashCategories = cache(async () => {
  const { supabase } = await requireOperator();
  const { data, error } = await supabase
    .from("cash_categories")
    .select("*")
    .order("type")
    .order("name");

  if (error) {
    throw new Error(`No se pudieron cargar las categorías: ${error.message}`);
  }

  return data;
});
