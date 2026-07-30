export function calculateSettlementAmounts(
  salesAmount: number | null,
  commissionPercentage: number,
  prizesPaidAmount: number | null,
) {
  if (salesAmount === null || !Number.isFinite(salesAmount)) {
    return {
      commissionAmount: null,
      expectedAmount: null,
    };
  }

  const commissionAmount =
    Math.round(
      (salesAmount * (commissionPercentage / 100) + Number.EPSILON) * 100,
    ) / 100;
  const expectedAmount =
    Math.round(
      (Math.max(salesAmount - commissionAmount - (prizesPaidAmount ?? 0), 0) +
        Number.EPSILON) *
        100,
    ) / 100;

  return { commissionAmount, expectedAmount };
}
