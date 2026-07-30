import Link from "next/link";
import { notFound } from "next/navigation";

import { ExpenseForm } from "@/features/expenses/expense-form";
import {
  getExpenseObligationForEdit,
  getExpensePageData,
} from "@/features/expenses/queries";
import { getArgentinaDateKey } from "@/lib/operational-days";

type EditExpensePageProps = {
  params: Promise<{ id: string }>;
};

export default async function EditExpensePage({
  params,
}: EditExpensePageProps) {
  const { id } = await params;
  const [obligation, pageData] = await Promise.all([
    getExpenseObligationForEdit(id),
    getExpensePageData(),
  ]);

  if (!obligation || obligation.status !== "pending") {
    notFound();
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <Link
          href="/gastos"
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          ← Volver a Gastos
        </Link>
        <h1 className="mt-2 text-3xl font-semibold">Editar obligación</h1>
        <p className="mt-2 text-muted-foreground">
          Corregí los datos antes de registrar el pago.
        </p>
      </div>
      <ExpenseForm
        categories={pageData.categories}
        obligation={obligation}
        today={getArgentinaDateKey()}
      />
    </div>
  );
}
