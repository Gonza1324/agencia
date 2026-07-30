import type { UserRole } from "@/types/domain";

const sensitiveRoles: UserRole[] = ["owner_admin"];

export function canManageSensitiveOperation(role: UserRole) {
  return sensitiveRoles.includes(role);
}
