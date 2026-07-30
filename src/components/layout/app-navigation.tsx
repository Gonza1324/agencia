"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
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
import { cn } from "@/lib/utils";

const iconMap = {
  dashboard: LayoutDashboard,
  settlements: ReceiptText,
  subagents: UsersRound,
  cash: Banknote,
  closure: CalendarCheck,
  reports: BarChart3,
  settings: Settings,
};

function isActivePath(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function DesktopNavigation() {
  const pathname = usePathname();

  return (
    <nav className="space-y-1" aria-label="Navegación principal">
      {navigationItems.map((item) => {
        const Icon = iconMap[item.icon];
        const active = isActivePath(pathname, item.href);

        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition",
              active
                ? "bg-primary/10 text-primary"
                : "text-muted-foreground hover:bg-muted hover:text-foreground",
            )}
          >
            <Icon className="h-4 w-4" aria-hidden="true" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

export function MobileNavigation() {
  const pathname = usePathname();

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-30 border-t bg-card/98 pb-[env(safe-area-inset-bottom)] backdrop-blur lg:hidden"
      aria-label="Navegación móvil"
    >
      <div className="flex overflow-x-auto px-2">
        {navigationItems.map((item) => {
          const Icon = iconMap[item.icon];
          const active = isActivePath(pathname, item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex min-w-[76px] flex-1 flex-col items-center gap-1 px-2 py-2 text-[11px] font-medium",
                active ? "text-primary" : "text-muted-foreground",
              )}
            >
              <Icon className="h-5 w-5" aria-hidden="true" />
              <span className="whitespace-nowrap">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
