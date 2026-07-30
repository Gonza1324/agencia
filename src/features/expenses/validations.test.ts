import { describe, expect, it } from "vitest";

import {
  expenseObligationSchema,
  payExpenseSchema,
} from "@/features/expenses/validations";

describe("expenseObligationSchema", () => {
  it("accepts a recurring expense", () => {
    expect(
      expenseObligationSchema.safeParse({
        description: "Alquiler",
        categoryId: "11111111-1111-4111-8111-111111111111",
        amount: "250000",
        dueDate: "2026-08-10",
        recurrenceMonths: "1",
        notes: "",
      }).success,
    ).toBe(true);
  });
});

describe("payExpenseSchema", () => {
  it("rejects payments on Sunday", () => {
    expect(
      payExpenseSchema.safeParse({
        obligationId: "11111111-1111-4111-8111-111111111111",
        businessDate: "2026-08-02",
        cashAccountId: "22222222-2222-4222-8222-222222222222",
      }).success,
    ).toBe(false);
  });
});
