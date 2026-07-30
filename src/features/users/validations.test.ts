import { describe, expect, it } from "vitest";

import {
  createUserSchema,
  resetUserPasswordSchema,
  updateUserSchema,
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

  it("no permite asignar el rol Subagente desde la administración interna", () => {
    expect(
      createUserSchema.safeParse({
        email: "subagente@agencia.com",
        fullName: "Subagente",
        role: "subagent",
        temporaryPassword: "Temporal643!",
      }).success,
    ).toBe(false);
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
});
