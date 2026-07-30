import { cache } from "react";

import { requireOperator } from "@/features/auth/guards";
import { settlementIdSchema } from "@/features/settlements/validations";

export const getSettlements = cache(async () => {
  const { supabase } = await requireOperator();
  const { data, error } = await supabase
    .from("daily_settlements")
    .select(
      "*, subagent:subagents(id, name, machine_code), payments:settlement_payments(*)",
    )
    .order("settlement_date", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(200);

  if (error) {
    throw new Error(`No se pudieron cargar las rendiciones: ${error.message}`);
  }

  return data;
});

export const getSettlementById = cache(async (id: string) => {
  const parsedId = settlementIdSchema.safeParse(id);

  if (!parsedId.success) {
    return null;
  }

  const { supabase } = await requireOperator();
  const { data, error } = await supabase
    .from("daily_settlements")
    .select(
      "*, subagent:subagents(id, name, machine_code), payments:settlement_payments(*)",
    )
    .eq("id", parsedId.data)
    .maybeSingle();

  if (error) {
    throw new Error(`No se pudo cargar la rendición: ${error.message}`);
  }

  return data;
});

export const getActiveSubagentsForSettlement = cache(async () => {
  const { supabase } = await requireOperator();
  const { data, error } = await supabase
    .from("subagents")
    .select("id, name, machine_code")
    .eq("status", "active")
    .order("name");

  if (error) {
    throw new Error(`No se pudieron cargar los Subagentes: ${error.message}`);
  }

  return data;
});
