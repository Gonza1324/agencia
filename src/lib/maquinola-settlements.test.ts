import { describe, expect, it } from "vitest";

import { calculateMaquinolaSettlement } from "@/lib/maquinola-settlements";

describe("calculateMaquinolaSettlement", () => {
  it("resta premios sin comisión", () => {
    expect(calculateMaquinolaSettlement(100_000, 30_000, 70_000)).toEqual({
      debtAmount: 0,
      expectedAmount: 70_000,
      overpaymentCreditAmount: 0,
      prizeCreditAmount: 0,
    });
  });

  it("genera deuda cuando entrega menos", () => {
    expect(calculateMaquinolaSettlement(100_000, 20_000, 50_000).debtAmount).toBe(
      30_000,
    );
  });

  it("suma crédito por premios y por pago excedente", () => {
    expect(calculateMaquinolaSettlement(100_000, 120_000, 10_000)).toEqual({
      debtAmount: 0,
      expectedAmount: 0,
      overpaymentCreditAmount: 10_000,
      prizeCreditAmount: 20_000,
    });
  });
});
