import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DailyClosureForm } from "@/features/daily-closure/daily-closure-form";
import { getDailyClosureData } from "@/features/daily-closure/queries";
import { ReopenBusinessDayForm } from "@/features/daily-closure/reopen-business-day-form";
import { formatDateKey, formatDateTime, formatMoney } from "@/lib/formatters";
import { getArgentinaDateKey } from "@/lib/operational-days";
import { cn } from "@/lib/utils";

type DailyClosurePageProps = {
  searchParams: Promise<{
    closed?: string;
    date?: string;
    reopened?: string;
  }>;
};

export default async function DailyClosurePage({
  searchParams,
}: DailyClosurePageProps) {
  const notices = await searchParams;
  const data = await getDailyClosureData(notices.date);
  const { closure, summary } = data;
  const isSunday = new Date(`${data.businessDate}T12:00:00Z`).getUTCDay() === 0;
  const isClosed = closure?.status === "closed";
  const wasReopened = closure?.status === "reopened";

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 border-b pb-5 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-sm font-medium text-primary">Cierre diario</p>
          <div className="mt-1 flex flex-wrap items-center gap-3">
            <h1 className="text-3xl font-semibold tracking-tight">
              {formatDateKey(data.businessDate)}
            </h1>
            <Badge
              variant={isSunday ? "muted" : isClosed ? "success" : "warning"}
            >
              {isSunday
                ? "Día no operativo"
                : isClosed
                  ? "Cerrado"
                  : wasReopened
                    ? "Reabierto"
                    : "Abierto"}
            </Badge>
          </div>
          <p className="mt-2 text-sm text-muted-foreground">
            Compará los saldos esperados con el efectivo contado y el banco
            informado.
          </p>
        </div>

        <form className="flex items-end gap-2">
          <label>
            <span className="block text-xs font-medium text-muted-foreground">
              Fecha
            </span>
            <input
              className="mt-1 h-10 rounded-md border bg-background px-3 text-sm"
              type="date"
              name="date"
              defaultValue={data.businessDate}
              max={getArgentinaDateKey()}
            />
          </label>
          <button
            className="h-10 rounded-md border bg-card px-4 text-sm font-medium hover:bg-muted"
            type="submit"
          >
            Ver día
          </button>
        </form>
      </header>

      {notices.closed || notices.reopened ? (
        <p
          className="rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800"
          role="status"
        >
          {notices.closed
            ? "El día se cerró correctamente. Sus movimientos quedaron bloqueados."
            : "El día se reabrió y vuelve a aceptar movimientos."}
        </p>
      ) : null}

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryCard
          label="Efectivo esperado"
          value={formatMoney(Number(summary.expected_cash_amount))}
        />
        <SummaryCard
          label="Banco esperado"
          value={formatMoney(Number(summary.expected_bank_amount))}
        />
        <SummaryCard
          label="Ingresos del día"
          value={formatMoney(Number(summary.total_income))}
        />
        <SummaryCard
          label="Total disponible"
          value={formatMoney(Number(summary.total_available))}
        />
      </section>

      <section className="grid gap-4 sm:grid-cols-2">
        <SummaryCard
          label="Egresos del día"
          value={formatMoney(Number(summary.total_expense))}
        />
        <SummaryCard
          label="Retiros del día"
          value={formatMoney(Number(summary.total_withdrawals))}
        />
      </section>

      {isSunday ? (
        <Card>
          <CardContent className="py-12 text-center">
            <h2 className="text-lg font-semibold">Domingo sin operación</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Los domingos no se abre ni se cierra un día operativo.
            </p>
          </CardContent>
        </Card>
      ) : isClosed && closure ? (
        <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
          <Card>
            <CardHeader>
              <CardTitle>Arqueo registrado</CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="grid gap-4 sm:grid-cols-2">
                <ClosureAmount
                  label="Efectivo contado"
                  amount={Number(closure.counted_cash_amount)}
                  difference={Number(closure.cash_difference)}
                />
                <ClosureAmount
                  label="Banco informado"
                  amount={Number(closure.reported_bank_amount)}
                  difference={Number(closure.bank_difference)}
                />
              </div>
              <dl className="grid gap-4 border-t pt-5 sm:grid-cols-2">
                <div>
                  <dt className="text-sm text-muted-foreground">Cerrado por</dt>
                  <dd className="mt-1 font-medium">
                    {closure.closed_by_profile?.full_name ?? "Usuario dueño"}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm text-muted-foreground">
                    Fecha y hora
                  </dt>
                  <dd className="mt-1 font-medium">
                    {formatDateTime(closure.closed_at)}
                  </dd>
                </div>
                <div className="sm:col-span-2">
                  <dt className="text-sm text-muted-foreground">
                    Nota de cierre
                  </dt>
                  <dd className="mt-1 whitespace-pre-wrap">
                    {closure.note || "Sin observaciones."}
                  </dd>
                </div>
              </dl>
            </CardContent>
          </Card>

          <Card className="self-start">
            <CardHeader>
              <CardTitle>Reabrir día</CardTitle>
            </CardHeader>
            <CardContent>
              <ReopenBusinessDayForm businessDate={data.businessDate} />
            </CardContent>
          </Card>
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
          <Card>
            <CardHeader>
              <CardTitle>
                {wasReopened ? "Volver a cerrar el día" : "Registrar arqueo"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <DailyClosureForm
                businessDate={data.businessDate}
                expectedBank={Number(summary.expected_bank_amount)}
                expectedCash={Number(summary.expected_cash_amount)}
              />
            </CardContent>
          </Card>

          <Card className="self-start">
            <CardHeader>
              <CardTitle>Reglas del cierre</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-muted-foreground">
              <p>
                El saldo esperado se calcula desde todos los movimientos
                vigentes hasta esta fecha.
              </p>
              <p>
                Si el efectivo o el banco no coinciden, es obligatorio explicar
                el motivo.
              </p>
              <p>
                Una vez cerrado, el día no aceptará nuevas rendiciones ni
                movimientos hasta que un dueño lo reabra.
              </p>
              {wasReopened && closure ? (
                <div className="rounded-md border border-amber-200 bg-amber-50 p-3 text-amber-900">
                  <p className="font-medium">Última reapertura</p>
                  <p className="mt-1">{closure.reopen_reason}</p>
                  {closure.reopened_at ? (
                    <p className="mt-1 text-xs">
                      {formatDateTime(closure.reopened_at)}
                      {closure.reopened_by_profile?.full_name
                        ? ` · ${closure.reopened_by_profile.full_name}`
                        : ""}
                    </p>
                  ) : null}
                </div>
              ) : null}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

function SummaryCard({ label, value }: { label: string; value: string }) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {label}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-2xl font-semibold">{value}</p>
      </CardContent>
    </Card>
  );
}

function ClosureAmount({
  amount,
  difference,
  label,
}: {
  amount: number;
  difference: number;
  label: string;
}) {
  return (
    <div className="rounded-md border p-4">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="mt-1 text-2xl font-semibold">{formatMoney(amount)}</p>
      <p
        className={cn(
          "mt-2 text-sm",
          difference === 0 ? "text-emerald-700" : "font-medium text-amber-700",
        )}
      >
        Diferencia: {formatMoney(difference)}
      </p>
    </div>
  );
}
