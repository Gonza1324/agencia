import { z } from "zod";

export const subagentSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "El nombre es obligatorio")
    .max(120, "El nombre puede tener hasta 120 caracteres"),
  machineCode: z
    .string()
    .trim()
    .min(1, "El código de máquina es obligatorio")
    .max(30, "El código puede tener hasta 30 caracteres")
    .regex(
      /^[\p{L}\p{N}._/-]+$/u,
      "Usá letras, números, punto, guion, barra o guion bajo",
    )
    .transform((value) => value.toUpperCase()),
  commissionPercentage: z.preprocess(
    (value) => Number(value),
    z
      .number({ invalid_type_error: "Ingresá un porcentaje válido" })
      .finite()
      .min(0, "El porcentaje no puede ser negativo")
      .max(100, "El porcentaje no puede superar el 100%"),
  ),
  maquinolaOverdueAlertsEnabled: z.preprocess(
    (value) => value === "on" || value === true,
    z.boolean(),
  ),
  maquinolaOverdueMinDays: z.preprocess(
    (value) => (value == null || value === "" ? 1 : Number(value)),
    z
      .number({ invalid_type_error: "Ingresá una cantidad válida" })
      .int("Debe ser un número entero")
      .min(1, "El mínimo es 1 día")
      .max(30, "El máximo es 30 días"),
  ),
  notes: z
    .string()
    .trim()
    .max(1000, "Las observaciones pueden tener hasta 1000 caracteres")
    .optional()
    .transform((value) => value || undefined),
});

export type SubagentInput = z.infer<typeof subagentSchema>;

export const subagentIdSchema = z.string().uuid("Subagente inválido");
