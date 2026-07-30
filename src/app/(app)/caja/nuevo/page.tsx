import Link from "next/link";

import { CashMovementForm } from "@/features/cash/cash-movement-form";
import { getCashPageData } from "@/features/cash/queries";
import { getArgentinaDateKey } from "@/lib/operational-days";

export default async function NewCashMovementPage() {
  const { accounts, categories } = await getCashPageData();

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <Link
          href="/caja"
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          ← Volver a Caja
        </Link>
        <h1 className="mt-2 text-3xl font-semibold">Nuevo movimiento</h1>
      </div>
      <CashMovementForm
        accounts={accounts}
        categories={categories}
        today={getArgentinaDateKey()}
      />
    </div>
  );
}
