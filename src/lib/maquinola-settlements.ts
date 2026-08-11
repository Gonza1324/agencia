function roundMoney(value: number) {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

export function calculateMaquinolaSettlement(
  salesAmount: number,
  prizesPaidAmount: number,
  receivedAmount = 0,
) {
  const netAmount = roundMoney(salesAmount - prizesPaidAmount);
  const expectedAmount = Math.max(netAmount, 0);

  return {
    debtAmount: Math.max(roundMoney(expectedAmount - receivedAmount), 0),
    expectedAmount,
    overpaymentCreditAmount: Math.max(
      roundMoney(receivedAmount - expectedAmount),
      0,
    ),
    prizeCreditAmount: Math.max(roundMoney(-netAmount), 0),
  };
}
