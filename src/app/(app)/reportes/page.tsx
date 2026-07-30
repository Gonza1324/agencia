import Link from "next/link";
import {
  AlertTriangle,
  Banknote,
  CircleDollarSign,
  HandCoins,
  Landmark,
  ReceiptText,
  Scale,
  TrendingDown,
  TrendingUp,
  UsersRound,
  WalletCards,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MetricCard } from "@/components/ui/metric-card";
import { getReportsData } from "@/features/reports/queries";
import type { ReportView } from "@/features/reports/validations";
import { formatDateKey, formatMoney } from "@/lib/formatters";
import { getArgentinaDateKey } from "@/lib/operational-days";
import { cn } from "@/lib/utils";

type ReportsPageProps = {
  searchParams: Promise<{
    date?: string;
    view?: string;
  }>;
};

const viewLabels: Record<ReportView, string> = {
  daily: "Diario",
  weekly: "Semanal",
  monthly: "Mensual",
};

export default async function ReportsPage({ searchParams }: ReportsPageProps) {
  const filters = await searchParams;
  const report = await getReportsData(filters.view, filters.date);
  const periodLabel =
    report.view === "daily"
      ? formatDateKey(report.anchorDate)
      : `${formatDateKey(report.range.from)} al ${formatDateKey(report.range.to)}`;

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 border-b pb-5 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <p className="text-sm font-medium text-primary">
            Reportes operativos
          </p>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight">
            Reporte {viewLabels[report.view].toLowerCase()}
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">{periodLabel}</p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <nav
            className="flex rounded-md border bg-muted/40 p-1"
            aria-label="Tipo de reporte"
          >
            {(Object.keys(viewLabels) as ReportView[]).map((view) => (
              <Link
                key={view}
                href={`/reportes?view=${view}&date=${report.anchorDate}`}
                className={cn(
                  "rounded px-3 py-2 text-sm font-medium",
                  report.view === view
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                {viewLabels[view]}
              </Link>
            ))}
          </nav>
          <form className="flex items-end gap-2">
            <input type="hidden" name="view" value={report.view} />
            <label>
              <span className="block text-xs font-medium text-muted-foreground">
                {report.view === "daily"
                  ? "Fecha"
                  : report.view === "weekly"
                    ? "Semana de"
                    : "Mes de"}
              </span>
              <input
                className="mt-1 h-10 rounded-md border bg-background px-3 text-sm"
                type="date"
                name="date"
                defaultValue={report.anchorDate}
                max={getArgentinaDateKey()}
              />
            </label>
            <button
              className="h-10 rounded-md border bg-card px-4 text-sm font-medium hover:bg-muted"
              type="submit"
            >
              Aplicar
            </button>
          </form>
        </div>
      </header>

      {report.view === "daily" && report.daily ? (
        <DailyReport closure={report.dailyClosure} data={report.daily} />
      ) : report.period ? (
        <PeriodReport report={report} />
      ) : null}
    </div>
  );
}

function DailyReport({
  closure,
  data,
}: {
  closure: { id: string; status: "closed" | "reopened" } | null;
  data: {
    bank_difference: number;
    bank_income: number;
    cash_difference: number;
    cash_income: number;
    indebted_subagents: number;
    late_subagents: number;
    pending_subagents: number;
    settlements_count: number;
    total_available: number;
    total_expense: number;
    total_income: number;
    total_withdrawals: number;
  };
}) {
  const hasDifference =
    Number(data.cash_difference) !== 0 || Number(data.bank_difference) !== 0;

  return (
    <>
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          icon={CircleDollarSign}
          label="Total ingresado"
          value={formatMoney(Number(data.total_income))}
          helper="Ingresos operativos del día"
        />
        <MetricCard
          icon={Banknote}
          label="Ingresó en efectivo"
          value={formatMoney(Number(data.cash_income))}
          helper="Sin transferencias internas"
        />
        <MetricCard
          icon={Landmark}
          label="Ingresó en banco"
          value={formatMoney(Number(data.bank_income))}
          helper="Sin transferencias internas"
        />
        <MetricCard
          icon={WalletCards}
          label="Total disponible"
          value={formatMoney(Number(data.total_available))}
          helper="Efectivo y banco acumulados"
        />
        <MetricCard
          icon={TrendingDown}
          label="Gastos"
          value={formatMoney(Number(data.total_expense))}
          helper="Egresos operativos"
        />
        <MetricCard
          icon={HandCoins}
          label="Retiros"
          value={formatMoney(Number(data.total_withdrawals))}
          helper="No reducen la ganancia operativa"
        />
        <MetricCard
          icon={ReceiptText}
          label="Rendiciones cargadas"
          value={String(data.settlements_count)}
          helper="Rendiciones activas del día"
        />
        <MetricCard
          icon={UsersRound}
          label="Pendientes"
          value={String(data.pending_subagents)}
          helper="Subagentes sin rendición"
        />
        <MetricCard
          icon={AlertTriangle}
          label="Atrasados"
          value={String(data.late_subagents)}
          helper="Con uno o más días de atraso"
        />
        <MetricCard
          icon={Scale}
          label="Con deuda"
          value={String(data.indebted_subagents)}
          helper="Saldo conocido mayor a cero"
        />
      </section>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-4">
          <div>
            <CardTitle>Diferencias de Caja</CardTitle>
            <p className="mt-1 text-sm text-muted-foreground">
              Resultado del cierre diario seleccionado.
            </p>
          </div>
          <Badge
            variant={
              !closure
                ? "muted"
                : closure.status === "reopened"
                  ? "warning"
                  : hasDifference
                    ? "danger"
                    : "success"
            }
          >
            {!closure
              ? "Sin cierre"
              : closure.status === "reopened"
                ? "Reabierto"
                : hasDifference
                  ? "Con diferencias"
                  : "Sin diferencias"}
          </Badge>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <DifferenceCard
            label="Diferencia de efectivo"
            value={Number(data.cash_difference)}
            inactive={!closure}
          />
          <DifferenceCard
            label="Diferencia de banco"
            value={Number(data.bank_difference)}
            inactive={!closure}
          />
        </CardContent>
      </Card>
    </>
  );
}

function PeriodReport({
  report,
}: {
  report: Awaited<ReturnType<typeof getReportsData>>;
}) {
  if (!report.period) {
    return null;
  }

  const ranking = [...report.ranking];
  const lateRanking = [...ranking]
    .filter((row) => Number(row.missing_days) > 0)
    .sort(
      (first, second) =>
        Number(second.missing_days) - Number(first.missing_days),
    )
    .slice(0, 5);

  return (
    <>
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          icon={TrendingUp}
          label="Ingresos"
          value={formatMoney(Number(report.period.total_income))}
          helper="Entradas operativas del período"
        />
        <MetricCard
          icon={TrendingDown}
          label="Egresos"
          value={formatMoney(Number(report.period.total_expense))}
          helper="Gastos operativos del período"
        />
        <MetricCard
          icon={CircleDollarSign}
          label="Ganancia operativa"
          value={formatMoney(Number(report.period.operating_profit))}
          helper="Ingresos menos egresos"
        />
        <MetricCard
          icon={HandCoins}
          label="Retiros"
          value={formatMoney(Number(report.period.total_withdrawals))}
          helper="Separados de la ganancia"
        />
        <MetricCard
          icon={Banknote}
          label="Saldo efectivo"
          value={formatMoney(Number(report.period.ending_cash_balance))}
          helper="Al cierre del período"
        />
        <MetricCard
          icon={Landmark}
          label="Saldo banco"
          value={formatMoney(Number(report.period.ending_bank_balance))}
          helper="Al cierre del período"
        />
        <MetricCard
          icon={WalletCards}
          label="Caja total"
          value={formatMoney(Number(report.period.ending_total_balance))}
          helper="Efectivo más banco"
        />
        <MetricCard
          icon={Scale}
          label="Deuda pendiente"
          value={formatMoney(Number(report.period.outstanding_debt))}
          helper="Saldos conocidos al final"
        />
      </section>

      <DailyEvolution rows={report.series} />

      <div className="grid gap-6 xl:grid-cols-[1.4fr_0.6fr]">
        <SubagentRanking rows={ranking} />
        <div className="space-y-6">
          <LateRanking rows={lateRanking} />
          <OwnerWithdrawals rows={report.withdrawals} />
        </div>
      </div>
    </>
  );
}

function DailyEvolution({
  rows,
}: {
  rows: Array<{
    closing_total_balance: number;
    expense: number;
    income: number;
    is_working_day: boolean;
    operating_profit: number;
    report_date: string;
  }>;
}) {
  const maxMovement = Math.max(
    ...rows.flatMap((row) => [Number(row.income), Number(row.expense)]),
    1,
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>Evolución diaria</CardTitle>
        <p className="mt-1 text-sm text-muted-foreground">
          Ingresos y egresos del día con saldo acumulado de Caja.
        </p>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-sm">
            <thead className="border-b text-left text-muted-foreground">
              <tr>
                <th className="pb-3 font-medium">Fecha</th>
                <th className="pb-3 font-medium">Movimiento</th>
                <th className="pb-3 text-right font-medium">Ingresos</th>
                <th className="pb-3 text-right font-medium">Egresos</th>
                <th className="pb-3 text-right font-medium">Ganancia</th>
                <th className="pb-3 text-right font-medium">Caja total</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.report_date} className="border-b last:border-0">
                  <td className="py-3">
                    {formatDateKey(row.report_date)}
                    {!row.is_working_day ? (
                      <span className="ml-2 text-xs text-muted-foreground">
                        Domingo
                      </span>
                    ) : null}
                  </td>
                  <td className="w-44 py-3">
                    <div className="space-y-1">
                      <div
                        className="h-1.5 rounded bg-emerald-500"
                        style={{
                          width: `${(Number(row.income) / maxMovement) * 100}%`,
                        }}
                      />
                      <div
                        className="h-1.5 rounded bg-red-400"
                        style={{
                          width: `${(Number(row.expense) / maxMovement) * 100}%`,
                        }}
                      />
                    </div>
                  </td>
                  <td className="py-3 text-right text-emerald-700">
                    {formatMoney(Number(row.income))}
                  </td>
                  <td className="py-3 text-right text-destructive">
                    {formatMoney(Number(row.expense))}
                  </td>
                  <td className="py-3 text-right font-medium">
                    {formatMoney(Number(row.operating_profit))}
                  </td>
                  <td className="py-3 text-right font-semibold">
                    {formatMoney(Number(row.closing_total_balance))}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}

function SubagentRanking({
  rows,
}: {
  rows: Array<{
    machine_code: string;
    missing_days: number;
    outstanding_balance: number;
    received_amount: number;
    settlements_count: number;
    subagent_id: string;
    subagent_name: string;
  }>;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Ranking de Subagentes</CardTitle>
        <p className="mt-1 text-sm text-muted-foreground">
          Ordenado por dinero ingresado en rendiciones y pagos de deuda. La
          ganancia individual quedará disponible cuando ventas, premios y
          comisión sean datos completos.
        </p>
      </CardHeader>
      <CardContent>
        {rows.length ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-sm">
              <thead className="border-b text-left text-muted-foreground">
                <tr>
                  <th className="pb-3 font-medium">#</th>
                  <th className="pb-3 font-medium">Subagente</th>
                  <th className="pb-3 font-medium">Máquina</th>
                  <th className="pb-3 text-right font-medium">Ingresado</th>
                  <th className="pb-3 text-right font-medium">Rendiciones</th>
                  <th className="pb-3 text-right font-medium">Deuda</th>
                  <th className="pb-3 text-right font-medium">Atrasos</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row, index) => (
                  <tr key={row.subagent_id} className="border-b last:border-0">
                    <td className="py-3 font-medium">{index + 1}</td>
                    <td className="py-3">
                      <Link
                        href={`/subagentes/${row.subagent_id}`}
                        className="font-medium text-primary hover:underline"
                      >
                        {row.subagent_name}
                      </Link>
                    </td>
                    <td className="py-3 font-mono">{row.machine_code}</td>
                    <td className="py-3 text-right font-semibold">
                      {formatMoney(Number(row.received_amount))}
                    </td>
                    <td className="py-3 text-right">{row.settlements_count}</td>
                    <td className="py-3 text-right">
                      {formatMoney(Number(row.outstanding_balance))}
                    </td>
                    <td className="py-3 text-right">{row.missing_days}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyReport message="No hay actividad de Subagentes en este período." />
        )}
      </CardContent>
    </Card>
  );
}

