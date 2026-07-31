import { z } from "zod";

export const manageableUserRoleSchema = z.enum([
  "owner_admin",
  "cash_operator",
  "subagent",
  "viewer",
]);

const fullNameSchema = z
  .string()
  .trim()
  .min(2, "Ingresá el nombre completo.")
  .max(120, "El nombre es demasiado largo.");

const temporaryPasswordSchema = z
  .string()
  .min(10, "La contraseña debe tener al menos 10 caracteres.")
  .max(72, "La contraseña es demasiado larga.")
  .regex(/[a-z]/, "Debe incluir al menos una minúscula.")
  .regex(/[A-Z]/, "Debe incluir al menos una mayúscula.")
  .regex(/[0-9]/, "Debe incluir al menos un número.");

export const createUserSchema = z.object({
  email: z
    .string()
    .trim()
    .toLowerCase()
    .email("Ingresá un email válido.")
    .max(254),
  fullName: fullNameSchema,
  role: manageableUserRoleSchema,
  temporaryPassword: temporaryPasswordSchema,
});

export const updateUserSchema = z.object({
  id: z.string().uuid("El usuario no es válido."),
  fullName: fullNameSchema,
  role: manageableUserRoleSchema,
  status: z.enum(["active", "inactive"]),
});

export const resetUserPasswordSchema = z.object({
  id: z.string().uuid("El usuario no es válido."),
  temporaryPassword: temporaryPasswordSchema,
});

export const subagentAssignmentsSchema = z.object({
  userId: z.string().uuid("El usuario no es válido."),
  subagentIds: z.array(z.string().uuid("La máquina no es válida.")).max(50),
});

export const userAlertPreferencesSchema = z.object({
  userId: z.string().uuid("El usuario no es válido."),
  overdueAlertsEnabled: z.boolean(),
  overdueMinDays: z.coerce
    .number()
    .int()
    .min(1, "El aviso debe comenzar desde 1 día de atraso.")
    .max(30, "El aviso no puede superar los 30 días de atraso."),
});
