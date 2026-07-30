export type SubagentFormState = {
  status: "idle" | "error";
  message?: string;
  fieldErrors?: {
    name?: string[];
    machineCode?: string[];
    notes?: string[];
  };
};

export const initialSubagentFormState: SubagentFormState = {
  status: "idle",
};
