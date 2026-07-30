import { z } from "zod";

export const expenseObligationSchema = z.object({
  description: z
    .string()
    .trim()
    .min(2, "Ingresá una descripción")
    .max(160, "La descripción puede tener hasta 160 caracteres"),
  categoryId: z.string().uuid("Seleccioná una categoría"),
  amount: z.preprocess(
    (value) => Number(value),
    z.number().finite().positive("El monto debe ser mayor a cero"),
  ),
  dueDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Seleccioná un vencimiento"),
  recurrenceMonths: z.preprocess(
    (value) => (value === "" ? undefined : Number(value)),
    z.number().int().min(1).max(12).optional(),
  ),
  notes: z
    .string()
    .trim()
    .max(500, "La nota puede tener hasta 500 caracteres")
    .optional()
    .transform((value) => value || undefined),
});

export const payExpenseSchema = z.object({
  obligationId: z.string().uuid("Gasto inválido"),
  businessDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Seleccioná una fecha válida")
    .refine(
      (value) => new Date(`${value}T12:00:00Z`).getUTCDay() !== 0,
      "El domingo no es un día operativo",
    ),
  cashAccountId: z.string().uuid("Seleccioná una cuenta"),
});

export const expenseObligationIdSchema = z
  .string()
  .uuid("La obligación es inválida");

export const cancelExpenseObligationSchema = z.object({
  obligationId: expenseObligationIdSchema,
  reason: z
    .string()
    .trim()
    .min(3, "Ingresá un motivo de al menos 3 caracteres")
    .max(500, "El motivo puede tener hasta 500 caracteres"),
});
