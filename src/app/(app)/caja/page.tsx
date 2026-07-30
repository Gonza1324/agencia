import Link from "next/link";
import { ArrowDown, ArrowUp, Landmark, Plus, Wallet } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { MetricCard } from "@/components/ui/metric-card";
import { getCashPageData } from "@/features/cash/queries";
import { formatDateTime, formatMoney } from "@/lib/formatters";
import { cn } from "@/lib/utils";

const typeLabels: Record<string, string> = {
  income: "Ingreso",
  expense: "Egreso",
  withdrawal: "Retiro",
  adjustment: "Ajuste",
  transfer: "Transferencia",
};

export default async function CashPage() {
  const { movements, summary } = await getCashPageData();

  return (
    <div className="space-y-6">
      <header className="flex flex-col justify-between gap-4 border-b pb-5 md:flex-row md:items-end">
        <div>
          <p className="text-sm font-medium text-primary">Control financiero</p>
          <h1 className="mt-1 text-2xl font-semibold">Caja</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Saldos derivados del historial de movimientos activos.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href="/configuracion/categorias-caja"
            className={cn(buttonVariants({ variant: "secondary" }))}
          >
            Categorías
          </Link>
          <Link href="/caja/nuevo" className={cn(buttonVariants())}>
            <Plus className="h-4 w-4" aria-hidden="true" />
            Nuevo movimiento
          </Link>
        </div>
      </header>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          icon={Wallet}
          label="Efectivo"
          value={formatMoney(Number(summary?.cash_balance ?? 0))}
          helper="Caja física disponible"
        />
        <MetricCard
          icon={Landmark}
          label="Banco"
          value={formatMoney(Number(summary?.bank_balance ?? 0))}
          helper="Saldo bancario registrado"
        />
        <MetricCard
          icon={Wallet}
          label="Total disponible"
          value={formatMoney(Number(summary?.total_balance ?? 0))}
          helper="Efectivo más banco"
        />
        <MetricCard
          icon={ArrowUp}
          label="Ganancia operativa"
          value={formatMoney(Number(summary?.operating_profit ?? 0))}
          helper="Ingresos menos egresos"
        />
      </section>

      <section className="rounded-lg border bg-card">
        <div className="border-b px-5 py-4">
          <h2 className="font-semibold">Movimientos recientes</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Rendiciones y operaciones manuales de todas las cuentas.
          </p>
        </div>
        {movements.length ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] text-sm">
              <thead className="bg-muted text-left text-muted-foreground">
                <tr>
                  <th className="px-5 py-3 font-medium">Fecha</th>
                  <th className="px-5 py-3 font-medium">Cuenta</th>
                  <th className="px-5 py-3 font-medium">Tipo</th>
                  <th className="px-5 py-3 font-medium">Categoría</th>
                  <th className="px-5 py-3 font-medium">Descripción</th>
                  <th className="px-5 py-3 text-right font-medium">Importe</th>
                </tr>
              </thead>
              <tbody>
                {movements.map((movement) => (
                  <tr
                    key={movement.id}
                    className={cn(
                      "border-t",
                      movement.voided_at && "opacity-50",
                    )}
                  >
                    <td className="px-5 py-4">
                      {formatDateTime(movement.created_at)}
                    </td>
                    <td className="px-5 py-4">{movement.account.name}</td>
                    <td className="px-5 py-4">
                      <Badge
                        variant={
                          movement.voided_at
                            ? "muted"
                            : movement.direction === "in"
                              ? "success"
                              : "danger"
                        }
                      >
                        {movement.voided_at
                          ? "Anulado"
                          : typeLabels[movement.type]}
                      </Badge>
                    </td>
                    <td className="px-5 py-4">
                      {movement.category?.name ?? "—"}
                    </td>
                    <td className="px-5 py-4">
                      {movement.description ?? movement.owner_name ?? "—"}
                    </td>
                    <td
                      className={cn(
                        "px-5 py-4 text-right font-semibold",
                        movement.direction === "in"
                          ? "text-emerald-700"
                          : "text-red-700",
                      )}
                    >
                      <span className="inline-flex items-center gap-1">
                        {movement.direction === "in" ? (
                          <ArrowUp className="h-3 w-3" />
                        ) : (
                          <ArrowDown className="h-3 w-3" />
                        )}
                        {formatMoney(Number(movement.amount))}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="px-6 py-14 text-center">
            <Wallet className="mx-auto h-9 w-9 text-muted-foreground" />
            <h2 className="mt-3 font-semibold">Todavía no hay movimientos</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Las rendiciones y operaciones manuales aparecerán acá.
            </p>
          </div>
        )}
      </section>
    </div>
  );
}
