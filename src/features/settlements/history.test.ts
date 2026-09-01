import { describe, expect, it } from "vitest";

import {
  buildSettlementHistoryHref,
  countWorkingDays,
  normalizeSettlementHistoryFilters,
  shiftDateKey,
} from "@/features/settlements/history";

describe("settlement history", () => {
  it("defaults to an inclusive 45-day range", () => {
    const filters = normalizeSettlementHistoryFilters({}, "2026-09-01");

    expect(filters.from).toBe("2026-07-19");
    expect(filters.to).toBe("2026-09-01");
    expect(filters.page).toBe(1);
    expect(filters.pageSize).toBe(100);
  });

  it("normalizes invalid pages, dates and statuses", () => {
    const filters = normalizeSettlementHistoryFilters(
      {
        from: "2026-09-15",
        page: "-4",
        status: "unknown",
        to: "2026-09-20",
      },
      "2026-09-01",
    );

    expect(filters.from).toBe("2026-07-19");
    expect(filters.to).toBe("2026-09-01");
    expect(filters.page).toBe(1);
    expect(filters.status).toBe("active");
  });

  it("counts Monday through Saturday as operational days", () => {
    expect(countWorkingDays("2026-08-30", "2026-09-05")).toBe(6);
  });

  it("shifts date keys without timezone drift", () => {
    expect(shiftDateKey("2026-03-01", -1)).toBe("2026-02-28");
  });

  it("preserves filters when changing pages", () => {
    const filters = normalizeSettlementHistoryFilters(
      { from: "2026-08-01", q: "643-1", status: "all", to: "2026-09-01" },
      "2026-09-01",
    );

    expect(buildSettlementHistoryHref(filters, 3)).toBe(
      "/rendiciones?from=2026-08-01&page=3&status=all&to=2026-09-01&q=643-1",
    );
  });
});
