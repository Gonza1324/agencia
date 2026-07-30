import type { UserRole } from "@/types/domain";

export const internalUserRoles: UserRole[] = [
  "owner_admin",
  "cash_operator",
  "viewer",
];

export const operatorRoles: UserRole[] = ["owner_admin", "cash_operator"];

export function canManageSensitiveOperation(role: UserRole) {
  return role === "owner_admin";
}

export function canOperate(role: UserRole) {
  return operatorRoles.includes(role);
}

export function canAccessInternalApp(role: UserRole) {
  return internalUserRoles.includes(role);
}
