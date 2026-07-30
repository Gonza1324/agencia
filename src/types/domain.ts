export type UserRole = "owner_admin" | "cash_operator" | "subagent" | "viewer";

export type ProfileStatus = "active" | "inactive";

export type SubagentStatus = "active" | "inactive";

export type BusinessDayStatus = "open" | "closed" | "reopened";

export type SettlementStatus =
  | "pending"
  | "settled"
  | "settled_with_debt"
  | "late"
  | "late_serious"
  | "late_critical"
  | "voided";

export type PaymentMethod = "cash" | "bank_transfer" | "mixed";

export type CashAccountType = "cash" | "bank";

export type CashMovementType =
  | "income"
  | "expense"
  | "withdrawal"
  | "adjustment"
  | "transfer";

export type CashMovementDirection = "in" | "out";

export type OwnerName = "Juliana" | "Gerónimo" | "Agustina";
