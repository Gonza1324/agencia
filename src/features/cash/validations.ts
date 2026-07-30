import { z } from "zod";
import { OWNER_NAMES } from "@/config/business";

export const cashMovementSchema = z
  .object({
    type: z.enum(["income", "expense", "withdrawal", "adjustment", "transfer"]),
    direction: z.enum(["in", "out"]),
    amount: z.number().positive("El monto debe ser mayor a cero"),
    ownerName: z.enum(OWNER_NAMES).optional(),
    note: z.string().trim().optional(),
  })
  .superRefine((value, context) => {
    if (value.type === "withdrawal" && !value.ownerName) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: "El retiro requiere indicar dueño",
        path: ["ownerName"],
      });
    }

    if (value.type === "adjustment" && !value.note) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: "El ajuste requiere nota obligatoria",
        path: ["note"],
      });
    }
  });

export type CashMovementInput = z.infer<typeof cashMovementSchema>;
