import { describe, expect, it } from "vitest";

import { settlementSchema } from "@/features/settlements/validations";

const validSettlement = {
  settlementDate: "2026-07-30",
  subagentId: "11111111-1111-4111-8111-111111111111",
  paymentMethod: "mixed",
  cashAmount: "600",
  bankAmount: "400",
  salesAmount: "",
  commissionAmount: "",
  prizesPaidAmount: "",
  expectedAmount: "1200",
  notes: "",
};

describe("settlementSchema", () => {
  it("accepts a valid mixed payment", () => {
    expect(settlementSchema.safeParse(validSettlement).success).toBe(true);
  });

  it("rejects a mixed payment without both components", () => {
    expect(
      settlementSchema.safeParse({
        ...validSettlement,
        bankAmount: "0",
      }).success,
    ).toBe(false);
  });

  it("rejects received money above the expected amount", () => {
    expect(
      settlementSchema.safeParse({
        ...validSettlement,
        expectedAmount: "999",
      }).success,
    ).toBe(false);
  });

  it("rejects Sunday settlements", () => {
    expect(
      settlementSchema.safeParse({
        ...validSettlement,
        settlementDate: "2026-07-26",
      }).success,
    ).toBe(false);
  });
});
