import { describe, expect, it } from "vitest";

import {
  maquinolaSchema,
  maquinolaSettlementSchema,
} from "@/features/maquinolas/validations";

describe("maquinolaSchema", () => {
  it("normaliza el número y exige Subagente", () => {
    const parsed = maquinolaSchema.parse({
      number: "mq-001",
      subagentId: "11111111-1111-4111-8111-111111111111",
    });
    expect(parsed.number).toBe("MQ-001");
  });
});

describe("maquinolaSettlementSchema", () => {
  const base = {
    settlementDate: "2026-08-10",
    maquinolaId: "11111111-1111-4111-8111-111111111111",
    paymentMethod: "cash",
    cashAmount: "70",
    bankAmount: "0",
    salesAmount: "100",
    prizesPaidAmount: "30",
    confirmOverpayment: "false",
    notes: "",
  };

  it("acepta el cierre exacto", () => {
    expect(maquinolaSettlementSchema.safeParse(base).success).toBe(true);
  });

  it("exige confirmar un excedente", () => {
    expect(
      maquinolaSettlementSchema.safeParse({ ...base, cashAmount: "80" }).success,
    ).toBe(false);
  });
});
