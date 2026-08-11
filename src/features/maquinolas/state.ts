export type MaquinolaFormState = {
  status: "idle" | "error";
  message?: string;
  fieldErrors?: Record<string, string[] | undefined>;
};

export const initialMaquinolaFormState: MaquinolaFormState = {
  status: "idle",
};
