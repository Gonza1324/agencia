import type { UserRole } from "@/types/domain";

const allStaffRoles: UserRole[] = ["owner_admin", "cash_operator", "viewer"];
const operatorRoles: UserRole[] = ["owner_admin", "cash_operator"];

export const navigationItems = [
  {
    href: "/dashboard",
    label: "Dashboard",
    icon: "dashboard",
    roles: allStaffRoles,
  },
  {
    href: "/rendiciones",
    label: "Rendiciones",
    icon: "settlements",
    roles: operatorRoles,
  },
  {
    href: "/subagentes",
    label: "Subagentes",
    icon: "subagents",
    roles: operatorRoles,
  },
  {
    href: "/caja",
    label: "Caja",
    icon: "cash",
    roles: operatorRoles,
  },
  {
    href: "/cierre-diario",
    label: "Cierre diario",
    icon: "closure",
    roles: operatorRoles,
  },
  {
    href: "/reportes",
    label: "Reportes",
    icon: "reports",
    roles: allStaffRoles,
  },
  {
    href: "/configuracion",
    label: "Configuración",
    icon: "settings",
    roles: ["owner_admin"],
  },
] as const;
