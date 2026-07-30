import Link from "next/link";
import { notFound } from "next/navigation";

import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getSubagentAccountSummary } from "@/features/subagent-accounts/queries";
import { SubagentStatusForm } from "@/features/subagents/subagent-status-form";
import {
  getSubagentAuditLog,
  getSubagentById,
} from "@/features/subagents/queries";
import { formatDateTime, formatMoney } from "@/lib/formatters";
import { cn } from "@/lib/utils";

type SubagentDetailPageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{
    created?: string;
    updated?: string;
    status?: string;
    statusError?: string;
  }>;
};

const auditActionLabels: Record<string, string> = {
  create_subagent: "Subagente creado",
  edit_subagent: "Datos actualizados",
  activate_subagent: "Subagente activado",
  inactivate_subagent: "Subagente inactivado",
};

export default async function SubagentDetailPage({
  params,
  searchParams,
}: SubagentDetailPageProps) {
  const { id } = await params;
  const notices = await searchParams;
  const [subagent, auditLog, accountSummary] = await Promise.all([
    getSubagentById(id),
    getSubagentAuditLog(id),
    getSubagentAccountSummary(id),
  ]);

  if (!subagent) {
    notFound();
  }

  const successMessage = notices.created
    ? "El subagente se creó correctamente."
    : notices.updated
      ? "Los datos se actualizaron correctamente."
      : notices.status
        ? "El estado se actualizó correctamente."
        : null;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-2">
          <Link
            href="/subagentes"
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            ← Volver a subagentes
          </Link>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-3xl font-semibold tracking-tight">
              {subagent.name}
            </h1>
            <Badge variant={subagent.status === "active" ? "success" : "muted"}>
              {subagent.status === "active" ? "Activo" : "Inactivo"}
            </Badge>
          </div>
          <p className="text-muted-foreground">
            Código de máquina: {subagent.machine_code}
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Link
            href={`/subagentes/${subagent.id}/cuenta-corriente`}
            className={cn(buttonVariants())}
          >
            Cuenta corriente
          </Link>
          <Link
            href={`/subagentes/${subagent.id}/editar`}
            className={cn(buttonVariants({ variant: "secondary" }))}
          >
            Editar
          </Link>
          <SubagentStatusForm
            id={subagent.id}
            name={subagent.name}
            status={subagent.status}
          />
        </div>
      </div>

      {successMessage ? (
        <div
          className="rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800"
          role="status"
        >
          {successMessage}
        </div>
      ) : null}

      {notices.statusError ? (
        <div
          className="rounded-md border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive"
          role="alert"
        >
          No se pudo actualizar el estado. Volvé a intentarlo.
        </div>
      ) : null}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Código de máquina
            </CardTitle>
          </CardHeader>
          <CardContent className="text-xl font-semibold">
            {subagent.machine_code}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Comisión
            </CardTitle>
          </CardHeader>
          <CardContent className="text-xl font-semibold">
            {subagent.commission_percentage}%
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Saldo
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xl font-semibold">
              {formatMoney(Math.abs(Number(accountSummary?.balance ?? 0)))}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              {Number(accountSummary?.balance ?? 0) > 0
                ? "Deuda vigente del Subagente."
                : Number(accountSummary?.balance ?? 0) < 0
                  ? "Saldo a favor del Subagente."
                  : "Sin deuda vigente."}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Última actualización
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm font-medium">
            {formatDateTime(subagent.updated_at)}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <Card>
          <CardHeader>
            <CardTitle>Información</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="grid gap-5 sm:grid-cols-2">
              <div>
                <dt className="text-sm text-muted-foreground">Nombre</dt>
                <dd className="mt-1 font-medium">{subagent.name}</dd>
              </div>
              <div>
                <dt className="text-sm text-muted-foreground">
                  Código de máquina
                </dt>
                <dd className="mt-1 font-medium">{subagent.machine_code}</dd>
              </div>
              <div>
                <dt className="text-sm text-muted-foreground">
                  Comisión sobre ventas
                </dt>
                <dd className="mt-1 font-medium">
                  {subagent.commission_percentage}%
                </dd>
              </div>
              <div className="sm:col-span-2">
                <dt className="text-sm text-muted-foreground">Notas</dt>
                <dd className="mt-1 whitespace-pre-wrap">
                  {subagent.notes || "Sin notas."}
                </dd>
              </div>
            </dl>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Actividad reciente</CardTitle>
          </CardHeader>
          <CardContent>
            {auditLog.length ? (
              <ol className="space-y-4">
                {auditLog.map((entry) => (
                  <li key={entry.id} className="border-l-2 border-border pl-4">
                    <p className="text-sm font-medium">
                      {auditActionLabels[entry.action] ?? entry.action}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {formatDateTime(entry.created_at)}
                    </p>
                  </li>
                ))}
              </ol>
            ) : (
              <p className="text-sm text-muted-foreground">
                Todavía no hay actividad registrada.
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
