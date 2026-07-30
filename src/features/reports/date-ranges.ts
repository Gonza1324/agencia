import type { ReportView } from "@/features/reports/validations";

function parseDateKey(value: string) {
  return new Date(`${value}T12:00:00Z`);
}

function toDateKey(value: Date) {
  return value.toISOString().slice(0, 10);
}

export function getReportRange(view: ReportView, anchorDate: string) {
  const anchor = parseDateKey(anchorDate);

  if (view === "daily") {
    return { from: anchorDate, to: anchorDate };
  }

  if (view === "monthly") {
    const from = new Date(
      Date.UTC(anchor.getUTCFullYear(), anchor.getUTCMonth(), 1, 12),
    );
    const to = new Date(
      Date.UTC(anchor.getUTCFullYear(), anchor.getUTCMonth() + 1, 0, 12),
    );

    return { from: toDateKey(from), to: toDateKey(to) };
  }

  const weekday = anchor.getUTCDay();
  const daysFromMonday = weekday === 0 ? 6 : weekday - 1;
  const from = new Date(anchor);
  from.setUTCDate(anchor.getUTCDate() - daysFromMonday);
  const to = new Date(from);
  to.setUTCDate(from.getUTCDate() + 6);

  return { from: toDateKey(from), to: toDateKey(to) };
}
