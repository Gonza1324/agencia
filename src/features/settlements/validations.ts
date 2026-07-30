import { z } from "zod";

export const settlementPaymentSchema = z
  .object({
    paymentMethod: z.enum(["cash", "bank_transfer", "mixed"]),
    receivedAmount: z.number().min(0),
    cashAmount: z.number().min(0).default(0),
    bankAmount: z.number().min(0).default(0),
    expectedAmount: z.number().min(0).optional(),
  })
  .superRefine((value, context) => {
    const total = value.cashAmount + value.bankAmount;

    if (total !== value.receivedAmount) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: "La suma de pagos debe coincidir con el importe recibido",
        path: ["receivedAmount"],
      });
    }

    if (value.paymentMethod === "cash" && value.cashAmount <= 0) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: "El pago en efectivo requiere monto efectivo",
        path: ["cashAmount"],
      });
    }

    if (value.paymentMethod === "bank_transfer" && value.bankAmount <= 0) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: "La transferencia requiere monto banco",
        path: ["bankAmount"],
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
  });

export type SettlementPaymentInput = z.infer<typeof settlementPaymentSchema>;
