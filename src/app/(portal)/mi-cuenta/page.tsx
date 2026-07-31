import {
  AlertTriangle,
  BadgeDollarSign,
  Calculator,
  MonitorCog,
  ReceiptText,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getMySubagentAccounts } from "@/features/subagent-portal/queries";
import { formatDateKey, formatDateTime, formatMoney } from "@/lib/formatters";

const movementLabels: Record<string, string> = {
  settlement_debt: "Deuda de rendición",
  debt_payment: "Pago de deuda",
  positive_adjustment: "Ajuste de deuda",
  negative_adjustment: "Ajuste a favor",
  compensation: "Compensación",
  prize_credit: "Saldo a favor por premios",
  overpayment_credit: "Saldo a favor por pago excedente",
};

const settlementLabels: Record<string, string> = {
  settled: "Rendida",
  settled_with_debt: "Rendida con deuda",
  voided: "Anulada",
};

export default async function MyAccountPage() {
  const portal = await getMySubagentAccounts();
  const accounts = portal.accounts;

  return (
    <div className="space-y-6">
      <header>
        <p className="text-sm font-medium text-primary">Mi cuenta</p>
        <h1 className="mt-1 text-3xl font-semibold">
          Máquinas y cuenta corriente
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Consultá saldos, rendiciones y movimientos informados por la Agencia.
        </p>
      </header>

      {portal.alerts.length ? (
        <section className="rounded-xl border-2 border-red-300 bg-red-50 p-5 text-red-950">
          <div className="flex items-start gap-3">
            <div className="rounded-full bg-red-100 p-2 text-red-800">
              <AlertTriangle className="h-6 w-6" aria-hidden="true" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold uppercase tracking-wide text-red-700">
                Alerta de rendición
              </p>
              <h2 className="mt-1 text-xl font-semibold">
                {portal.alerts.length === 1
                  ? "Tenés una máquina atrasada"
                  : `Tenés ${portal.alerts.length} máquinas atrasadas`}
              </h2>
              <p className="mt-1 text-sm text-red-800">
                La Agencia configuró el aviso desde{" "}
                {portal.alertPreferences.overdue_min_days}{" "}
                {portal.alertPreferences.overdue_min_days === 1
                  ? "día operativo"
                  : "días operativos"}{" "}
                de atraso.
              </p>
              <div className="mt-4 grid gap-2 sm:grid-cols-2">
                {portal.alerts.map((alert) => (
                  <div
                    key={alert.subagent_id}
                    className="rounded-lg border border-red-200 bg-white/70 px-4 py-3"
                  >
                    <p className="font-semibold">{alert.subagent_name}</p>
                    <p className="mt-1 text-sm">
                      Máquina {alert.machine_code} · {alert.delay_days}{" "}
                      {alert.delay_days === 1 ? "día" : "días"} de atraso
                    </p>
                    <p className="mt-1 text-xs text-red-700">
                      Última rendición:{" "}
                      {alert.last_settlement_date
                        ? formatDateKey(alert.last_settlement_date)
                        : "sin rendiciones registradas"}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      ) : null}

      {accounts.length ? (
        accounts.map((account) => (
          <SubagentAccount key={account.subagent.id} account={account} />
        ))
      ) : (
        <Card>
          <CardContent className="py-14 text-center">
            <MonitorCog className="mx-auto h-9 w-9 text-muted-foreground" />
            <h2 className="mt-3 font-semibold">
              Todavía no tenés máquinas asignadas
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Comunicate con la Agencia para completar la asignación.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function SubagentAccount({
  account,
}: {
  account: Awaited<
    ReturnType<typeof getMySubagentAccounts>
  >["accounts"][number];
}) {
  const balance = Number(account.summary?.balance ?? 0);
  const recentSettlements = account.settlements.slice(0, 12);
  const recentMovements = account.movements.slice(0, 20);

  return (
    <section className="space-y-5 rounded-xl border bg-background p-4 sm:p-6">
      <div className="flex flex-col gap-3 border-b pb-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold">{account.subagent.name}</h2>
          <p className="mt-1 font-mono text-sm text-muted-foreground">
            Máquina {account.subagent.machine_code}
          </p>
        </div>
        <Badge
          variant={account.subagent.status === "active" ? "success" : "muted"}
        >
          {account.subagent.status === "active" ? "Activa" : "Inactiva"}
        </Badge>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <SummaryCard
          icon={BadgeDollarSign}
          label="Saldo actual"
          value={formatMoney(Math.abs(balance))}
          helper={
            balance > 0
              ? "Deuda pendiente"
              : balance < 0
                ? "Saldo a tu favor"
                : "Cuenta al día"
          }
          danger={balance > 0}
        />
        <SummaryCard
          icon={Calculator}
          label="Comisión"
          value={`${account.subagent.commission_percentage}%`}
          helper="Porcentaje configurado"
        />
        <SummaryCard
          icon={ReceiptText}
          label="Total de débitos"
          value={formatMoney(Number(account.summary?.total_debits ?? 0))}
          helper="Cargos históricos vigentes"
        />
        <SummaryCard
          icon={ReceiptText}
          label="Total de créditos"
          value={formatMoney(Number(account.summary?.total_credits ?? 0))}
          helper="Pagos y saldos a favor"
        />
      </div>

      <div className="grid gap-5 xl:grid-cols-[1.2fr_0.8fr]">
        <Card>
          <CardHeader>
            <CardTitle>Rendiciones recientes</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {recentSettlements.length ? (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[760px] text-sm">
                  <thead className="bg-muted text-left text-muted-foreground">
                    <tr>
                      <th className="px-5 py-3 font-medium">Fecha</th>
                      <th className="px-5 py-3 font-medium">Estado</th>
                      <th className="px-5 py-3 text-right font-medium">
                        Venta
                      </th>
                      <th className="px-5 py-3 text-right font-medium">
                        Premios
                      </th>
                      <th className="px-5 py-3 text-right font-medium">
                        Comisión
                      </th>
                      <th className="px-5 py-3 text-right font-medium">
                        Recibido
                      </th>
                      <th className="px-5 py-3 text-right font-medium">
                        Deuda
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentSettlements.map((settlement) => (
                      <tr key={settlement.id} className="border-t">
                        <td className="px-5 py-4">
                          {formatDateKey(settlement.settlement_date)}
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
                            {settlementLabels[settlement.status] ??
                              settlement.status}
                          </Badge>
                        </td>
                        <td className="px-5 py-4 text-right">
                          {settlement.sales_amount === null
                            ? "—"
                            : formatMoney(Number(settlement.sales_amount))}
                        </td>
                        <td className="px-5 py-4 text-right">
                          {settlement.prizes_paid_amount === null
                            ? "—"
                            : formatMoney(
                                Number(settlement.prizes_paid_amount),
                              )}
                        </td>
                        <td className="px-5 py-4 text-right">
                          {settlement.commission_amount === null
                            ? "—"
                            : formatMoney(Number(settlement.commission_amount))}
                        </td>
                        <td className="px-5 py-4 text-right font-medium">
                          {formatMoney(Number(settlement.received_amount))}
                        </td>
                        <td className="px-5 py-4 text-right">
                          {formatMoney(Number(settlement.debt_amount))}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="px-5 py-10 text-center text-sm text-muted-foreground">
                Todavía no hay rendiciones registradas.
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Cuenta corriente</CardTitle>
          </CardHeader>
          <CardContent>
            {recentMovements.length ? (
              <ol className="space-y-4">
                {recentMovements.map((movement) => (
                  <li
                    key={movement.id}
                    className={movement.voided_at ? "opacity-50" : ""}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-sm font-medium">
                          {movementLabels[movement.type] ?? movement.type}
                        </p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {movement.business_day?.date
                            ? formatDateKey(movement.business_day.date)
                            : formatDateTime(movement.created_at)}
                        </p>
                        {movement.notes ? (
                          <p className="mt-1 text-xs">{movement.notes}</p>
                        ) : null}
                      </div>
                      <p
                        className={`shrink-0 text-sm font-semibold ${
                          movement.direction === "debit"
                            ? "text-red-700"
                            : "text-emerald-700"
                        }`}
                      >
                        {movement.direction === "debit" ? "+" : "−"}
                        {formatMoney(Number(movement.amount))}
                      </p>
                    </div>
                  </li>
                ))}
              </ol>
            ) : (
              <p className="py-8 text-center text-sm text-muted-foreground">
                La cuenta corriente todavía no tiene movimientos.
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </section>
  );
}

function SummaryCard({
  danger = false,
  helper,
  icon: Icon,
  label,
  value,
}: {
  danger?: boolean;
  helper: string;
  icon: typeof BadgeDollarSign;
  label: string;
  value: string;
}) {
  return (
    <Card>
      <CardContent className="flex items-start justify-between gap-3 p-4">
        <div>
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
        <div className="rounded-md bg-muted p-2 text-primary">
          <Icon className="h-4 w-4" aria-hidden="true" />
        </div>
      </CardContent>
    </Card>
  );
}
