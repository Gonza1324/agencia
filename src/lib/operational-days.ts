import { WORKING_DAY_NUMBERS } from "@/config/business";
import { formatDate } from "@/lib/formatters";

export function isWorkingDay(date: Date) {
  return WORKING_DAY_NUMBERS.includes(date.getDay() as 1 | 2 | 3 | 4 | 5 | 6);
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