function LateRanking({
  rows,
}: {
  rows: Array<{
    missing_days: number;
    subagent_id: string;
    subagent_name: string;
  }>;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Mayores atrasos</CardTitle>
      </CardHeader>
      <CardContent>
        {rows.length ? (
          <ol className="space-y-3">
            {rows.map((row) => (
              <li
                key={row.subagent_id}
                className="flex items-center justify-between gap-3"
              >
                <Link
                  href={`/subagentes/${row.subagent_id}`}
                  className="text-sm font-medium text-primary hover:underline"
                >
                  {row.subagent_name}
                </Link>
                <Badge variant="warning">
                  {row.missing_days}{" "}
                  {Number(row.missing_days) === 1 ? "día" : "días"}
                </Badge>
              </li>
            ))}
          </ol>
        ) : (
          <EmptyReport message="No hay atrasos en este período." />
        )}
      </CardContent>
    </Card>
  );
}

function OwnerWithdrawals({
  rows,
}: {
  rows: Array<{
    owner_name: string;
    withdrawal_amount: number;
    withdrawals_count: number;
  }>;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Retiros por dueño</CardTitle>
      </CardHeader>
      <CardContent>
        {rows.length ? (
          <ul className="space-y-3">
            {rows.map((row) => (
              <li
                key={row.owner_name}
                className="flex items-center justify-between gap-3"
              >
                <div>
                  <p className="text-sm font-medium">{row.owner_name}</p>
                  <p className="text-xs text-muted-foreground">
                    {row.withdrawals_count}{" "}
                    {Number(row.withdrawals_count) === 1 ? "retiro" : "retiros"}
                  </p>
                </div>
                <strong>{formatMoney(Number(row.withdrawal_amount))}</strong>
              </li>
            ))}
          </ul>
        ) : (
          <EmptyReport message="No hubo retiros en este período." />
        )}
      </CardContent>
    </Card>
  );
}

function DifferenceCard({
  inactive,
  label,
  value,
}: {
  inactive: boolean;
  label: string;
  value: number;
}) {
  return (
    <div className="rounded-md border p-4">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p
        className={cn(
          "mt-1 text-2xl font-semibold",
          !inactive && value !== 0 && "text-destructive",
        )}
      >
        {inactive ? "—" : formatMoney(value)}
      </p>
    </div>
  );
}

function EmptyReport({ message }: { message: string }) {
  return (
    <p className="py-6 text-center text-sm text-muted-foreground">{message}</p>
  );
}
