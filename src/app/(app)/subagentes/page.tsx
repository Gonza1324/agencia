import Link from "next/link";
import { Plus, Search, UserRoundX, UsersRound } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { getSubagents } from "@/features/subagents/queries";
import { formatShortDate } from "@/lib/formatters";
import { cn } from "@/lib/utils";

type SubagentsPageProps = {
  searchParams: Promise<{
    q?: string;
    status?: string;
    error?: string;
  }>;
};

export default async function SubagentsPage({
  searchParams,
}: SubagentsPageProps) {
  const params = await searchParams;
  const subagents = await getSubagents();
  const normalizedSearch = params.q?.trim().toLocaleLowerCase("es-AR") ?? "";
  const statusFilter =
    params.status === "active" || params.status === "inactive"
      ? params.status
      : "all";
  const filteredSubagents = subagents.filter((subagent) => {
    const matchesStatus =
      statusFilter === "all" || subagent.status === statusFilter;
    const matchesSearch =
      !normalizedSearch ||
      subagent.name.toLocaleLowerCase("es-AR").includes(normalizedSearch) ||
      subagent.machine_code
        .toLocaleLowerCase("es-AR")
        .includes(normalizedSearch);

    return matchesStatus && matchesSearch;
  });
  const activeCount = subagents.filter(
    (subagent) => subagent.status === "active",
  ).length;
  const inactiveCount = subagents.length - activeCount;

  return (
    <div className="space-y-6">
      <header className="flex flex-col justify-between gap-4 border-b pb-5 md:flex-row md:items-end">
        <div>
          <p className="text-sm font-medium text-primary">Gestión operativa</p>
          <h1 className="mt-1 text-2xl font-semibold tracking-normal">
            Subagentes
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Personas responsables de las máquinas de lotería.
          </p>
        </div>
        <Link
          href="/subagentes/nuevo"
          className={cn(buttonVariants(), "self-start md:self-auto")}
        >
          <Plus className="h-4 w-4" aria-hidden="true" />
          Nuevo Subagente
        </Link>
      </header>

      <section className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-lg border bg-card p-4">
          <p className="text-sm text-muted-foreground">Total</p>
          <p className="mt-1 text-2xl font-semibold">{subagents.length}</p>
        </div>
        <div className="rounded-lg border bg-card p-4">
          <p className="text-sm text-muted-foreground">Activos</p>
          <p className="mt-1 text-2xl font-semibold text-emerald-700">
            {activeCount}
          </p>
        </div>
        <div className="rounded-lg border bg-card p-4">
          <p className="text-sm text-muted-foreground">Inactivos</p>
          <p className="mt-1 text-2xl font-semibold text-muted-foreground">
            {inactiveCount}
          </p>
        </div>
      </section>

      {params.error ? (
        <p
          className="rounded-md border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive"
          role="alert"
        >
          No se pudo completar la operación solicitada.
        </p>
      ) : null}

      <section className="rounded-lg border bg-card">
        <form
          className="flex flex-col gap-3 border-b p-4 md:flex-row"
          method="get"
        >
          <label className="relative flex-1">
            <span className="sr-only">Buscar Subagentes</span>
            <Search
              className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-muted-foreground"
              aria-hidden="true"
            />
            <input
              className="h-10 w-full rounded-md border bg-background pl-9 pr-3 text-sm outline-none focus:ring-2 focus:ring-ring"
              type="search"
              name="q"
              defaultValue={params.q}
              placeholder="Buscar por nombre o máquina"
            />
          </label>
          <label>
            <span className="sr-only">Filtrar por estado</span>
            <select
              className="h-10 w-full rounded-md border bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring md:w-44"
              name="status"
              defaultValue={statusFilter}
            >
              <option value="all">Todos los estados</option>
              <option value="active">Activos</option>
              <option value="inactive">Inactivos</option>
            </select>
          </label>
          <button className={buttonVariants({ variant: "secondary" })}>
            Filtrar
          </button>
        </form>

        {filteredSubagents.length ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-sm">
              <thead className="bg-muted text-left text-muted-foreground">
                <tr>
                  <th className="px-5 py-3 font-medium">Subagente</th>
                  <th className="px-5 py-3 font-medium">Máquina</th>
                  <th className="px-5 py-3 font-medium">Comisión</th>
                  <th className="px-5 py-3 font-medium">Estado</th>
                  <th className="px-5 py-3 font-medium">Fecha de alta</th>
                  <th className="px-5 py-3 text-right font-medium">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filteredSubagents.map((subagent) => (
                  <tr key={subagent.id} className="border-t">
                    <td className="px-5 py-4 font-medium">{subagent.name}</td>
                    <td className="px-5 py-4 font-mono">
                      {subagent.machine_code}
                    </td>
                    <td className="px-5 py-4 font-medium">
                      {subagent.commission_percentage}%
                    </td>
                    <td className="px-5 py-4">
                      <Badge
                        variant={
                          subagent.status === "active" ? "success" : "muted"
                        }
                      >
                        {subagent.status === "active" ? "Activo" : "Inactivo"}
                      </Badge>
                    </td>
                    <td className="px-5 py-4">
                      {formatShortDate(subagent.created_at)}
                    </td>
                    <td className="px-5 py-4 text-right">
                      <Link
                        className="font-medium text-primary hover:underline"
                        href={`/subagentes/${subagent.id}`}
                      >
                        Ver detalle
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="flex flex-col items-center px-6 py-14 text-center">
            {subagents.length ? (
              <UserRoundX
                className="h-9 w-9 text-muted-foreground"
                aria-hidden="true"
              />
            ) : (
              <UsersRound
                className="h-9 w-9 text-muted-foreground"
                aria-hidden="true"
              />
            )}
            <h2 className="mt-3 font-semibold">
              {subagents.length
                ? "No hay resultados"
                : "Todavía no hay Subagentes"}
            </h2>
            <p className="mt-1 max-w-md text-sm text-muted-foreground">
              {subagents.length
                ? "Probá cambiar la búsqueda o el filtro de estado."
                : "Creá el primer Subagente para comenzar el control diario."}
            </p>
          </div>
        )}
      </section>
    </div>
  );
}
