import Link from "next/link";
import {
  CalendarCheck2,
  CalendarX2,
  ChevronLeft,
  ChevronRight,
  Plus,
  ReceiptText,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import {
  buildSettlementHistoryHref,
  countWorkingDays,
  normalizeSettlementHistoryFilters,
  shiftDateKey,
} from "@/features/settlements/history";
import {
  getSettlementGapSummary,
  getSettlements,
} from "@/features/settlements/queries";
import { formatDateKey, formatMoney } from "@/lib/formatters";
import { getArgentinaDateKey } from "@/lib/operational-days";
import { cn } from "@/lib/utils";

type SettlementsPageProps = {
  searchParams: Promise<{
    from?: string;
    page?: string;
    q?: string;
    status?: string;
    to?: string;
  }>;
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
  const today = getArgentinaDateKey();
  const filters = normalizeSettlementHistoryFilters(params, today);
  const [history, gapSummary] = await Promise.all([
    getSettlements(filters),
    getSettlementGapSummary(filters.from, filters.to),
  ]);
  const settlements = history.items;
  const normalizedSearch = filters.search.toLocaleLowerCase("es-AR");
  const visibleGapRows = normalizedSearch
    ? gapSummary.filter(
        (row) =>
          row.subagent_name
            .toLocaleLowerCase("es-AR")
            .includes(normalizedSearch) ||
          row.machine_code
            .toLocaleLowerCase("es-AR")
            .includes(normalizedSearch),
      )
    : gapSummary;
  const totalReceived = settlements.reduce(
    (total, settlement) => total + Number(settlement.received_amount),
    0,
  );
  const totalDebt = settlements.reduce(
    (total, settlement) => total + Number(settlement.debt_amount),
    0,
  );
  const completedTo = filters.to < today ? filters.to : shiftDateKey(today, -1);
  const operationalDays = countWorkingDays(filters.from, completedTo);
  const firstVisible = history.total
    ? (history.page - 1) * history.pageSize + 1
    : 0;
  const lastVisible = Math.min(history.page * history.pageSize, history.total);

  return (
    <div className="space-y-6">
      <header className="flex flex-col justify-between gap-4 border-b pb-5 md:flex-row md:items-end">
        <div>
          <p className="text-sm font-medium text-primary">Operación diaria</p>
          <h1 className="mt-1 text-2xl font-semibold">Rendiciones</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Historial, medios de pago y control de días sin rendición.
          </p>
        </div>
        <Link
          href="/rendiciones/nueva"
          prefetch={false}
          className={cn(buttonVariants(), "self-start md:self-auto")}
        >
          <Plus className="h-4 w-4" aria-hidden="true" />
          Nueva rendición
        </Link>
      </header>

      <section className="grid gap-4 md:grid-cols-3">
        <Summary label="Rendiciones encontradas" value={history.total} />
        <Summary
          label="Ingresado en esta página"
          value={formatMoney(totalReceived)}
        />
        <Summary label="Deuda en esta página" value={formatMoney(totalDebt)} />
      </section>

      <section className="rounded-lg border bg-card">
        <form className="grid gap-3 border-b p-4 md:grid-cols-2 xl:grid-cols-[1fr_170px_170px_190px_auto_auto]">
          <input
            className="h-10 self-end rounded-md border bg-background px-3 text-sm"
            type="search"
            name="q"
            defaultValue={filters.search}
            placeholder="Buscar Subagente o máquina"
            aria-label="Buscar rendiciones"
          />
          <label className="grid gap-1 text-xs font-medium text-muted-foreground">
            Desde
            <input
              className="h-10 rounded-md border bg-background px-3 text-sm text-foreground"
              type="date"
              name="from"
              defaultValue={filters.from}
              max={filters.to}
            />
          </label>
          <label className="grid gap-1 text-xs font-medium text-muted-foreground">
            Hasta
            <input
              className="h-10 rounded-md border bg-background px-3 text-sm text-foreground"
              type="date"
              name="to"
              defaultValue={filters.to}
              min={filters.from}
              max={today}
            />
          </label>
          <select
            className="h-10 self-end rounded-md border bg-background px-3 text-sm"
            name="status"
            defaultValue={filters.status}
            aria-label="Filtrar estado"
          >
            <option value="active">Activas</option>
            <option value="settled">Rendidas</option>
            <option value="settled_with_debt">Con deuda</option>
            <option value="voided">Anuladas</option>
            <option value="all">Todas</option>
          </select>
          <button
            className={cn(buttonVariants({ variant: "secondary" }), "self-end")}
          >
            Filtrar
          </button>
          <Link
            href="/rendiciones"
            prefetch={false}
            className={cn(buttonVariants({ variant: "secondary" }), "self-end")}
          >
            Restablecer
          </Link>
        </form>

        <div className="border-b bg-muted/30 px-4 py-3 text-sm text-muted-foreground">
          Período: {formatDateKey(filters.from)} al {formatDateKey(filters.to)}{" "}
          · {operationalDays} días operativos
        </div>

        {settlements.length ? (
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
                {settlements.map((settlement) => (
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
                        prefetch={false}
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
              No se encontraron cierres con los filtros seleccionados.
            </p>
          </div>
        )}

        {history.totalPages > 1 ? (
          <nav
            className="flex flex-col gap-3 border-t px-5 py-4 text-sm sm:flex-row sm:items-center sm:justify-between"
            aria-label="Paginación de rendiciones"
          >
            <p className="text-muted-foreground">
              Mostrando {firstVisible}–{lastVisible} de {history.total} · Página{" "}
              {history.page} de {history.totalPages}
            </p>
            <div className="flex gap-2">
              {history.page > 1 ? (
                <Link
                  href={buildSettlementHistoryHref(filters, history.page - 1)}
                  prefetch={false}
                  className={buttonVariants({
                    variant: "secondary",
                    size: "sm",
                  })}
                >
                  <ChevronLeft className="h-4 w-4" aria-hidden="true" />
                  Anterior
                </Link>
              ) : null}
              {history.page < history.totalPages ? (
                <Link
                  href={buildSettlementHistoryHref(filters, history.page + 1)}
                  prefetch={false}
                  className={buttonVariants({
                    variant: "secondary",
                    size: "sm",
                  })}
                >
                  Siguiente
                  <ChevronRight className="h-4 w-4" aria-hidden="true" />
                </Link>
              ) : null}
            </div>
          </nav>
        ) : null}
      </section>

      {visibleGapRows.length ? (
        <section className="overflow-hidden rounded-lg border border-amber-200 bg-amber-50/60">
          <div className="flex items-start gap-3 border-b border-amber-200 px-5 py-4">
            <CalendarX2
              className="mt-0.5 h-5 w-5 shrink-0 text-amber-700"
              aria-hidden="true"
            />
            <div>
              <h2 className="font-semibold text-amber-950">
                Días sin rendición por Subagente
              </h2>
              <p className="mt-1 text-sm text-amber-900/80">
                Se consideran los días operativos desde el alta de cada
                Subagente. Las rendiciones anuladas cuentan como faltantes.
              </p>
            </div>
          </div>
          <div className="divide-y divide-amber-200">
            {visibleGapRows.map((row) => (
              <div
                key={row.subagent_id}
                className="grid gap-3 px-5 py-4 lg:grid-cols-[minmax(220px,1fr)_120px_2fr] lg:items-center"
              >
                <div>
                  <Link
                    href={`/subagentes/${row.subagent_id}`}
                    prefetch={false}
                    className="font-semibold text-primary hover:underline"
                  >
                    {row.subagent_name}
                  </Link>
                  <p className="mt-1 font-mono text-xs text-muted-foreground">
                    Máquina {row.machine_code}
                  </p>
                </div>
                <Badge variant="warning" className="w-fit">
                  {row.missing_days}{" "}
                  {row.missing_days === 1 ? "día faltante" : "días faltantes"}
                </Badge>
                <div className="flex flex-wrap gap-2">
                  {row.missing_dates.slice(0, 6).map((date) => (
                    <span
                      key={date}
                      className="rounded-md border border-amber-200 bg-white/70 px-2 py-1 text-xs text-amber-950"
                    >
                      {formatDateKey(date)}
                    </span>
                  ))}
                  {row.missing_dates.length > 6 ? (
                    <span className="px-2 py-1 text-xs text-amber-900">
                      +{row.missing_dates.length - 6} anteriores
                    </span>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        </section>
      ) : (
        <section className="flex items-start gap-3 rounded-lg border border-emerald-200 bg-emerald-50 p-5 text-emerald-950">
          <CalendarCheck2
            className="mt-0.5 h-5 w-5 shrink-0"
            aria-hidden="true"
          />
          <div>
            <h2 className="font-semibold">Sin faltantes en el período</h2>
            <p className="mt-1 text-sm text-emerald-900/80">
              Todos los Subagentes visibles tienen rendición en cada día
              operativo seleccionado.
            </p>
          </div>
        </section>
      )}
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
