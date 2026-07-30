import { describe, expect, it } from "vitest";

import { getReportRange } from "@/features/reports/date-ranges";

describe("getReportRange", () => {
  it("returns the selected day for a daily report", () => {
    expect(getReportRange("daily", "2026-07-30")).toEqual({
      from: "2026-07-30",
      to: "2026-07-30",
    });
  });

  it("returns Monday through Sunday for a weekly report", () => {
    expect(getReportRange("weekly", "2026-07-30")).toEqual({
      from: "2026-07-27",
      to: "2026-08-02",
    });
  });

  it("keeps a Sunday inside its preceding operational week", () => {
    expect(getReportRange("weekly", "2026-08-02")).toEqual({
      from: "2026-07-27",
      to: "2026-08-02",
    });
  });

  it("handles leap-year monthly ranges", () => {
    expect(getReportRange("monthly", "2024-02-10")).toEqual({
      from: "2024-02-01",
      to: "2024-02-29",
    });
  });
});
