import { z } from "zod";

export const subagentSchema = z.object({
  name: z.string().trim().min(1, "El nombre es obligatorio"),
  machineCode: z.string().trim().min(1, "El código de máquina es obligatorio"),
  notes: z.string().trim().optional(),
});

export type SubagentInput = z.infer<typeof subagentSchema>;
