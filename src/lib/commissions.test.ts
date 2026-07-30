import { describe, expect, it } from "vitest";

import {
  calculateRemainingPayment,
  calculateSettlementAmounts,
} from "@/lib/commissions";

describe("calculateSettlementAmounts", () => {
  it("calculates the commission and expected settlement from the percentage", () => {
    expect(calculateSettlementAmounts(100, 10, 50)).toEqual({
      commissionAmount: 10,
      creditBalanceAmount: 0,
      expectedAmount: 40,
    });
  });

  it("rounds monetary results to two decimals", () => {
    expect(calculateSettlementAmounts(123.45, 7.5, 10)).toEqual({
      commissionAmount: 9.26,
      creditBalanceAmount: 0,
      expectedAmount: 104.19,
    });
  });

  it("does not calculate a closing amount without sales", () => {
    expect(calculateSettlementAmounts(null, 10, 50)).toEqual({
      commissionAmount: null,
      creditBalanceAmount: 0,
      expectedAmount: null,
    });
  });

  it("converts a negative net closing into credit balance", () => {
    expect(calculateSettlementAmounts(154_190, 0, 648_490)).toEqual({
      commissionAmount: 0,
      creditBalanceAmount: 494_300,
      expectedAmount: 0,
    });
  });
});

describe("calculateRemainingPayment", () => {
  it("fills the full expected amount when the other method is empty", () => {
    expect(calculateRemainingPayment(100_000, 0)).toBe(100_000);
  });

  it("subtracts the amount already entered in the other method", () => {
    expect(calculateRemainingPayment(100_000, 55_000)).toBe(45_000);
  });

  it("never suggests a negative payment", () => {
    expect(calculateRemainingPayment(100_000, 105_000)).toBe(0);
  });
});
