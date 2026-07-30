import { describe, expect, it } from "vitest";

import {
  dailyClosureSchema,
  reopenBusinessDaySchema,
} from "@/features/daily-closure/validations";

describe("daily closure validations", () => {
  it("rejects negative reported balances", () => {
    expect(
      dailyClosureSchema.safeParse({
        businessDate: "2026-07-30",
        countedCashAmount: "-1",
        reportedBankAmount: "0",
        note: "",
      }).success,
    ).toBe(false);
  });

  it("rejects Sundays and future dates", () => {
    expect(
      dailyClosureSchema.safeParse({
        businessDate: "2026-07-26",
        countedCashAmount: "0",
        reportedBankAmount: "0",
        note: "",
      }).success,
    ).toBe(false);
    expect(
      dailyClosureSchema.safeParse({
        businessDate: "2999-01-01",
        countedCashAmount: "0",
        reportedBankAmount: "0",
        note: "",
      }).success,
    ).toBe(false);
  });

  it("requires a meaningful reopening reason", () => {
    expect(
      reopenBusinessDaySchema.safeParse({
        businessDate: "2026-07-30",
        reason: "x",
      }).success,
    ).toBe(false);
  });
});
