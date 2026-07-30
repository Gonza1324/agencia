import { cache } from "react";

import { requireOperator } from "@/features/auth/guards";

export const getExpensePageData = cache(async () => {
  const { supabase } = await requireOperator();
  const [obligationsResult, accountsResult, categoriesResult] =
    await Promise.all([
      supabase
        .from("expense_obligations")
        .select(
          "*, category:cash_categories(id, name), paid_account:cash_accounts(id, name)",
        )
        .order("status")
        .order("due_date")
        .limit(300),
      supabase
        .from("cash_accounts")
        .select("id, name, type")
        .eq("status", "active")
        .order("name"),
      supabase
        .from("cash_categories")
        .select("id, name")
        .eq("type", "expense")
        .eq("status", "active")
        .order("name"),
    ]);

  if (
    obligationsResult.error ||
    accountsResult.error ||
    categoriesResult.error
  ) {
    throw new Error("No se pudieron cargar los gastos y obligaciones.");
  }

  return {
    accounts: accountsResult.data,
    categories: categoriesResult.data,
    obligations: obligationsResult.data,
  };
});

export const getExpenseObligationForEdit = cache(async (id: string) => {
  const { supabase } = await requireOperator();
  const { data, error } = await supabase
    .from("expense_obligations")
    .select(
      "id, amount, category_id, description, due_date, notes, recurrence_months, status",
    )
    .eq("id", id)
    .maybeSingle();

  if (error) {
    throw new Error("No se pudo cargar la obligación.");
  }

  return data;
});
