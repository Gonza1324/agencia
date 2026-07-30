import { z } from "zod";

const optionalMoney = z.preprocess(
  (value) => (value === "" || value == null ? undefined : Number(value)),
  z
    .number({ invalid_type_error: "Ingresá un importe válido" })
    .finite()
    .min(0, "El importe no puede ser negativo")
    .optional(),
);

const requiredMoney = z.preprocess(
  (value) => Number(value),
  z
    .number({ invalid_type_error: "Ingresá un importe válido" })
    .finite()
    .min(0, "El importe no puede ser negativo"),
);

export const settlementSchema = z
  .object({
    settlementDate: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, "Seleccioná una fecha válida")
      .refine(
        (value) => new Date(`${value}T12:00:00Z`).getUTCDay() !== 0,
        "El domingo no es un día operativo",
      ),
    subagentId: z.string().uuid("Seleccioná un Subagente"),
    paymentMethod: z.enum(["cash", "bank_transfer", "mixed"]),
    cashAmount: requiredMoney,
    bankAmount: requiredMoney,
    salesAmount: optionalMoney,
    commissionAmount: optionalMoney,
    prizesPaidAmount: optionalMoney,
    expectedAmount: optionalMoney,
    notes: z
      .string()
      .trim()
      .max(1000, "Las observaciones pueden tener hasta 1000 caracteres")
      .optional()
      .transform((value) => value || undefined),
  })
  .superRefine((value, context) => {
    const receivedAmount = value.cashAmount + value.bankAmount;

    if (receivedAmount <= 0 && value.expectedAmount !== 0) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Ingresá al menos un pago",
        path: ["cashAmount"],
      });
    }

    if (value.paymentMethod === "cash" && value.bankAmount !== 0) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: "En efectivo, el monto banco debe ser cero",
        path: ["bankAmount"],
      });
    }

    if (value.paymentMethod === "bank_transfer" && value.cashAmount !== 0) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: "En transferencia, el efectivo debe ser cero",
        path: ["cashAmount"],
      });
    }

    if (
      value.paymentMethod === "mixed" &&
      (value.cashAmount <= 0 || value.bankAmount <= 0)
    ) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: "El pago mixto requiere efectivo y banco",
        path: ["paymentMethod"],
      });
    }

    if (
      value.expectedAmount !== undefined &&
      receivedAmount > value.expectedAmount
    ) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: "No puede superar el importe esperado",
        path: ["expectedAmount"],
      });
    }
  });

export const settlementIdSchema = z.string().uuid("Rendición inválida");

export const voidSettlementSchema = z.object({
  id: settlementIdSchema,
  reason: z
    .string()
    .trim()
    .min(5, "Explicá el motivo de la anulación")
    .max(500, "El motivo puede tener hasta 500 caracteres"),
});

export type SettlementInput = z.infer<typeof settlementSchema>;
