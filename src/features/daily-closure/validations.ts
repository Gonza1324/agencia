import { z } from "zod";

import { getArgentinaDateKey } from "@/lib/operational-days";

const operationalDateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Seleccioná una fecha válida")
  .refine(
    (value) => new Date(`${value}T12:00:00Z`).getUTCDay() !== 0,
    "El domingo no es un día operativo",
  )
  .refine(
    (value) => value <= getArgentinaDateKey(),
    "No se puede operar sobre una fecha futura",
  );

export const dailyClosureSchema = z.object({
  businessDate: operationalDateSchema,
  countedCashAmount: z.preprocess(
    (value) => Number(value),
    z.number().finite().nonnegative("El efectivo no puede ser negativo"),
  ),
  reportedBankAmount: z.preprocess(
    (value) => Number(value),
    z.number().finite().nonnegative("El banco no puede ser negativo"),
  ),
  note: z
    .string()
    .trim()
    .max(500, "La nota puede tener hasta 500 caracteres")
    .optional()
    .transform((value) => value || undefined),
});

export const reopenBusinessDaySchema = z.object({
  businessDate: operationalDateSchema,
  reason: z
    .string()
    .trim()
    .min(3, "Ingresá el motivo de la reapertura")
    .max(500, "El motivo puede tener hasta 500 caracteres"),
});

export const closureDateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/)
  .refine((value) => value <= getArgentinaDateKey());
