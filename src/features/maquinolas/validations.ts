import { z } from "zod";

const money = z.preprocess(
  (value) => Number(value),
  z.number().finite("Ingresá un importe válido").min(0, "No puede ser negativo"),
);

export const maquinolaSchema = z.object({
  number: z
    .string()
    .trim()
    .min(1, "El número es obligatorio")
    .max(40, "Puede tener hasta 40 caracteres")
    .regex(
      /^[\p{L}\p{N}._/-]+$/u,
      "Usá letras, números, punto, guion, barra o guion bajo",
    )
    .transform((value) => value.toUpperCase()),
  subagentId: z.string().uuid("Seleccioná un Subagente"),
});

export const maquinolaIdSchema = z.string().uuid("Maquinola inválida");

export const maquinolaSettlementSchema = z
  .object({
    settlementDate: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, "Seleccioná una fecha válida")
      .refine(
        (value) => new Date(`${value}T12:00:00Z`).getUTCDay() !== 0,
        "El domingo no es un día operativo",
      ),
    maquinolaId: maquinolaIdSchema,
    paymentMethod: z.enum(["cash", "bank_transfer", "mixed"]),
    cashAmount: money,
    bankAmount: money,
    salesAmount: money,
    prizesPaidAmount: money,
    confirmOverpayment: z.preprocess((value) => value === "true", z.boolean()),
    notes: z
      .string()
      .trim()
      .max(1000, "Las observaciones pueden tener hasta 1000 caracteres")
      .optional()
      .transform((value) => value || undefined),
  })
  .superRefine((value, context) => {
    const received = value.cashAmount + value.bankAmount;
    const expected = Math.max(value.salesAmount - value.prizesPaidAmount, 0);

    if (received === 0 && expected !== 0) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Ingresá al menos un pago",
        path: ["cashAmount"],
      });
    }
    if (value.paymentMethod === "cash" && value.bankAmount !== 0) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: "El monto banco debe ser cero",
        path: ["bankAmount"],
      });
    }
    if (value.paymentMethod === "bank_transfer" && value.cashAmount !== 0) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: "El efectivo debe ser cero",
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
    if (received > expected && !value.confirmOverpayment) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Confirmá el pago superior al importe esperado",
        path: ["cashAmount"],
      });
    }
  });

export const voidMaquinolaSettlementSchema = z.object({
  id: z.string().uuid(),
  reason: z.string().trim().min(5, "Explicá el motivo").max(500),
});

export type MaquinolaSettlementInput = z.infer<
  typeof maquinolaSettlementSchema
>;
