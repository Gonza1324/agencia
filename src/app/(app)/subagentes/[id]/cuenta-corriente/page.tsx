import Link from "next/link";
import { notFound } from "next/navigation";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getSubagentAccountPageData } from "@/features/subagent-accounts/queries";
import { SubagentAccountForm } from "@/features/subagent-accounts/subagent-account-form";
import { VoidAccountMovementForm } from "@/features/subagent-accounts/void-account-movement-form";
import { formatDateKey, formatDateTime, formatMoney } from "@/lib/formatters";
import { getArgentinaDateKey } from "@/lib/operational-days";
import { cn } from "@/lib/utils";

type SubagentAccountPageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{
    created?: string;
    voided?: string;
    voidError?: string;
  }>;
};

const movementLabels = {
  settlement_debt: "Deuda por rendición",
  prize_credit: "Saldo a favor por premios",
  overpayment_credit: "Saldo a favor por pago excedente",
  debt_payment: "Pago de deuda",
  positive_adjustment: "Ajuste que aumenta deuda",
  negative_adjustment: "Ajuste que reduce deuda",
  compensation: "Compensación",
  void: "Anulación",
} as const;

export default async function SubagentAccountPage({
  params,
  searchParams,
}: SubagentAccountPageProps) {
  const { id } = await params;
  const notices = await searchParams;
  const data = await getSubagentAccountPageData(id);

  if (!data) {
    notFound();
  }

  const balance = Number(data.summary.balance);

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 border-b pb-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <Link
            href={`/subagentes/${data.subagent.id}`}
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            ← Volver al Subagente
          </Link>
          <div className="mt-2 flex flex-wrap items-center gap-3">
            <h1 className="text-3xl font-semibold">Cuenta corriente</h1>
            <Badge variant={balance > 0 ? "warning" : "success"}>
              {balance > 0
                ? "Con deuda"
                : balance < 0
                  ? "Saldo a favor"
                  : "Al día"}
            </Badge>
          </div>
          <p className="mt-1 text-muted-foreground">
            {data.subagent.name} · Máquina {data.subagent.machine_code}
          </p>
        </div>
      </header>

      {notices.created || notices.voided ? (
        <p
          className="rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800"
          role="status"
        >
          {notices.created
            ? "El movimiento se registró correctamente."
            : "El movimiento fue anulado junto con su asiento de Caja asociado."}
        </p>
      ) : null}

      {notices.voidError ? (
        <p
          className="rounded-md border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive"
          role="alert"
        >
          {notices.voidError === "closed"
            ? "El día operativo está cerrado. Reabrilo antes de anular el movimiento."
            : "No se pudo anular el movimiento. Verificá el motivo y que la anulación no genere saldo a favor."}
        </p>
      ) : null}

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryCard
          label={balance < 0 ? "Saldo a favor" : "Saldo adeudado"}
          value={formatMoney(Math.abs(balance))}
          emphasized={balance > 0}
        />
        <SummaryCard
          label="Débitos acumulados"
          value={formatMoney(Number(data.summary.total_debits))}
        />
        <SummaryCard
          label="Créditos acumulados"
          value={formatMoney(Number(data.summary.total_credits))}
        />
        <SummaryCard
          label="Movimientos vigentes"
          value={String(data.summary.active_movements)}
        />
      </section>

      <div className="grid gap-6 xl:grid-cols-[0.85fr_1.15fr]">
        <Card className="self-start">
          <CardHeader>
            <CardTitle>Registrar movimiento</CardTitle>
          </CardHeader>
          <CardContent>
            <SubagentAccountForm
              accounts={data.accounts}
              balance={balance}
              subagentId={data.subagent.id}
              today={getArgentinaDateKey()}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Historial</CardTitle>
          </CardHeader>
          <CardContent>
            {data.movements.length ? (
              <ol className="space-y-3">
                {data.movements.map((movement) => {
                  const isVoided = movement.voided_at !== null;
                  const canVoid =
                    !isVoided && movement.related_settlement_id === null;

                  return (
                    <li
                      key={movement.id}
                      className={cn(
                        "rounded-md border p-4",
                        isVoided && "bg-muted/50 opacity-70",
                      )}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="font-medium">
                            {movementLabels[movement.type]}
                            {isVoided ? " · Anulado" : ""}
                          </p>
                          <p className="mt-1 text-xs text-muted-foreground">
                            {movement.business_day
                              ? formatDateKey(movement.business_day.date)
                              : formatDateTime(movement.created_at)}
                          </p>
                        </div>
                        <strong
                          className={
                            movement.direction === "debit"
                              ? "text-destructive"
                              : "text-emerald-700"
                          }
                        >
                          {movement.direction === "debit" ? "+" : "−"}{" "}
                          {formatMoney(Number(movement.amount))}
                        </strong>
                      </div>

                      {movement.notes ? (
                        <p className="mt-3 whitespace-pre-wrap text-sm text-muted-foreground">
                          {movement.notes}
                        </p>
                      ) : null}

                      {movement.settlement ? (
                        <Link
                          href={`/rendiciones/${movement.settlement.id}`}
                          className="mt-3 inline-block text-sm font-medium text-primary hover:underline"
                        >
                          Ver rendición del{" "}
                          {formatDateKey(movement.settlement.settlement_date)}
                        </Link>
                      ) : null}

                      {isVoided && movement.void_reason ? (
                        <p className="mt-3 text-sm">
                          Motivo de anulación: {movement.void_reason}
                        </p>
                      ) : null}

                      {canVoid ? (
                        <div className="mt-3 border-t pt-2">
                          <VoidAccountMovementForm
                            movementId={movement.id}
                            subagentId={data.subagent.id}
                          />
                        </div>
                      ) : null}
                    </li>
                  );
                })}
              </ol>
            ) : (
              <div className="py-10 text-center">
                <p className="font-medium">Todavía no hay movimientos.</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Las deudas de rendiciones y los pagos aparecerán acá.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function SummaryCard({
  emphasized = false,
  label,
  value,
}: {
  emphasized?: boolean;
  label: string;
  value: string;
}) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {label}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p
          className={cn(
            "text-2xl font-semibold",
            emphasized && "text-destructive",
          )}
        >
          {value}
        </p>
      </CardContent>
    </Card>
  );
}
