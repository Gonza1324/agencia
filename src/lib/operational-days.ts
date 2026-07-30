import { ARGENTINA_TIME_ZONE, WORKING_DAY_NUMBERS } from "@/config/business";
import { formatDate } from "@/lib/formatters";

const dateKeyFormatter = new Intl.DateTimeFormat("en-CA", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  timeZone: ARGENTINA_TIME_ZONE,
});

const weekdayFormatter = new Intl.DateTimeFormat("en-US", {
  weekday: "short",
  timeZone: ARGENTINA_TIME_ZONE,
});

const weekdayNumbers: Record<string, number> = {
  Sun: 0,
  Mon: 1,
  Tue: 2,
  Wed: 3,
  Thu: 4,
  Fri: 5,
  Sat: 6,
};

export function getArgentinaDateKey(date = new Date()) {
  const parts = dateKeyFormatter.formatToParts(date);
  const year = parts.find((part) => part.type === "year")?.value;
  const month = parts.find((part) => part.type === "month")?.value;
  const day = parts.find((part) => part.type === "day")?.value;

  if (!year || !month || !day) {
    throw new Error("No se pudo determinar la fecha operativa.");
  }

  return `${year}-${month}-${day}`;
}

export function getArgentinaWeekdayNumber(date: Date) {
  return weekdayNumbers[weekdayFormatter.format(date)] ?? 0;
}

export function isWorkingDay(date: Date) {
  return WORKING_DAY_NUMBERS.includes(
    getArgentinaWeekdayNumber(date) as 1 | 2 | 3 | 4 | 5 | 6,
  );
}

export function getOperationalDateLabel(date: Date) {
  return formatDate(date);
}

export function getSettlementDelaySeverity(delayDays: number) {
  if (delayDays >= 3) {
    return "critical";
  }

  if (delayDays === 2) {
    return "serious";
  }

  if (delayDays === 1) {
    return "late";
  }

  return "current";
}
