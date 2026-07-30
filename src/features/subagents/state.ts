export type SubagentFormState = {
  status: "idle" | "error";
  message?: string;
  fieldErrors?: {
    commissionPercentage?: string[];
    name?: string[];
    machineCode?: string[];
    notes?: string[];
  };
};

export const initialSubagentFormState: SubagentFormState = {
  status: "idle",
};
