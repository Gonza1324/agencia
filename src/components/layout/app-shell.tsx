import { LogOut } from "lucide-react";

import {
  DesktopNavigation,
  MobileNavigation,
} from "@/components/layout/app-navigation";
import { logoutAction } from "@/features/auth/actions";

type AppShellProps = {
  children: React.ReactNode;
  userEmail?: string;
  userName?: string;
};

export function AppShell({ children, userEmail, userName }: AppShellProps) {
  return (
    <div className="min-h-screen bg-background">
      <a
        href="#contenido-principal"
        className="sr-only z-50 rounded-md bg-primary px-4 py-2 text-primary-foreground focus:not-sr-only focus:fixed focus:left-4 focus:top-4"
      >
        Ir al contenido
      </a>
      <aside className="fixed inset-y-0 left-0 hidden w-64 border-r bg-card px-4 py-5 lg:block">
        <div className="mb-8">
          <p className="text-xs font-semibold uppercase text-primary">
            Control Agencia
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            Caja y subagentes
          </p>
        </div>
        <DesktopNavigation />
      </aside>

      <div className="lg:pl-64">
        <header className="sticky top-0 z-10 border-b bg-card/95 px-4 py-3 backdrop-blur md:px-8">
          <div className="flex items-center justify-between gap-4">
            <div className="lg:hidden">
              <p className="text-sm font-semibold text-primary">
                Control Agencia
              </p>
            </div>
            <div className="ml-auto flex items-center gap-3">
              <div className="min-w-0 text-right">
                <p className="text-sm font-medium">
                  {userName ?? "Propietario"}
                </p>
                <p className="hidden max-w-52 truncate text-xs text-muted-foreground sm:block">
                  {userEmail}
                </p>
              </div>
              <form action={logoutAction}>
                <button
                  className="inline-flex h-9 items-center gap-2 rounded-md border px-3 text-sm font-medium transition hover:bg-muted"
                  type="submit"
                >
                  <LogOut className="h-4 w-4" aria-hidden="true" />
                  <span className="hidden sm:inline">Salir</span>
                </button>
              </form>
            </div>
          </div>
        </header>
        <main
          id="contenido-principal"
          className="px-4 py-6 pb-24 md:px-8 lg:pb-8"
        >
          {children}
        </main>
      </div>
      <MobileNavigation />
    </div>
  );
}
