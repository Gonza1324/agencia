export const DEFAULT_OVERDUE_LOOKBACK_DAYS = 45;
export const MIN_OVERDUE_LOOKBACK_DAYS = 7;
export const MAX_OVERDUE_LOOKBACK_DAYS = 180;

type AlertPreferences = {
  overdue_min_days: number;
  overdue_lookback_days: number;
};

type DashboardRow = {
  dashboard_status: string;
  delay_days: number;
  subagent_id: string;
  subagent_name: string;
};

type GapRow = {
  missing_dates: string[];
  subagent_id: string;
};

export function shiftOperationalDate(dateKey: string, days: number) {
  const date = new Date(`${dateKey}T12:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

export function getOverdueLookbackStart(
  operationalDate: string,
  lookbackDays: number,
) {
  const normalizedDays = Math.min(
    MAX_OVERDUE_LOOKBACK_DAYS,
    Math.max(MIN_OVERDUE_LOOKBACK_DAYS, Math.trunc(lookbackDays)),
  );

  return shiftOperationalDate(operationalDate, -normalizedDays);
}

export function buildHistoricalOverdueAlerts<T extends DashboardRow>(
  rows: T[],
  gaps: GapRow[],
  preferences: AlertPreferences,
  operationalDate: string,
) {
  const from = getOverdueLookbackStart(
    operationalDate,
    preferences.overdue_lookback_days,
  );
  const rowsBySubagent = new Map(rows.map((row) => [row.subagent_id, row]));

  return gaps
    .flatMap((gap) => {
      const row = rowsBySubagent.get(gap.subagent_id);
      const missingDates = gap.missing_dates.filter(
        (date) => date >= from && date < operationalDate,
      );

      if (!row || missingDates.length < preferences.overdue_min_days) {
        return [];
      }

      return [
        {
          ...row,
          dashboard_status:
            missingDates.length >= 3
              ? "late_critical"
              : missingDates.length === 2
                ? "late_serious"
                : "late",
          delay_days: missingDates.length,
          missing_dates: missingDates,
        },
      ];
    })
    .sort(
      (first, second) =>
        second.delay_days - first.delay_days ||
        first.subagent_name.localeCompare(second.subagent_name, "es"),
    );
}
