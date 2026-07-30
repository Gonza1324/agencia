import Link from "next/link";
import {
  AlertTriangle,
  Banknote,
  CalendarClock,
  CheckCircle2,
  CircleDollarSign,
  HandCoins,
  Landmark,
  Plus,
  ReceiptText,
  Scale,
  TrendingDown,
  WalletCards,
  UsersRound,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { MetricCard } from "@/components/ui/metric-card";
import { getDailyDashboard } from "@/features/dashboard/queries";
import { formatDateKey, formatMoney } from "@/lib/formatters";
import { getOperationalDateLabel } from "@/lib/operational-days";
import { cn } from "@/lib/utils";

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

      <section className="rounded-lg border bg-card">
        <div className="flex flex-col gap-4 border-b px-5 py-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="font-semibold">Caja de hoy</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Disponible actual y movimientos del día operativo.
            </p>
          </div>
          {dashboard.userCanOperate ? (
            <div className="flex flex-wrap gap-2">
              <Link
                href="/rendiciones/nueva"
                className={cn(buttonVariants({ size: "sm" }))}
              >
                <ReceiptText className="h-4 w-4" aria-hidden="true" />
                Nueva rendición
              </Link>
              <Link
                href="/caja/nuevo"
                className={cn(
                  buttonVariants({ size: "sm", variant: "secondary" }),
                )}
              >
                <Plus className="h-4 w-4" aria-hidden="true" />
                Movimiento de Caja
              </Link>
              <Link
                href="/subagentes"
                className={cn(
                  buttonVariants({ size: "sm", variant: "secondary" }),
                )}
              >
                Cuentas corrientes
              </Link>
            </div>
          ) : null}
        </div>

        <div className="grid gap-px bg-border sm:grid-cols-2 xl:grid-cols-3">
          <DailyCashMetric
            icon={Banknote}
            label="Efectivo disponible"
            value={formatMoney(
              Number(dashboard.cashSummary?.cash_balance ?? 0),
            )}
            helper="Saldo actual de Caja física"
          />
          <DailyCashMetric
            icon={Landmark}
            label="Banco disponible"
            value={formatMoney(
              Number(dashboard.cashSummary?.bank_balance ?? 0),
            )}
            helper="Saldo bancario registrado"
          />
          <DailyCashMetric
            icon={WalletCards}
            label="Total disponible"
            value={formatMoney(
              Number(dashboard.cashSummary?.total_balance ?? 0),
            )}
            helper="Efectivo más banco"
          />
          <DailyCashMetric
            icon={TrendingDown}
            label="Gastos del día"
            value={formatMoney(
              Number(dashboard.dailyFinancial?.total_expense ?? 0),
            )}
            helper="Egresos operativos"
          />
          <DailyCashMetric
            icon={HandCoins}
            label="Retiros del día"
            value={formatMoney(
              Number(dashboard.dailyFinancial?.total_withdrawals ?? 0),
            )}
            helper="Separados de la ganancia"
          />
          <DailyCashMetric
            icon={Scale}
            label="Estado del cierre"
            value={
              !dashboard.closure
                ? "Pendiente"
                : dashboard.closure.status === "reopened"
                  ? "Reabierto"
                  : hasClosureDifference
                    ? "Con diferencias"
                    : "Correcto"
            }
            helper={
              dashboard.closure
                ? `Efectivo ${formatMoney(
                    Number(dashboard.closure.cash_difference ?? 0),
                  )} · Banco ${formatMoney(
                    Number(dashboard.closure.bank_difference ?? 0),
                  )}`
                : "Se completa al cerrar el día"
            }
            danger={hasClosureDifference}
          />
        </div>
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

      <section
        className={`rounded-lg border ${
          dashboard.expenseForecast.canCover
            ? "bg-card"
            : "border-red-200 bg-red-50"
        }`}
      >
        <div className="flex flex-col gap-3 border-b px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="flex items-center gap-2 font-semibold">
              <CalendarClock
                className="h-5 w-5 text-primary"
                aria-hidden="true"
              />
              Gastos próximos
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Vencidos y compromisos hasta el{" "}
              {formatDateKey(dashboard.expenseForecast.horizonDate)}.
            </p>
          </div>
          {dashboard.userCanOperate ? (
            <Link
              href="/gastos"
              className="text-sm font-semibold text-primary hover:underline"
            >
              Administrar gastos
            </Link>
          ) : null}
        </div>

        <div className="grid gap-px bg-border sm:grid-cols-3">
          <ExpenseMetric
            label="Vencidos"
            value={formatMoney(dashboard.expenseForecast.overdueAmount)}
            helper={`${dashboard.expenseForecast.overdueCount} ${
              dashboard.expenseForecast.overdueCount === 1
                ? "obligación"
                : "obligaciones"
            }`}
            danger={dashboard.expenseForecast.overdueCount > 0}
          />
          <ExpenseMetric
            label="Hasta 7 días"
            value={formatMoney(dashboard.expenseForecast.upcomingAmount)}
            helper={`${dashboard.expenseForecast.upcomingCount} ${
              dashboard.expenseForecast.upcomingCount === 1
                ? "vencimiento"
                : "vencimientos"
            }`}
          />
          <ExpenseMetric
            label="Cobertura de Caja"
            value={
              dashboard.expenseForecast.canCover
                ? "Alcanza"
                : `Faltan ${formatMoney(
                    Math.abs(
                      dashboard.expenseForecast.remainingAfterExpenses,
                    ),
                  )}`
            }
            helper={
              dashboard.expenseForecast.canCover
                ? `Quedarían ${formatMoney(
                    dashboard.expenseForecast.remainingAfterExpenses,
                  )}`
                : `Compromisos por ${formatMoney(
                    dashboard.expenseForecast.requiredAmount,
                  )}`
            }
            danger={!dashboard.expenseForecast.canCover}
          />
        </div>

        {dashboard.expenses.length ? (
          <div className="divide-y">
            {dashboard.expenses.slice(0, 5).map((expense) => {
              const isOverdue = expense.due_date < dashboard.operationalDate;
              const isToday = expense.due_date === dashboard.operationalDate;
              const content = (
                <>
                  <div>
                    <p className="font-medium">{expense.description}</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Vence {formatDateKey(expense.due_date)}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge
                      variant={
                        isOverdue ? "danger" : isToday ? "warning" : "muted"
                      }
                    >
                      {isOverdue
                        ? "Vencido"
                        : isToday
                          ? "Vence hoy"
                          : "Próximo"}
                    </Badge>
                    <strong>{formatMoney(Number(expense.amount))}</strong>
                  </div>
                </>
              );

              return dashboard.userCanOperate ? (
                <Link
                  key={expense.id}
                  href={`/gastos/${expense.id}/editar`}
                  className="flex flex-col gap-3 px-5 py-4 transition-colors hover:bg-muted/50 sm:flex-row sm:items-center sm:justify-between"
                >
                  {content}
                </Link>
              ) : (
                <div
                  key={expense.id}
                  className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between"
                >
                  {content}
                </div>
              );
            })}
            {dashboard.expenses.length > 5 ? (
              <p className="px-5 py-3 text-sm text-muted-foreground">
                Hay {dashboard.expenses.length - 5} obligaciones adicionales
                dentro del período.
              </p>
            ) : null}
          </div>
        ) : (
          <div className="flex items-center gap-3 px-5 py-5 text-sm text-muted-foreground">
            <WalletCards className="h-5 w-5" aria-hidden="true" />
            No hay gastos vencidos ni próximos en los siguientes 7 días.
          </div>
        )}
      </section>

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

function ExpenseMetric({
  danger = false,
  helper,
  label,
  value,
}: {
  danger?: boolean;
  helper: string;
  label: string;
  value: string;
}) {
  return (
    <div className="bg-card px-5 py-4">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p
        className={`mt-1 text-xl font-semibold ${
          danger ? "text-destructive" : ""
        }`}
      >
        {value}
      </p>
      <p className="mt-1 text-xs text-muted-foreground">{helper}</p>
    </div>
  );
}

function DailyCashMetric({
  danger = false,
  helper,
  icon: Icon,
  label,
  value,
}: {
  danger?: boolean;
  helper: string;
  icon: typeof Banknote;
  label: string;
  value: string;
}) {
  return (
    <article className="bg-card px-5 py-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm text-muted-foreground">{label}</p>
          <p
            className={cn(
              "mt-1 text-xl font-semibold",
              danger && "text-destructive",
            )}
          >
            {value}
          </p>
        </div>
        <div className="rounded-md bg-muted p-2 text-primary">
          <Icon className="h-4 w-4" aria-hidden="true" />
        </div>
      </div>
      <p className="mt-2 text-xs text-muted-foreground">{helper}</p>
    </article>
  );
}
