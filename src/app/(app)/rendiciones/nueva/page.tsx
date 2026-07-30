import Link from "next/link";

import { SettlementForm } from "@/features/settlements/settlement-form";
import { getActiveSubagentsForSettlement } from "@/features/settlements/queries";
import { getArgentinaDateKey } from "@/lib/operational-days";

export default async function NewSettlementPage() {
  const subagents = await getActiveSubagentsForSettlement();

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="space-y-2">
        <Link
          href="/rendiciones"
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          ← Volver a rendiciones
        </Link>
        <h1 className="text-3xl font-semibold">Nueva rendición</h1>
        <p className="text-muted-foreground">
          El guardado generará automáticamente los movimientos de caja y la
          deuda conocida.
        </p>
      </div>

      {subagents.length ? (
        <SettlementForm
          mode="create"
          subagents={subagents}
          today={getArgentinaDateKey()}
        />
      ) : (
        <div className="rounded-lg border bg-card p-6">
          <p className="font-medium">No hay Subagentes activos.</p>
          <Link
            href="/subagentes/nuevo"
            className="mt-2 inline-block text-sm text-primary hover:underline"
          >
            Crear un Subagente
          </Link>
        </div>
      )}
    </div>
  );
}
