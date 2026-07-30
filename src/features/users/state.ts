export type UserFormState = {
  status: "idle" | "success" | "error";
  message?: string;
  fieldErrors?: Record<string, string[] | undefined>;
};

export const initialUserFormState: UserFormState = {
  status: "idle",
};
