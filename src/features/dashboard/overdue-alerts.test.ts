import { describe, expect, it } from "vitest";

import {
  buildHistoricalOverdueAlerts,
  getOverdueLookbackStart,
} from "@/features/dashboard/overdue-alerts";

const dashboardRow = {
  dashboard_status: "settled",
  delay_days: 0,
  last_settlement_date: "2026-10-01",
  subagent_id: "subagent-1",
  subagent_name: "Cliente de prueba",
};

describe("historical overdue alerts", () => {
  it("keeps an older missing day after later settlements arrive", () => {
    const alerts = buildHistoricalOverdueAlerts(
      [dashboardRow],
      [{ subagent_id: "subagent-1", missing_dates: ["2026-09-24"] }],
      { overdue_lookback_days: 45, overdue_min_days: 1 },
      "2026-10-02",
    );

    expect(alerts).toHaveLength(1);
    expect(alerts[0]).toMatchObject({
      dashboard_status: "late",
      delay_days: 1,
      missing_dates: ["2026-09-24"],
      last_settlement_date: "2026-10-01",
    });
  });

  it("excludes missing dates outside the configured lookback", () => {
    const alerts = buildHistoricalOverdueAlerts(
      [dashboardRow],
      [{ subagent_id: "subagent-1", missing_dates: ["2026-08-01"] }],
      { overdue_lookback_days: 45, overdue_min_days: 1 },
      "2026-10-02",
    );

    expect(alerts).toEqual([]);
  });

  it("respects the configured minimum number of missing days", () => {
    const alerts = buildHistoricalOverdueAlerts(
      [dashboardRow],
      [
        {
          subagent_id: "subagent-1",
          missing_dates: ["2026-09-24", "2026-09-25"],
        },
      ],
      { overdue_lookback_days: 45, overdue_min_days: 3 },
      "2026-10-02",
    );

    expect(alerts).toEqual([]);
  });

  it("clamps the lookback to the supported range", () => {
    expect(getOverdueLookbackStart("2026-10-02", 1)).toBe("2026-09-25");
    expect(getOverdueLookbackStart("2026-10-02", 999)).toBe("2026-04-05");
  });
});
