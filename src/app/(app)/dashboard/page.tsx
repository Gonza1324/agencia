import Link from "next/link";
import {
  AlertTriangle,
  CheckCircle2,
  CircleDollarSign,
  UsersRound,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { MetricCard } from "@/components/ui/metric-card";
import { getDailyDashboard } from "@/features/dashboard/queries";
import { formatDateKey, formatMoney } from "@/lib/formatters";
import { getOperationalDateLabel } from "@/lib/operational-days";

const statusPresentation: Record<
  string,
  {
    badgeClassName?: string;
    label: string;
    variant: "danger" | "muted" | "success" | "warning";
  }
> = {
  settled: {
    label: "Rindió",
    variant: "success",
  },
  settled_with_debt: {
    label: "Rindió con deuda",
    variant: "warning",
  },
  pending: {
    label: "Pendiente hoy",
    variant: "warning",
  },
  late: {
    badgeClassName: "border-orange-200 bg-orange-50 text-orange-700",
    label: "Atrasado",
    variant: "warning",
  },
  late_serious: {
    label: "Atrasado grave",
    variant: "danger",
  },
  late_critical: {
    badgeClassName: "border-red-900 bg-red-900 text-white",
    label: "Atrasado crítico",
    variant: "danger",
  },
  non_working: {
    label: "Sin operación",
    variant: "muted",
  },
};

export default async function DashboardPage() {
  const dashboard = await getDailyDashboard();
  const alertRows = dashboard.rows.filter((row) =>
    ["late", "late_serious", "late_critical"].includes(row.dashboard_status),
  );
  const hasClosureDifference =
    Number(dashboard.closure?.cash_difference ?? 0) !== 0 ||
    Number(dashboard.closure?.bank_difference ?? 0) !== 0;

  return (
    <div className="space-y-6">
      <header className="flex flex-col justify-between gap-3 border-b pb-5 md:flex-row md:items-end">
        <div>
          <p className="text-sm font-medium text-primary">Dashboard diario</p>
          <h1 className="mt-1 text-2xl font-semibold tracking-normal">
            {getOperationalDateLabel(new Date())}
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Estado operativo de la agencia y sus Subagentes.
          </p>
        </div>
        <Badge variant={dashboard.workingDay ? "success" : "muted"}>
          {dashboard.workingDay
            ? dashboard.businessDay?.status === "closed"
              ? "Día cerrado"
              : "Día operativo abierto"
            : "Domingo sin pendientes nuevos"}
        </Badge>
      </header>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          icon={UsersRound}
          label="Subagentes activos"
          value={String(dashboard.rows.length)}
          helper="Obligados a rendir de lunes a sábado"
        />
        <MetricCard
          icon={CheckCircle2}
          label="Rindieron hoy"
          value={String(dashboard.settledToday)}
          helper={
            dashboard.workingDay
              ? `${dashboard.pendingToday} pendientes del día`
              : "Sin operación los domingos"
          }
        />
        <MetricCard
          icon={CircleDollarSign}
          label="Ingresado hoy"
          value={formatMoney(dashboard.receivedToday)}
          helper="Importe total de rendiciones"
        />
        <MetricCard
          icon={AlertTriangle}
          label="Alertas de atraso"
          value={String(dashboard.alertCount)}
          helper="Sin generar deuda automática"
        />
      </section>

      {dashboard.workingDay &&
      (dashboard.businessDay?.status !== "closed" || hasClosureDifference) ? (
        <section
          className={`rounded-lg border p-5 ${
            hasClosureDifference
              ? "border-red-200 bg-red-50"
              : "border-amber-200 bg-amber-50"
          }`}
        >
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="font-semibold">
                {hasClosureDifference
                  ? "El cierre tiene diferencias"
                  : dashboard.businessDay?.status === "reopened"
                    ? "La Caja fue reabierta"
                    : "La Caja todavía está abierta"}
              </h2>
              <p className="mt-1 text-sm">
                {hasClosureDifference
                  ? `Efectivo: ${formatMoney(Number(dashboard.closure?.cash_difference ?? 0))} · Banco: ${formatMoney(Number(dashboard.closure?.bank_difference ?? 0))}`
                  : "Revisá el arqueo y cerrá el día cuando termine la operación."}
              </p>
            </div>
            <Link
              href="/cierre-diario"
              className="text-sm font-semibold text-primary hover:underline"
            >
              Ir al cierre diario
            </Link>
          </div>
        </section>
      ) : null}

      {alertRows.length ? (
        <section className="rounded-lg border border-orange-200 bg-orange-50 p-5">
          <div className="flex items-start gap-3">
            <AlertTriangle
              className="mt-0.5 h-5 w-5 shrink-0 text-orange-700"
              aria-hidden="true"
            />
            <div>
              <h2 className="font-semibold text-orange-950">
                Hay Subagentes con rendiciones atrasadas
              </h2>
              <p className="mt-1 text-sm text-orange-800">
                {alertRows
                  .slice(0, 3)
                  .map(
                    (row) =>
                      `${row.subagent_name} (${row.delay_days} ${
                        row.delay_days === 1 ? "día" : "días"
                      })`,
                  )
                  .join(", ")}
                {alertRows.length > 3 ? ` y ${alertRows.length - 3} más.` : "."}
              </p>
            </div>
          </div>
        </section>
      ) : null}

      <section className="rounded-lg border bg-card">
        <div className="border-b px-5 py-4">
          <h2 className="font-semibold">Estado de Subagentes</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Pendientes y atrasos calculados automáticamente sobre días
            operativos.
          </p>
        </div>

        {dashboard.rows.length ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[920px] text-sm">
              <thead className="bg-muted text-left text-muted-foreground">
                <tr>
                  <th className="px-5 py-3 font-medium">Subagente</th>
                  <th className="px-5 py-3 font-medium">Máquina</th>
                  <th className="px-5 py-3 font-medium">Estado</th>
                  <th className="px-5 py-3 font-medium">Días atraso</th>
                  <th className="px-5 py-3 font-medium">Ingresó hoy</th>
                  <th className="px-5 py-3 font-medium">Saldo conocido</th>
                  <th className="px-5 py-3 font-medium">Última rendición</th>
                </tr>
              </thead>
              <tbody>
                {dashboard.rows.map((row) => {
                  const presentation =
                    statusPresentation[row.dashboard_status] ??
                    statusPresentation.pending;

                  return (
                    <tr key={row.subagent_id} className="border-t">
                      <td className="px-5 py-4">
                        <Link
                          href={`/subagentes/${row.subagent_id}`}
                          className="font-medium text-primary hover:underline"
                        >
                          {row.subagent_name}
                        </Link>
                      </td>
                      <td className="px-5 py-4 font-mono">
                        {row.machine_code}
                      </td>
                      <td className="px-5 py-4">
                        <Badge
                          variant={presentation.variant}
                          className={presentation.badgeClassName}
                        >
                          {presentation.label}
                        </Badge>
                      </td>
                      <td className="px-5 py-4">{row.delay_days || "—"}</td>
                      <td className="px-5 py-4">
                        {formatMoney(Number(row.received_today))}
                      </td>
                      <td className="px-5 py-4">
                        {formatMoney(Number(row.known_balance))}
                      </td>
                      <td className="px-5 py-4">
                        {row.last_settlement_date
                          ? formatDateKey(row.last_settlement_date)
                          : "Sin rendiciones"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="px-6 py-14 text-center">
            <UsersRound
              className="mx-auto h-9 w-9 text-muted-foreground"
              aria-hidden="true"
            />
            <h2 className="mt-3 font-semibold">No hay Subagentes activos</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Activá o creá un Subagente para comenzar el seguimiento diario.
            </p>
            <Link
              href="/subagentes"
              className="mt-4 inline-block text-sm font-medium text-primary hover:underline"
            >
              Ir a Subagentes
            </Link>
          </div>
        )}
      </section>
    </div>
  );
}
