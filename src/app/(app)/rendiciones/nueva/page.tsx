import Link from "next/link";

import { SettlementForm } from "@/features/settlements/settlement-form";
import { resolveSettlementPrefill } from "@/features/settlements/prefill";
import { getActiveSubagentsForSettlement } from "@/features/settlements/queries";
import { getArgentinaDateKey } from "@/lib/operational-days";

export default async function NewSettlementPage({
  searchParams,
}: {
  searchParams: Promise<{
    date?: string | string[];
    subagent?: string | string[];
  }>;
}) {
  const [subagents, params] = await Promise.all([
    getActiveSubagentsForSettlement(),
    searchParams,
  ]);
  const today = getArgentinaDateKey();
  const prefill = resolveSettlementPrefill(
    params,
    subagents.map((subagent) => subagent.id),
    today,
  );

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
          initialSettlementDate={prefill.settlementDate}
          initialSubagentId={prefill.subagentId}
          mode="create"
          subagents={subagents}
          today={today}
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
