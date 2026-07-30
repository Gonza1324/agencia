import Link from "next/link";
import { KeyRound, Tags } from "lucide-react";

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <p className="text-sm font-medium text-primary">Configuración</p>
        <h1 className="text-2xl font-semibold tracking-normal">
          Configuración
        </h1>
        <p className="max-w-2xl text-sm text-muted-foreground">
          Administrá accesos y parámetros internos de Agencia 643.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Link
          href="/configuracion/usuarios"
          className="rounded-lg border bg-card p-5 transition hover:border-primary/40 hover:shadow-sm"
        >
          <KeyRound className="h-5 w-5 text-primary" aria-hidden="true" />
          <h2 className="mt-4 font-semibold">Usuarios y roles</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Altas, contraseñas temporales, permisos y estados de acceso.
          </p>
        </Link>
        <Link
          href="/configuracion/categorias-caja"
          className="rounded-lg border bg-card p-5 transition hover:border-primary/40 hover:shadow-sm"
        >
          <Tags className="h-5 w-5 text-primary" aria-hidden="true" />
          <h2 className="mt-4 font-semibold">Categorías de Caja</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Categorías propias para ingresos, egresos, retiros y ajustes.
          </p>
        </Link>
      </div>
    </div>
  );
}
