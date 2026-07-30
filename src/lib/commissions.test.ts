import { describe, expect, it } from "vitest";

import { calculateSettlementAmounts } from "@/lib/commissions";

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
