import Link from "next/link";

import { requireOwnerAdmin } from "@/features/auth/guards";
import {
  getAssignableSubagents,
  getManagedUsers,
} from "@/features/users/queries";
import { UserCreateForm } from "@/features/users/user-create-form";
import { UserManagementCard } from "@/features/users/user-management-card";

export default async function UsersPage() {
  const [{ user: currentUser }, users, subagents] = await Promise.all([
    requireOwnerAdmin(),
    getManagedUsers(),
    getAssignableSubagents(),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/configuracion"
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          ← Volver a Configuración
        </Link>
        <h1 className="mt-2 text-3xl font-semibold">Usuarios y roles</h1>
        <p className="mt-1 max-w-3xl text-muted-foreground">
          Creá accesos internos o de Subagentes, definí permisos e inactivá
          usuarios sin borrar su historial.
        </p>
      </div>

      <section className="rounded-lg border bg-card p-5">
        <h2 className="text-lg font-semibold">Nuevo usuario</h2>
        <p className="mb-5 mt-1 text-sm text-muted-foreground">
          La contraseña es temporal y debe comunicarse por un canal seguro.
        </p>
        <UserCreateForm />
      </section>

      <section className="rounded-lg border bg-muted/30 p-5">
        <h2 className="font-semibold">Permisos por rol</h2>
        <div className="mt-3 grid gap-3 text-sm md:grid-cols-2 xl:grid-cols-4">
          <div>
            <p className="font-medium">Propietario</p>
            <p className="text-muted-foreground">
              Operación completa, configuración y usuarios.
            </p>
          </div>
          <div>
            <p className="font-medium">Operador</p>
            <p className="text-muted-foreground">
              Rendiciones, Subagentes, Caja, cierres y reportes.
            </p>
          </div>
          <div>
            <p className="font-medium">Visor</p>
            <p className="text-muted-foreground">
              Solo Dashboard y Reportes, sin modificaciones.
            </p>
          </div>
          <div>
            <p className="font-medium">Subagente</p>
            <p className="text-muted-foreground">
              Solo sus máquinas, rendiciones, cuenta corriente y saldos.
            </p>
          </div>
        </div>
      </section>

      <section className="space-y-3">
        <div>
          <h2 className="text-lg font-semibold">Usuarios existentes</h2>
          <p className="text-sm text-muted-foreground">
            El historial se conserva aunque un acceso quede inactivo.
          </p>
        </div>
        {users.map((user) => (
          <UserManagementCard
            key={user.id}
            currentUserId={currentUser.id}
            user={{
              id: user.id,
              email: user.email,
              fullName: user.full_name,
              role: user.role,
              status: user.status,
            }}
            subagents={subagents}
            assignedSubagentIds={user.subagent_links
              .filter((link) => link.status === "active")
              .map((link) => link.subagent_id)}
          />
        ))}
      </section>
    </div>
  );
}
