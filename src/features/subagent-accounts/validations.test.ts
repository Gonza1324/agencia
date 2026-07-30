import { describe, expect, it } from "vitest";

import { subagentAccountMovementSchema } from "@/features/subagent-accounts/validations";

const baseMovement = {
  businessDate: "2026-07-30",
  subagentId: "11111111-1111-4111-8111-111111111111",
  amount: "100",
};

describe("subagentAccountMovementSchema", () => {
  it("requires a cash account for debt payments", () => {
    expect(
      subagentAccountMovementSchema.safeParse({
        ...baseMovement,
        type: "debt_payment",
        cashAccountId: "",
        notes: "",
      }).success,
    ).toBe(false);
  });

  it("requires a reason for compensations and adjustments", () => {
    expect(
      subagentAccountMovementSchema.safeParse({
        ...baseMovement,
        type: "compensation",
        cashAccountId: "",
        notes: "",
      }).success,
    ).toBe(false);
  });

  it("accepts a documented adjustment", () => {
    expect(
      subagentAccountMovementSchema.safeParse({
        ...baseMovement,
        type: "positive_adjustment",
        cashAccountId: "",
        notes: "Corrección autorizada",
      }).success,
    ).toBe(true);
  });
});
