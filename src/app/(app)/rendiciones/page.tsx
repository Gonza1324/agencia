import Link from "next/link";
import { Plus, ReceiptText } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { getSettlements } from "@/features/settlements/queries";
import { formatDateKey, formatMoney } from "@/lib/formatters";
import { cn } from "@/lib/utils";

type SettlementsPageProps = {
  searchParams: Promise<{ q?: string; status?: string }>;
};

const statusLabels: Record<string, string> = {
  settled: "Rendida",
  settled_with_debt: "Rendida con deuda",
  voided: "Anulada",
};

export default async function SettlementsPage({
  searchParams,
}: SettlementsPageProps) {
  const params = await searchParams;
  const settlements = await getSettlements();
  const search = params.q?.trim().toLocaleLowerCase("es-AR") ?? "";
  const status = ["settled", "settled_with_debt", "voided"].includes(
    params.status ?? "",
  )
    ? params.status
    : "active";
  const filtered = settlements.filter((settlement) => {
    const matchesStatus =
      status === "all" ||
      (status === "active"
        ? settlement.status !== "voided"
        : settlement.status === status);
    const matchesSearch =
      !search ||
      settlement.subagent.name.toLocaleLowerCase("es-AR").includes(search) ||
      settlement.subagent.machine_code
        .toLocaleLowerCase("es-AR")
        .includes(search);

    return matchesStatus && matchesSearch;
  });
  const activeSettlements = settlements.filter(
    (settlement) => settlement.status !== "voided",
  );
  const totalReceived = activeSettlements.reduce(
    (total, settlement) => total + Number(settlement.received_amount),
    0,
  );
  const totalDebt = activeSettlements.reduce(
    (total, settlement) => total + Number(settlement.debt_amount),
    0,
  );

  return (
    <div className="space-y-6">
      <header className="flex flex-col justify-between gap-4 border-b pb-5 md:flex-row md:items-end">
        <div>
          <p className="text-sm font-medium text-primary">Operación diaria</p>
          <h1 className="mt-1 text-2xl font-semibold">Rendiciones</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Ingresos diarios de Subagentes, medios de pago y deuda conocida.
          </p>
        </div>
        <Link
          href="/rendiciones/nueva"
          className={cn(buttonVariants(), "self-start md:self-auto")}
        >
          <Plus className="h-4 w-4" aria-hidden="true" />
          Nueva rendición
        </Link>
      </header>

      <section className="grid gap-4 md:grid-cols-3">
        <Summary label="Rendiciones activas" value={activeSettlements.length} />
        <Summary label="Total ingresado" value={formatMoney(totalReceived)} />
        <Summary label="Deuda generada" value={formatMoney(totalDebt)} />
      </section>

      <section className="rounded-lg border bg-card">
        <form className="flex flex-col gap-3 border-b p-4 md:flex-row">
          <input
            className="h-10 flex-1 rounded-md border bg-background px-3 text-sm"
            type="search"
            name="q"
            defaultValue={params.q}
            placeholder="Buscar Subagente o máquina"
            aria-label="Buscar rendiciones"
          />
          <select
            className="h-10 rounded-md border bg-background px-3 text-sm md:w-48"
            name="status"
            defaultValue={status}
            aria-label="Filtrar estado"
          >
            <option value="active">Activas</option>
            <option value="settled">Rendidas</option>
            <option value="settled_with_debt">Con deuda</option>
            <option value="voided">Anuladas</option>
            <option value="all">Todas</option>
          </select>
          <button className={buttonVariants({ variant: "secondary" })}>
            Filtrar
          </button>
        </form>

        {filtered.length ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[850px] text-sm">
              <thead className="bg-muted text-left text-muted-foreground">
                <tr>
                  <th className="px-5 py-3 font-medium">Fecha</th>
                  <th className="px-5 py-3 font-medium">Subagente</th>
                  <th className="px-5 py-3 font-medium">Máquina</th>
                  <th className="px-5 py-3 font-medium">Estado</th>
                  <th className="px-5 py-3 font-medium">Recibido</th>
                  <th className="px-5 py-3 font-medium">Deuda</th>
                  <th className="px-5 py-3 text-right font-medium">Acción</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((settlement) => (
                  <tr key={settlement.id} className="border-t">
                    <td className="px-5 py-4">
                      {formatDateKey(settlement.settlement_date)}
                    </td>
                    <td className="px-5 py-4 font-medium">
                      {settlement.subagent.name}
                    </td>
                    <td className="px-5 py-4 font-mono">
                      {settlement.subagent.machine_code}
                    </td>
                    <td className="px-5 py-4">
                      <Badge
                        variant={
                          settlement.status === "settled"
                            ? "success"
                            : settlement.status === "voided"
                              ? "muted"
                              : "warning"
                        }
                      >
                        {statusLabels[settlement.status] ?? settlement.status}
                      </Badge>
                    </td>
                    <td className="px-5 py-4">
                      {formatMoney(Number(settlement.received_amount))}
                    </td>
                    <td className="px-5 py-4">
                      {formatMoney(Number(settlement.debt_amount))}
                    </td>
                    <td className="px-5 py-4 text-right">
                      <Link
                        href={`/rendiciones/${settlement.id}`}
                        className="font-medium text-primary hover:underline"
                      >
                        Ver detalle
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="px-6 py-14 text-center">
            <ReceiptText
              className="mx-auto h-9 w-9 text-muted-foreground"
              aria-hidden="true"
            />
            <h2 className="mt-3 font-semibold">No hay rendiciones</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Registrá la primera cuando un Subagente entregue su cierre.
            </p>
          </div>
        )}
      </section>
    </div>
  );
}

function Summary({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="rounded-lg border bg-card p-5">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="mt-1 text-2xl font-semibold">{value}</p>
    </div>
  );
}
