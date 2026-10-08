type SettlementPrefillParams = {
  date?: string | string[];
  subagent?: string | string[];
};

const dateKeyPattern = /^\d{4}-\d{2}-\d{2}$/;

function isValidOperationalDate(value: unknown, today: string) {
  if (typeof value !== "string" || !dateKeyPattern.test(value)) {
    return false;
  }

  const date = new Date(`${value}T12:00:00Z`);

  return (
    date.toISOString().slice(0, 10) === value &&
    date.getUTCDay() !== 0 &&
    value <= today
  );
}

export function resolveSettlementPrefill(
  params: SettlementPrefillParams,
  activeSubagentIds: string[],
  today: string,
) {
  const subagentId =
    typeof params.subagent === "string" &&
    activeSubagentIds.includes(params.subagent)
      ? params.subagent
      : undefined;
  const settlementDate = isValidOperationalDate(params.date, today)
    ? (params.date as string)
    : undefined;

  return { settlementDate, subagentId };
}
