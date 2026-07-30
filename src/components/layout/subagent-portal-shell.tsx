import { LogOut, ShieldCheck, UserRound } from "lucide-react";

import { Button } from "@/components/ui/button";
import { logoutAction } from "@/features/auth/actions";

export function SubagentPortalShell({
  children,
  email,
  name,
}: {
  children: React.ReactNode;
  email?: string;
  name: string;
}) {
  return (
    <div className="min-h-screen bg-muted/30">
      <header className="border-b bg-card">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-primary">
              Control Agencia
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              Portal de Subagentes · Agencia 643
            </p>
          </div>
          <div className="flex items-center justify-between gap-4 sm:justify-end">
            <div className="flex min-w-0 items-center gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                <UserRound className="h-4 w-4" aria-hidden="true" />
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold">{name}</p>
                <p className="truncate text-xs text-muted-foreground">
                  {email}
                </p>
              </div>
            </div>
            <form action={logoutAction}>
              <Button type="submit" size="sm" variant="secondary">
                <LogOut className="h-4 w-4" aria-hidden="true" />
                Salir
              </Button>
            </form>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl space-y-6 px-4 py-6 sm:px-6 sm:py-8">
        <div className="flex items-start gap-3 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-emerald-900">
          <ShieldCheck
            className="mt-0.5 h-5 w-5 shrink-0"
            aria-hidden="true"
          />
          <p className="text-sm">
            Este acceso es de solo lectura. La Agencia administra las
            rendiciones y los movimientos mostrados.
          </p>
        </div>
        {children}
      </main>
    </div>
  );
}
