import { describe, expect, it } from "vitest";

import {
  createUserSchema,
  resetUserPasswordSchema,
  subagentAssignmentsSchema,
  updateUserSchema,
  userAlertPreferencesSchema,
} from "@/features/users/validations";

describe("validaciones de usuarios", () => {
  it("acepta un usuario interno con contraseña temporal segura", () => {
    expect(
      createUserSchema.safeParse({
        email: "operador@agencia.com",
        fullName: "Operador Agencia",
        role: "cash_operator",
        temporaryPassword: "Temporal643!",
      }).success,
    ).toBe(true);
  });

  it("permite crear un acceso de Subagente", () => {
    expect(
      createUserSchema.safeParse({
        email: "subagente@agencia.com",
        fullName: "Subagente",
        role: "subagent",
        temporaryPassword: "Temporal643!",
      }).success,
    ).toBe(true);
  });

  it("rechaza contraseñas temporales débiles", () => {
    expect(
      resetUserPasswordSchema.safeParse({
        id: "439f5dc7-c91d-471b-a4e6-66e041035df8",
        temporaryPassword: "solamenteletras",
      }).success,
    ).toBe(false);
  });

  it("valida cambios de rol y estado", () => {
    expect(
      updateUserSchema.safeParse({
        id: "439f5dc7-c91d-471b-a4e6-66e041035df8",
        fullName: "Usuario Visor",
        role: "viewer",
        status: "inactive",
      }).success,
    ).toBe(true);
  });

  it("valida las máquinas asignadas a un usuario", () => {
    expect(
      subagentAssignmentsSchema.safeParse({
        userId: "439f5dc7-c91d-471b-a4e6-66e041035df8",
        subagentIds: [
          "11111111-1111-4111-8111-111111111111",
          "22222222-2222-4222-8222-222222222222",
        ],
      }).success,
    ).toBe(true);
  });

  it("valida preferencias de alertas de atraso", () => {
    expect(
      userAlertPreferencesSchema.safeParse({
        userId: "439f5dc7-c91d-471b-a4e6-66e041035df8",
        overdueAlertsEnabled: true,
        overdueMinDays: "3",
      }).success,
    ).toBe(true);

    expect(
      userAlertPreferencesSchema.safeParse({
        userId: "439f5dc7-c91d-471b-a4e6-66e041035df8",
        overdueAlertsEnabled: true,
        overdueMinDays: "31",
      }).success,
    ).toBe(false);
  });
});
