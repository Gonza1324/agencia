export type CashFormState = {
  status: "idle" | "error";
  message?: string;
  fieldErrors?: Record<string, string[] | undefined>;
};

export const initialCashFormState: CashFormState = { status: "idle" };
