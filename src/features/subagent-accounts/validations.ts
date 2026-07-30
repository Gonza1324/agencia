import { z } from "zod";

export const manualAccountMovementTypes = [
  "debt_payment",
  "positive_adjustment",
  "negative_adjustment",
  "compensation",
] as const;

export const subagentAccountMovementSchema = z
  .object({
    businessDate: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, "Seleccioná una fecha válida")
      .refine(
        (value) => new Date(`${value}T12:00:00Z`).getUTCDay() !== 0,
        "El domingo no es un día operativo",
      ),
    subagentId: z.string().uuid("Subagente inválido"),
    type: z.enum(manualAccountMovementTypes),
    amount: z.preprocess(
      (value) => Number(value),
      z.number().finite().positive("El monto debe ser mayor a cero"),
    ),
    cashAccountId: z
      .string()
      .optional()
      .transform((value) => value || undefined),
    notes: z
      .string()
      .trim()
      .max(500, "La nota puede tener hasta 500 caracteres")
      .optional()
      .transform((value) => value || undefined),
  })
  .superRefine((value, context) => {
    if (value.type === "debt_payment" && !value.cashAccountId) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Seleccioná la cuenta donde ingresó el pago",
        path: ["cashAccountId"],
      });
    }

    if (value.type !== "debt_payment" && !value.notes) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: "El ajuste o compensación requiere una nota",
        path: ["notes"],
      });
    }
  });

export const subagentAccountIdSchema = z.string().uuid();

export type SubagentAccountMovementInput = z.infer<
  typeof subagentAccountMovementSchema
>;
