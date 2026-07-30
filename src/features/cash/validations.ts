import { z } from "zod";

import { OWNER_NAMES } from "@/config/business";

export const cashMovementSchema = z
  .object({
    businessDate: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, "Seleccioná una fecha válida")
      .refine(
        (value) => new Date(`${value}T12:00:00Z`).getUTCDay() !== 0,
        "El domingo no es un día operativo",
      ),
    type: z.enum(["income", "expense", "withdrawal", "adjustment", "transfer"]),
    direction: z.enum(["in", "out"]),
    accountId: z.string().uuid("Seleccioná una cuenta"),
    categoryId: z
      .string()
      .optional()
      .transform((value) => value || undefined),
    amount: z.preprocess(
      (value) => Number(value),
      z.number().finite().positive("El monto debe ser mayor a cero"),
    ),
    ownerName: z
      .enum(OWNER_NAMES)
      .optional()
      .or(z.literal("").transform(() => undefined)),
    description: z
      .string()
      .trim()
      .max(160, "La descripción puede tener hasta 160 caracteres")
      .optional()
      .transform((value) => value || undefined),
    note: z
      .string()
      .trim()
      .max(500, "La nota puede tener hasta 500 caracteres")
      .optional()
      .transform((value) => value || undefined),
  })
  .superRefine((value, context) => {
    if (value.type !== "transfer" && !value.categoryId) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Seleccioná una categoría",
        path: ["categoryId"],
      });
    }

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

    if (value.type === "income" && value.direction !== "in") {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: "El ingreso debe ser una entrada",
        path: ["direction"],
      });
    }

    if (
      ["expense", "withdrawal", "transfer"].includes(value.type) &&
      value.direction !== "out"
    ) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Este movimiento debe ser una salida",
        path: ["direction"],
      });
    }
  });

export const cashMovementIdSchema = z.string().uuid("Movimiento inválido");

export const cashCategorySchema = z.object({
  id: z.string().uuid().optional(),
  name: z
    .string()
    .trim()
    .min(2, "Ingresá un nombre")
    .max(80, "El nombre puede tener hasta 80 caracteres"),
  type: z.enum(["income", "expense", "withdrawal", "adjustment"]),
});

export type CashMovementInput = z.infer<typeof cashMovementSchema>;
