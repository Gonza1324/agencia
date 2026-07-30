export type DailyClosureFormState = {
  status: "idle" | "error";
  message?: string;
  fieldErrors?: Record<string, string[] | undefined>;
};

export const initialDailyClosureFormState: DailyClosureFormState = {
  status: "idle",
};
