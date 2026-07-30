export type SubagentAccountFormState = {
  status: "idle" | "error";
  message?: string;
  fieldErrors?: Record<string, string[] | undefined>;
};

export const initialSubagentAccountFormState: SubagentAccountFormState = {
  status: "idle",
};
