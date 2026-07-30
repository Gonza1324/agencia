import { describe, expect, it } from "vitest";

import { subagentSchema } from "@/features/subagents/validations";

describe("subagentSchema", () => {
  it("normalizes machine codes and trims optional values", () => {
    const result = subagentSchema.parse({
      name: "  Agencia Norte  ",
      machineCode: " maq-01 ",
      commissionPercentage: "12.5",
      notes: "  Turno tarde  ",
    });

    expect(result).toEqual({
      name: "Agencia Norte",
      machineCode: "MAQ-01",
      commissionPercentage: 12.5,
      notes: "Turno tarde",
    });
  });

  it("rejects unsupported characters in machine codes", () => {
    expect(
      subagentSchema.safeParse({
        name: "Agencia Norte",
        machineCode: "MAQ 01",
        commissionPercentage: "10",
        notes: "",
      }).success,
    ).toBe(false);
  });

  it("rejects commission percentages outside the valid range", () => {
    expect(
      subagentSchema.safeParse({
        name: "Agencia Norte",
        machineCode: "MAQ-01",
        commissionPercentage: "100.01",
        notes: "",
      }).success,
    ).toBe(false);
  });
});
