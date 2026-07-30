export function calculateSettlementAmounts(
  salesAmount: number | null,
  commissionPercentage: number,
  prizesPaidAmount: number | null,
) {
  if (salesAmount === null || !Number.isFinite(salesAmount)) {
    return {
      commissionAmount: null,
      creditBalanceAmount: 0,
      expectedAmount: null,
    };
  }

  const commissionAmount =
    Math.round(
      (salesAmount * (commissionPercentage / 100) + Number.EPSILON) * 100,
    ) / 100;
  const netAmount =
    Math.round(
      (salesAmount -
        commissionAmount -
        (prizesPaidAmount ?? 0) +
        Number.EPSILON) *
        100,
    ) / 100;
  const expectedAmount = Math.max(netAmount, 0);
  const creditBalanceAmount = Math.max(-netAmount, 0);

  return { commissionAmount, creditBalanceAmount, expectedAmount };
}

export function calculateRemainingPayment(
  expectedAmount: number,
  otherPaymentAmount: number,
) {
  return (
    Math.round(
      (Math.max(expectedAmount - otherPaymentAmount, 0) + Number.EPSILON) * 100,
    ) / 100
  );
}
