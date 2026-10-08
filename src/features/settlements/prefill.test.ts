import { describe, expect, it } from "vitest";

import { resolveSettlementPrefill } from "@/features/settlements/prefill";

describe("settlement prefill", () => {
  const activeSubagentIds = ["11111111-1111-4111-8111-111111111111"];

  it("accepts an active subagent and a past operational date", () => {
    expect(
      resolveSettlementPrefill(
        {
          date: "2026-09-24",
          subagent: "11111111-1111-4111-8111-111111111111",
        },
        activeSubagentIds,
        "2026-10-08",
      ),
    ).toEqual({
      settlementDate: "2026-09-24",
      subagentId: "11111111-1111-4111-8111-111111111111",
    });
  });

  it("ignores inactive subagents and invalid dates", () => {
    expect(
      resolveSettlementPrefill(
        {
          date: "2026-10-11",
          subagent: "22222222-2222-4222-8222-222222222222",
        },
        activeSubagentIds,
        "2026-10-08",
      ),
    ).toEqual({ settlementDate: undefined, subagentId: undefined });
  });

  it("rejects future dates", () => {
    expect(
      resolveSettlementPrefill(
        { date: "2026-10-09" },
        activeSubagentIds,
        "2026-10-08",
      ).settlementDate,
    ).toBeUndefined();
  });
});
