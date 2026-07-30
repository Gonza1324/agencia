import Link from "next/link";
import { notFound } from "next/navigation";

import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { getSettlementById } from "@/features/settlements/queries";
import { VoidSettlementForm } from "@/features/settlements/void-settlement-form";
import { formatDateKey, formatDateTime, formatMoney } from "@/lib/formatters";
import { cn } from "@/lib/utils";

type SettlementDetailPageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{
    created?: string;
    updated?: string;
    voided?: string;
  }>;
};

export default async function SettlementDetailPage({
  params,
  searchParams,
}: SettlementDetailPageProps) {
  const { id } = await params;
  const notices = await searchParams;
  const settlement = await getSettlementById(id);

  if (!settlement) {
    notFound();
  }

  const activePayments = settlement.payments.filter(
    (payment) => payment.voided_at === null,
  );
  const displayedPayments =
    settlement.status === "voided" ? settlement.payments : activePayments;

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 border-b pb-5 md:flex-row md:items-end md:justify-between">
        <div>
          <Link
            href="/rendiciones"
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            ← Volver a rendiciones
          </Link>
          <h1 className="mt-2 text-3xl font-semibold">
            {settlement.subagent.name}
          </h1>
          <p className="mt-1 text-muted-foreground">
            {formatDateKey(settlement.settlement_date)} · Máquina{" "}
            {settlement.subagent.machine_code}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Badge
            variant={
              settlement.status === "settled"
                ? "success"
                : settlement.status === "voided"
                  ? "muted"
                  : "warning"
            }
          >
            {settlement.status === "settled"
              ? "Rendida"
              : settlement.status === "settled_with_debt"
                ? "Rendida con deuda"
                : "Anulada"}
          </Badge>
          {settlement.status !== "voided" ? (
            <Link
              href={`/rendiciones/${settlement.id}/editar`}
              className={cn(buttonVariants({ variant: "secondary" }))}
            >
              Corregir
            </Link>
          ) : null}
        </div>
      </header>

      {notices.created || notices.updated || notices.voided ? (
        <p className="rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          {notices.created
            ? "La rendición se registró correctamente."
            : notices.updated
              ? "La corrección se registró como una nueva versión."
              : "La rendición y sus movimientos fueron anulados."}
        </p>
      ) : null}

      <section className="grid gap-4 md:grid-cols-3">
        <Summary
          label="Importe recibido"
          value={formatMoney(Number(settlement.received_amount))}
        />
        <Summary
          label="Importe esperado"
          value={
            settlement.expected_amount === null
              ? "No informado"
              : formatMoney(Number(settlement.expected_amount))
          }
        />
        <Summary
          label="Deuda generada"
          value={formatMoney(Number(settlement.debt_amount))}
        />
        {Number(settlement.credit_balance_amount) > 0 ? (
          <Summary
            label="Saldo a favor generado"
            value={formatMoney(Number(settlement.credit_balance_amount))}
          />
        ) : null}
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-lg border bg-card p-6">
          <h2 className="text-xl font-semibold">Detalle del cierre</h2>
          <dl className="mt-5 grid gap-4 sm:grid-cols-2">
            <Detail label="Venta" value={settlement.sales_amount} />
            <Detail
              label={`Comisión${
                settlement.commission_percentage === null
                  ? ""
                  : ` (${settlement.commission_percentage}%)`
              }`}
              value={settlement.commission_amount}
            />
            <Detail
              label="Premios pagados"
              value={settlement.prizes_paid_amount}
            />
            <Detail
              label="Registrada"
              text={formatDateTime(settlement.created_at)}
            />
            <div className="sm:col-span-2">
              <dt className="text-sm text-muted-foreground">Observaciones</dt>
              <dd className="mt-1 whitespace-pre-wrap">
                {settlement.notes || "Sin observaciones."}
              </dd>
            </div>
          </dl>
        </section>

        <section className="rounded-lg border bg-card p-6">
          <h2 className="text-xl font-semibold">Medios de pago</h2>
          {displayedPayments.length ? (
            <ul className="mt-5 space-y-3">
              {displayedPayments.map((payment) => (
                <li
                  key={payment.id}
                  className="flex items-center justify-between rounded-md border p-3"
                >
                  <span>
                    {payment.method === "cash" ? "Efectivo" : "Transferencia"}
                    {payment.voided_at ? " (anulado)" : ""}
                  </span>
                  <strong>{formatMoney(Number(payment.amount))}</strong>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-5 rounded-md border bg-muted/50 p-4 text-sm text-muted-foreground">
              Sin ingreso: el importe esperado de esta rendición fue $0.
            </p>
          )}
        </section>
      </div>

      {settlement.status !== "voided" ? (
        <VoidSettlementForm id={settlement.id} />
      ) : (
        <section className="rounded-lg border bg-muted p-5">
          <h2 className="font-semibold">Rendición anulada</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Motivo: {settlement.void_reason}
          </p>
        </section>
      )}
    </div>
  );
}

function Summary({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border bg-card p-5">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="mt-1 text-2xl font-semibold">{value}</p>
    </div>
  );
}

function Detail({
  label,
  text,
  value,
}: {
  label: string;
  text?: string;
  value?: number | null;
}) {
  return (
    <div>
      <dt className="text-sm text-muted-foreground">{label}</dt>
      <dd className="mt-1 font-medium">
        {text ?? (value === null ? "No informado" : formatMoney(Number(value)))}
      </dd>
    </div>
  );
}
