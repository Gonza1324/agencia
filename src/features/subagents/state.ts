export type SubagentFormState = {
  status: "idle" | "error";
  message?: string;
  fieldErrors?: {
    commissionPercentage?: string[];
    name?: string[];
    machineCode?: string[];
    maquinolaOverdueAlertsEnabled?: string[];
    maquinolaOverdueMinDays?: string[];
    notes?: string[];
  };
};

export const initialSubagentFormState: SubagentFormState = {
  status: "idle",
};
