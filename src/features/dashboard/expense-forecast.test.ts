import { describe, expect, it } from "vitest";

import {
  addDaysToDateKey,
  calculateExpenseForecast,
} from "@/features/dashboard/expense-forecast";

describe("addDaysToDateKey", () => {
  it("crosses month boundaries without changing the date format", () => {
    expect(addDaysToDateKey("2026-07-30", 7)).toBe("2026-08-06");
  });
});

describe("calculateExpenseForecast", () => {
  const expenses = [
    { id: "overdue", amount: 30000, due_date: "2026-07-29" },
    { id: "today", amount: 20000, due_date: "2026-07-30" },
    { id: "soon", amount: 40000, due_date: "2026-08-06" },
    { id: "later", amount: 50000, due_date: "2026-08-07" },
  ];

  it("separates overdue and upcoming expenses inside the horizon", () => {
    expect(
      calculateExpenseForecast(expenses, 100000, "2026-07-30"),
    ).toEqual({
      canCover: true,
      horizonDate: "2026-08-06",
      overdueAmount: 30000,
      overdueCount: 1,
      remainingAfterExpenses: 10000,
      requiredAmount: 90000,
      upcomingAmount: 60000,
      upcomingCount: 2,
    });
  });

  it("reports the exact cash shortfall", () => {
    const forecast = calculateExpenseForecast(
      expenses,
      70000,
      "2026-07-30",
    );

    expect(forecast.canCover).toBe(false);
    expect(forecast.remainingAfterExpenses).toBe(-20000);
  });
});
