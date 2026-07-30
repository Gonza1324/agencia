import { AlertTriangle, Banknote, CalendarDays, CircleDollarSign } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { MetricCard } from "@/components/ui/metric-card";
import { formatMoney } from "@/lib/formatters";
import { getOperationalDateLabel, isWorkingDay } from "@/lib/operational-days";

const mockRows = [
  {
    name: "Subagente ejemplo",
    machineCode: "M-001",
    status: "Pendiente hoy",
    delayDays: 0,
    receivedToday: 0,
    balance: 0,
    lastSettlement: "Sin datos",
  },
];

export default function DashboardPage() {
  const today = new Date();
  const workingDay = isWorkingDay(today);

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-3 border-b pb-5 md:flex-row md:items-end">
        <div>
          <p className="text-sm font-medium text-primary">Dashboard diario</p>
          <h1 className="mt-1 text-2xl font-semibold tracking-normal">
            {getOperationalDateLabel(today)}
          </h1>
        </div>
        <Badge variant={workingDay ? "success" : "muted"}>
          {workingDay ? "Día operativo" : "Domingo sin operación"}
        </Badge>
      </div>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          icon={CalendarDays}
          label="Subagentes activos"
          value="0"
          helper="Se cargan en Fase 1.3"
        />
        <MetricCard
          icon={CircleDollarSign}
          label="Ingresado hoy"
          value={formatMoney(0)}
          helper="Efectivo y banco"
        />
        <MetricCard
          icon={Banknote}
          label="Caja disponible"
          value={formatMoney(0)}
          helper="Calculada por movimientos"
        />
        <MetricCard
          icon={AlertTriangle}
          label="Alertas"
          value="0"
          helper="Atrasos y diferencias"
        />
      </section>

      <section className="rounded-lg border bg-card">
        <div className="flex items-center justify-between border-b px-5 py-4">
          <div>
            <h2 className="font-semibold">Estado de subagentes</h2>
            <p className="text-sm text-muted-foreground">
              Base preparada para pendientes, rendidos y atrasados.
            </p>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[820px] text-sm">
            <thead className="bg-muted text-left text-muted-foreground">
              <tr>
                <th className="px-5 py-3 font-medium">Subagente</th>
                <th className="px-5 py-3 font-medium">Máquina</th>
                <th className="px-5 py-3 font-medium">Estado</th>
                <th className="px-5 py-3 font-medium">Días atraso</th>
                <th className="px-5 py-3 font-medium">Ingresó hoy</th>
                <th className="px-5 py-3 font-medium">Saldo pendiente</th>
                <th className="px-5 py-3 font-medium">Última rendición</th>
              </tr>
            </thead>
            <tbody>
              {mockRows.map((row) => (
                <tr key={row.machineCode} className="border-t">
                  <td className="px-5 py-4 font-medium">{row.name}</td>
                  <td className="px-5 py-4">{row.machineCode}</td>
                  <td className="px-5 py-4">
                    <Badge variant="warning">{row.status}</Badge>
                  </td>
                  <td className="px-5 py-4">{row.delayDays}</td>
                  <td className="px-5 py-4">{formatMoney(row.receivedToday)}</td>
                  <td className="px-5 py-4">{formatMoney(row.balance)}</td>
                  <td className="px-5 py-4">{row.lastSettlement}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
