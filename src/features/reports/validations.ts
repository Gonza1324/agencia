import { z } from "zod";

import { getArgentinaDateKey } from "@/lib/operational-days";

export const reportViewSchema = z.enum(["daily", "weekly", "monthly"]);
export type ReportView = z.infer<typeof reportViewSchema>;

export const reportDateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/)
  .refine((value) => value <= getArgentinaDateKey());
