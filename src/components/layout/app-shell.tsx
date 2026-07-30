import Link from "next/link";
import {
  Banknote,
  BarChart3,
  CalendarCheck,
  LayoutDashboard,
  ReceiptText,
  Settings,
  UsersRound,
} from "lucide-react";
import { navigationItems } from "@/config/navigation";

const iconMap = {
  dashboard: LayoutDashboard,
  settlements: ReceiptText,
  subagents: UsersRound,
  cash: Banknote,
  closure: CalendarCheck,
  reports: BarChart3,
  settings: Settings,
};

type AppShellProps = {
  children: React.ReactNode;
  userEmail?: string;
};

export function AppShell({ children, userEmail }: AppShellProps) {
  return (
    <div className="min-h-screen bg-background">
      <aside className="fixed inset-y-0 left-0 hidden w-64 border-r bg-card px-4 py-5 lg:block">
        <div className="mb-8">
          <p className="text-xs font-semibold uppercase text-primary">
            Control Agencia
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            Caja y subagentes
          </p>
        </div>
        <nav className="space-y-1">
          {navigationItems.map((item) => {
            const Icon = iconMap[item.icon];

            return (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition hover:bg-muted hover:text-foreground"
              >
                <Icon className="h-4 w-4" aria-hidden="true" />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </aside>

      <div className="lg:pl-64">
        <header className="sticky top-0 z-10 border-b bg-card/95 px-4 py-3 backdrop-blur md:px-8">
          <div className="flex items-center justify-between gap-4">
            <div className="lg:hidden">
              <p className="text-sm font-semibold text-primary">Control Agencia</p>
            </div>
            <div className="ml-auto text-right">
              <p className="text-xs text-muted-foreground">Usuario</p>
              <p className="text-sm font-medium">
                {userEmail ?? "Pendiente de login"}
              </p>
            </div>
          </div>
        </header>
        <main className="px-4 py-6 md:px-8">{children}</main>
      </div>
    </div>
  );
}
