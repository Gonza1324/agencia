export type ExpenseFormState = {
  status: "idle" | "error";
  message?: string;
  fieldErrors?: Record<string, string[] | undefined>;
};

export const initialExpenseFormState: ExpenseFormState = { status: "idle" };
