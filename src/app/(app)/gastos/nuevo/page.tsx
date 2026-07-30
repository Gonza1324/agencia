import Link from "next/link";

import { ExpenseForm } from "@/features/expenses/expense-form";
import { getExpensePageData } from "@/features/expenses/queries";
import { getArgentinaDateKey } from "@/lib/operational-days";

export default async function NewExpensePage() {
  const { categories } = await getExpensePageData();

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <Link
          href="/gastos"
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          ← Volver a Gastos
        </Link>
        <h1 className="mt-2 text-3xl font-semibold">Nueva obligación</h1>
        <p className="mt-2 text-muted-foreground">
          Registrá el vencimiento ahora y descontalo de Caja cuando se pague.
        </p>
      </div>
      <ExpenseForm categories={categories} today={getArgentinaDateKey()} />
    </div>
  );
}
