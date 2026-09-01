import { WORKING_DAY_NUMBERS } from "@/config/business";

export const DEFAULT_SETTLEMENT_HISTORY_DAYS = 45;
export const SETTLEMENT_HISTORY_PAGE_SIZE = 100;

export type SettlementHistoryStatus =
  "active" | "settled" | "settled_with_debt" | "voided" | "all";

export type SettlementHistoryFilters = {
  from: string;
  page: number;
  pageSize: number;
  search: string;
  status: SettlementHistoryStatus;
  to: string;
};

const dateKeyPattern = /^\d{4}-\d{2}-\d{2}$/;
const allowedStatuses = new Set<SettlementHistoryStatus>([
  "active",
  "settled",
  "settled_with_debt",
  "voided",
  "all",
]);

export function shiftDateKey(dateKey: string, days: number) {
  const date = new Date(`${dateKey}T12:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

function isValidDateKey(value: string | undefined) {
  if (!value || !dateKeyPattern.test(value)) {
    return false;
  }

  return new Date(`${value}T12:00:00Z`).toISOString().slice(0, 10) === value;
}

export function normalizeSettlementHistoryFilters(
  params: {
    from?: string;
    page?: string;
    q?: string;
    status?: string;
    to?: string;
  },
  today: string,
): SettlementHistoryFilters {
  const defaultFrom = shiftDateKey(
    today,
    -(DEFAULT_SETTLEMENT_HISTORY_DAYS - 1),
  );
  let from = isValidDateKey(params.from) ? params.from! : defaultFrom;
  let to = isValidDateKey(params.to) ? params.to! : today;

  if (to > today) {
    to = today;
  }

  if (from > to) {
    from = defaultFrom;
    to = today;
  }

  const parsedPage = Number.parseInt(params.page ?? "1", 10);
  const status = allowedStatuses.has(params.status as SettlementHistoryStatus)
    ? (params.status as SettlementHistoryStatus)
    : "active";

  return {
    from,
    page: Number.isSafeInteger(parsedPage) && parsedPage > 0 ? parsedPage : 1,
    pageSize: SETTLEMENT_HISTORY_PAGE_SIZE,
    search: params.q?.trim().slice(0, 80) ?? "",
    status,
    to,
  };
}

export function countWorkingDays(from: string, to: string) {
  let count = 0;
  const cursor = new Date(`${from}T12:00:00Z`);
  const end = new Date(`${to}T12:00:00Z`);

  while (cursor <= end) {
    if (
      WORKING_DAY_NUMBERS.includes(
        cursor.getUTCDay() as (typeof WORKING_DAY_NUMBERS)[number],
      )
    ) {
      count += 1;
    }
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }

  return count;
}

export function buildSettlementHistoryHref(
  filters: SettlementHistoryFilters,
  page: number,
) {
  const params = new URLSearchParams({
    from: filters.from,
    page: String(page),
    status: filters.status,
    to: filters.to,
  });

  if (filters.search) {
    params.set("q", filters.search);
  }

  return `/rendiciones?${params.toString()}`;
}
