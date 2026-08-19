import Link from "next/link";
import { Plus, ReceiptText } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import {
  getMaquinolas,
  getMaquinolaSettlements,
} from "@/features/maquinolas/queries";
import { formatDateKey, formatMoney } from "@/lib/formatters";
import { cn } from "@/lib/utils";

export default async function MaquinolasPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const params = await searchParams;
  const [maquinolas, settlements] = await Promise.all([
    getMaquinolas(),
    getMaquinolaSettlements(),
  ]);
  const search = params.q?.trim().toLocaleLowerCase("es-AR") ?? "";
  const filtered = maquinolas.filter(
    (item) =>
      !search ||
      item.number.toLocaleLowerCase("es-AR").includes(search) ||
      item.subagent.name.toLocaleLowerCase("es-AR").includes(search),
  );
  const activeSettlements = settlements.filter(
    (item) => item.status !== "voided",
  );
  return (
    <div className="space-y-6">
      <header className="flex flex-col justify-between gap-4 border-b pb-5 md:flex-row md:items-end">
        <div>
          <p className="text-sm font-medium text-primary">Operación diaria</p>
          <h1 className="mt-1 text-2xl font-semibold">Maquinolas</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Asignación, cierres sin comisión y seguimiento diario.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href="/maquinolas/cierres/nuevo"
            prefetch={false}
            className={cn(buttonVariants(), "self-start")}
          >
            <ReceiptText className="h-4 w-4" />
            Nuevo cierre
          </Link>
          <Link
            href="/maquinolas/nueva"
            prefetch={false}
            className={cn(
              buttonVariants({ variant: "secondary" }),
              "self-start",
            )}
          >
            <Plus className="h-4 w-4" />
            Nueva Maquinola
          </Link>
        </div>
      </header>
      <section className="grid gap-4 md:grid-cols-3">
        <Summary
          label="Maquinolas activas"
          value={String(
            maquinolas.filter((item) => item.status === "active").length,
          )}
        />
        <Summary
          label="Cierres registrados"
          value={String(activeSettlements.length)}
        />
        <Summary
          label="Total ingresado"
          value={formatMoney(
            activeSettlements.reduce(
              (sum, item) => sum + Number(item.received_amount),
              0,
            ),
          )}
        />
      </section>
      <section className="rounded-lg border bg-card">
        <div className="border-b p-4">
          <h2 className="font-semibold">Unidades</h2>
          <form className="mt-3 flex gap-2">
            <input
              className="h-10 flex-1 rounded-md border bg-background px-3"
              type="search"
              name="q"
              defaultValue={params.q}
              placeholder="Buscar número o Subagente"
            />
            <button className={buttonVariants({ variant: "secondary" })}>
              Buscar
            </button>
          </form>
        </div>
        {filtered.length ? (
          <div className="divide-y">
            {filtered.map((item) => (
              <Link
                key={item.id}
                href={`/maquinolas/${item.id}`}
                prefetch={false}
                className="flex flex-col gap-2 p-4 hover:bg-muted/40 sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <p className="font-semibold">Maquinola {item.number}</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {item.subagent.name} · Máquina {item.subagent.machine_code}
                  </p>
                </div>
                <Badge variant={item.status === "active" ? "success" : "muted"}>
                  {item.status === "active" ? "Activa" : "Inactiva"}
                </Badge>
              </Link>
            ))}
          </div>
        ) : (
          <p className="p-8 text-center text-sm text-muted-foreground">
            No hay Maquinolas para mostrar.
          </p>
        )}
      </section>
      <section className="rounded-lg border bg-card">
        <div className="border-b p-4">
          <h2 className="font-semibold">Cierres recientes</h2>
        </div>
        {settlements.length ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[820px] text-sm">
              <thead className="bg-muted text-left text-muted-foreground">
                <tr>
                  <th className="px-4 py-3">Fecha</th>
                  <th className="px-4 py-3">Maquinola</th>
                  <th className="px-4 py-3">Subagente</th>
                  <th className="px-4 py-3 text-right">Venta</th>
                  <th className="px-4 py-3 text-right">Premios</th>
                  <th className="px-4 py-3 text-right">Recibido</th>
                  <th className="px-4 py-3">Estado</th>
                </tr>
              </thead>
              <tbody>
                {settlements.slice(0, 100).map((item) => (
                  <tr key={item.id} className="border-t">
                    <td className="px-4 py-3">
                      <Link
                        className="text-primary hover:underline"
                        href={`/maquinolas/cierres/${item.id}`}
                        prefetch={false}
                      >
                        {formatDateKey(item.settlement_date)}
                      </Link>
                    </td>
                    <td className="px-4 py-3 font-mono">
                      {item.maquinola.number}
                    </td>
                    <td className="px-4 py-3">{item.subagent.name}</td>
                    <td className="px-4 py-3 text-right">
                      {formatMoney(Number(item.sales_amount))}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {formatMoney(Number(item.prizes_paid_amount))}
                    </td>
                    <td className="px-4 py-3 text-right font-medium">
                      {formatMoney(Number(item.received_amount))}
                    </td>
                    <td className="px-4 py-3">
                      <Badge
                        variant={
                          item.status === "voided"
                            ? "muted"
                            : item.status === "settled_with_debt"
                              ? "warning"
                              : "success"
                        }
                      >
                        {item.status === "voided"
                          ? "Anulado"
                          : item.status === "settled_with_debt"
                            ? "Con deuda"
                            : "Rendido"}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="p-8 text-center text-sm text-muted-foreground">
            Todavía no hay cierres registrados.
          </p>
        )}
      </section>
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
