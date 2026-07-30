import { describe, expect, it } from "vitest";

import {
  canAccessInternalApp,
  canManageSensitiveOperation,
  canOperate,
} from "@/lib/permissions";

describe("matriz de permisos", () => {
  it("reserva la administración sensible para propietarios", () => {
    expect(canManageSensitiveOperation("owner_admin")).toBe(true);
    expect(canManageSensitiveOperation("cash_operator")).toBe(false);
    expect(canManageSensitiveOperation("viewer")).toBe(false);
  });

  it("permite operar a propietarios y operadores", () => {
    expect(canOperate("owner_admin")).toBe(true);
    expect(canOperate("cash_operator")).toBe(true);
    expect(canOperate("viewer")).toBe(false);
  });

  it("permite el panel interno a los tres roles habilitados", () => {
    expect(canAccessInternalApp("owner_admin")).toBe(true);
    expect(canAccessInternalApp("cash_operator")).toBe(true);
    expect(canAccessInternalApp("viewer")).toBe(true);
    expect(canAccessInternalApp("subagent")).toBe(false);
  });
});
