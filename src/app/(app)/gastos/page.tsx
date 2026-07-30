import Link from "next/link";
import { CalendarClock, Pencil, Plus, XCircle } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { payExpenseObligationAction } from "@/features/expenses/actions";
import { CancelExpenseForm } from "@/features/expenses/cancel-expense-form";
import { getExpensePageData } from "@/features/expenses/queries";
import { formatDateKey, formatMoney } from "@/lib/formatters";
import { getArgentinaDateKey } from "@/lib/operational-days";
import { cn } from "@/lib/utils";

type ExpensesPageProps = {
  searchParams: Promise<{
    created?: string;
    cancelled?: string;
    error?: string;
    paid?: string;
    status?: string;
    updated?: string;
  }>;
};

export default async function ExpensesPage({
  searchParams,
}: ExpensesPageProps) {
  const params = await searchParams;
  const { accounts, obligations } = await getExpensePageData();
  const today = getArgentinaDateKey();
  const statusFilter = ["pending", "paid", "cancelled"].includes(
    params.status ?? "",
  )
    ? params.status
    : "pending";
  const visibleObligations = obligations.filter(
    (obligation) => obligation.status === statusFilter,
  );
  const pending = obligations.filter(
    (obligation) => obligation.status === "pending",
  );
  const overdue = pending.filter((obligation) => obligation.due_date < today);
  const pendingAmount = pending.reduce(
    (total, obligation) => total + Number(obligation.amount),
    0,
  );
  const overdueAmount = overdue.reduce(
    (total, obligation) => total + Number(obligation.amount),
    0,
  );

  return (
    <div className="space-y-6">
      <header className="flex flex-col justify-between gap-4 border-b pb-5 md:flex-row md:items-end">
        <div>
          <p className="text-sm font-medium text-primary">
            Planificación de egresos
          </p>
          <h1 className="mt-1 text-2xl font-semibold">Gastos y obligaciones</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Controlá vencimientos y registrá el pago en Caja cuando corresponda.
          </p>
        </div>
        <Link href="/gastos/nuevo" className={cn(buttonVariants())}>
          <Plus className="h-4 w-4" aria-hidden="true" />
          Nueva obligación
        </Link>
      </header>

      {params.created ||
      params.paid ||
      params.updated ||
      params.cancelled ? (
        <p className="rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          {params.paid
            ? "El gasto se pagó y se descontó de Caja correctamente."
            : params.updated
              ? "La obligación se actualizó correctamente."
              : params.cancelled
                ? "La obligación se canceló y quedó guardada en el historial."
                : "La obligación se creó correctamente."}
        </p>
      ) : null}
      {params.error ? (
        <p className="rounded-md border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {params.error === "balance"
            ? "La cuenta seleccionada no tiene saldo suficiente."
            : params.error === "closed"
              ? "El día operativo está cerrado."
              : "No se pudo completar la operación."}
        </p>
      ) : null}

      <section className="grid gap-4 sm:grid-cols-3">
        <Metric label="Pendiente total" value={formatMoney(pendingAmount)} />
        <Metric
          label="Vencido"
          value={formatMoney(overdueAmount)}
          danger={overdue.length > 0}
        />
        <Metric
          label="Obligaciones pendientes"
          value={String(pending.length)}
        />
      </section>

      <section className="rounded-lg border bg-card">
        <form className="flex gap-3 border-b p-4" method="get">
          <select
            className="h-10 rounded-md border bg-background px-3 text-sm"
            name="status"
            defaultValue={statusFilter}
          >
            <option value="pending">Pendientes</option>
            <option value="paid">Pagadas</option>
            <option value="cancelled">Canceladas</option>
          </select>
          <button className={buttonVariants({ variant: "secondary" })}>
            Filtrar
          </button>
        </form>

        {visibleObligations.length ? (
          <div className="divide-y">
            {visibleObligations.map((obligation) => {
              const isOverdue =
                obligation.status === "pending" && obligation.due_date < today;

              return (
                <article
                  key={obligation.id}
                  className="grid gap-4 p-5 lg:grid-cols-[1fr_auto] lg:items-center"
                >
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="font-semibold">
                        {obligation.description}
                      </h2>
                      <Badge
                        variant={
                          isOverdue
                            ? "danger"
                            : obligation.status === "paid"
                              ? "success"
                              : obligation.status === "cancelled"
                                ? "muted"
                                : "warning"
                        }
                      >
                        {isOverdue
                          ? "Vencido"
                          : obligation.status === "paid"
                            ? "Pagado"
                            : obligation.status === "cancelled"
                              ? "Cancelado"
                              : "Pendiente"}
                      </Badge>
                      {obligation.recurrence_months ? (
                        <Badge variant="muted">
                          Cada {obligation.recurrence_months} mes
                          {obligation.recurrence_months === 1 ? "" : "es"}
                        </Badge>
                      ) : null}
                    </div>
                    <p className="mt-2 text-sm text-muted-foreground">
                      {obligation.category.name} · Vence{" "}
                      {formatDateKey(obligation.due_date)}
                    </p>
                    {obligation.notes ? (
                      <p className="mt-2 text-sm">{obligation.notes}</p>
                    ) : null}
                    {obligation.status === "cancelled" &&
                    obligation.cancellation_reason ? (
                      <p className="mt-2 text-sm text-muted-foreground">
                        Motivo: {obligation.cancellation_reason}
                      </p>
                    ) : null}
                  </div>
                  <div className="flex flex-col items-end gap-3">
                    <strong className="text-xl">
                      {formatMoney(Number(obligation.amount))}
                    </strong>
                    {obligation.status === "pending" ? (
                      <>
                        <form
                          action={payExpenseObligationAction}
                          className="flex flex-wrap justify-end gap-2"
                        >
                          <input
                            type="hidden"
                            name="obligationId"
                            value={obligation.id}
                          />
                          <input
                            type="hidden"
                            name="businessDate"
                            value={today}
                          />
                          <select
                            className="h-9 rounded-md border bg-background px-2 text-sm"
                            name="cashAccountId"
                            defaultValue=""
                            required
                          >
                            <option value="" disabled>
                              Cuenta de pago
                            </option>
                            {accounts.map((account) => (
                              <option key={account.id} value={account.id}>
                                {account.name}
                              </option>
                            ))}
                          </select>
                          <button className={buttonVariants({ size: "sm" })}>
                            Marcar pagado
                          </button>
                        </form>
                        <div className="flex items-start justify-end gap-2">
                          <Link
                            href={`/gastos/${obligation.id}/editar`}
                            className={cn(
                              buttonVariants({
                                size: "sm",
                                variant: "secondary",
                              }),
                            )}
                          >
                            <Pencil className="h-4 w-4" aria-hidden="true" />
                            Editar
                          </Link>
                          <details className="relative">
                            <summary
                              className={cn(
                                buttonVariants({
                                  size: "sm",
                                  variant: "secondary",
                                }),
                                "cursor-pointer list-none text-destructive",
                              )}
                            >
                              <XCircle
                                className="h-4 w-4"
                                aria-hidden="true"
                              />
                              Cancelar
                            </summary>
                            <CancelExpenseForm id={obligation.id} />
                          </details>
                        </div>
                      </>
                    ) : obligation.paid_account ? (
                      <p className="text-sm text-muted-foreground">
                        Pagado desde {obligation.paid_account.name}
                      </p>
                    ) : null}
                  </div>
                </article>
              );
            })}
          </div>
        ) : (
          <div className="px-6 py-14 text-center">
            <CalendarClock className="mx-auto h-9 w-9 text-muted-foreground" />
            <h2 className="mt-3 font-semibold">
              No hay obligaciones en este estado
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Creá una obligación para comenzar a organizar los vencimientos.
            </p>
          </div>
        )}
      </section>
    </div>
  );
}

function Metric({
  danger = false,
  label,
  value,
}: {
  danger?: boolean;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-lg border bg-card p-4">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p
        className={cn(
          "mt-1 text-2xl font-semibold",
          danger && "text-destructive",
        )}
      >
        {value}
      </p>
    </div>
  );
}
