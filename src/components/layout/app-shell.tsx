import { LogOut, UserRound } from "lucide-react";

import {
  DesktopNavigation,
  MobileNavigation,
} from "@/components/layout/app-navigation";
import { Button } from "@/components/ui/button";
import { logoutAction } from "@/features/auth/actions";
import type { UserRole } from "@/types/domain";

type AppShellProps = {
  children: React.ReactNode;
  userEmail?: string;
  userName?: string;
  userRole: UserRole;
};

const roleLabels: Record<UserRole, string> = {
  owner_admin: "Propietario",
  cash_operator: "Operador",
  viewer: "Visor",
  subagent: "Subagente",
};

export function AppShell({
  children,
  userEmail,
  userName,
  userRole,
}: AppShellProps) {
  return (
    <div className="min-h-screen bg-background">
      <a
        href="#contenido-principal"
        className="sr-only z-50 rounded-md bg-primary px-4 py-2 text-primary-foreground focus:not-sr-only focus:fixed focus:left-4 focus:top-4"
      >
        Ir al contenido
      </a>
      <aside className="fixed inset-y-0 left-0 hidden w-64 flex-col border-r bg-card px-4 py-5 lg:flex">
        <div className="mb-8">
          <p className="text-xs font-semibold uppercase text-primary">
            Control Agencia
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            Caja y subagentes
          </p>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto">
          <DesktopNavigation userRole={userRole} />
        </div>

        <div className="mt-4 rounded-xl border bg-muted/40 p-3 shadow-sm">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
              <UserRound className="h-4 w-4" aria-hidden="true" />
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold">
                {userName ?? "Propietario"}
              </p>
              <p className="text-[11px] font-medium text-primary">
                {roleLabels[userRole]}
              </p>
              <p
                className="truncate text-xs text-muted-foreground"
                title={userEmail}
              >
                {userEmail}
              </p>
            </div>
          </div>
          <form action={logoutAction} className="mt-3">
            <Button
              className="w-full"
              type="submit"
              variant="secondary"
              size="sm"
            >
              <LogOut className="h-4 w-4" aria-hidden="true" />
              Salir
            </Button>
          </form>
        </div>
      </aside>

      <div className="lg:pl-64">
        <main
          id="contenido-principal"
          className="px-4 py-6 pb-24 md:px-8 lg:pb-8"
        >
          {children}
        </main>
      </div>
      <MobileNavigation logoutAction={logoutAction} userRole={userRole} />
    </div>
  );
}
