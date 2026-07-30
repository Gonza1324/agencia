export type SettlementFormState = {
  status: "idle" | "error";
  message?: string;
  fieldErrors?: Record<string, string[] | undefined>;
};

export const initialSettlementFormState: SettlementFormState = {
  status: "idle",
};
