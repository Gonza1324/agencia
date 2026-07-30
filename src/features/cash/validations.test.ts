import { describe, expect, it } from "vitest";

import { cashMovementSchema } from "@/features/cash/validations";

const baseMovement = {
  businessDate: "2026-07-30",
  accountId: "11111111-1111-4111-8111-111111111111",
  categoryId: "22222222-2222-4222-8222-222222222222",
  amount: "100",
  description: "",
  note: "",
};

describe("cashMovementSchema", () => {
  it("requires an owner for withdrawals", () => {
    expect(
      cashMovementSchema.safeParse({
        ...baseMovement,
        type: "withdrawal",
        direction: "out",
        ownerName: "",
      }).success,
    ).toBe(false);
  });

  it("requires a note for adjustments", () => {
    expect(
      cashMovementSchema.safeParse({
        ...baseMovement,
        type: "adjustment",
        direction: "in",
        ownerName: "",
      }).success,
    ).toBe(false);
  });

  it("allows transfers without a category", () => {
    expect(
      cashMovementSchema.safeParse({
        ...baseMovement,
        type: "transfer",
        direction: "out",
        categoryId: "",
        ownerName: "",
      }).success,
    ).toBe(true);
  });
});
