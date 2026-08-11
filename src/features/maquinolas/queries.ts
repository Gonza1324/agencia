import { cache } from "react";

import {
  requireInternalUser,
  requireOperator,
  requireOwnerAdmin,
} from "@/features/auth/guards";
import { maquinolaIdSchema } from "@/features/maquinolas/validations";

export const getMaquinolas = cache(async () => {
  const { supabase } = await requireOperator();
  const { data, error } = await supabase
    .from("maquinolas")
    .select("*, subagent:subagents(id, name, machine_code, status)")
    .order("status")
    .order("number");
  if (error) throw new Error(`No se pudieron cargar las Maquinolas: ${error.message}`);
  return data;
});

export const getMaquinolaById = cache(async (id: string) => {
  const parsed = maquinolaIdSchema.safeParse(id);
  if (!parsed.success) return null;
  const { supabase } = await requireOperator();
  const { data, error } = await supabase
    .from("maquinolas")
    .select("*, subagent:subagents(id, name, machine_code, status)")
    .eq("id", parsed.data)
    .maybeSingle();
  if (error) throw new Error(`No se pudo cargar la Maquinola: ${error.message}`);
  return data;
});

export const getActiveSubagentsForMaquinola = cache(async () => {
  const { supabase } = await requireOperator();
  const { data, error } = await supabase
    .from("subagents")
    .select("id, name, machine_code")
    .eq("status", "active")
    .order("name");
  if (error) throw new Error("No se pudieron cargar los Subagentes.");
  return data;
});

export const getMaquinolaSettlements = cache(async () => {
  const { supabase } = await requireOperator();
  const { data, error } = await supabase
    .from("maquinola_settlements")
    .select(
      "*, maquinola:maquinolas(id, number), subagent:subagents(id, name), payments:maquinola_settlement_payments(*)",
    )
    .order("settlement_date", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(300);
  if (error) throw new Error(`No se pudieron cargar los cierres: ${error.message}`);
  return data;
});

export const getMaquinolaSettlementById = cache(async (id: string) => {
  const parsed = maquinolaIdSchema.safeParse(id);
  if (!parsed.success) return null;
  const { profile, supabase } = await requireInternalUser();
  const { data, error } = await supabase
    .from("maquinola_settlements")
    .select(
      "*, maquinola:maquinolas(id, number), subagent:subagents(id, name), payments:maquinola_settlement_payments(*)",
    )
    .eq("id", parsed.data)
    .maybeSingle();
  if (error) throw new Error(`No se pudo cargar el cierre: ${error.message}`);
  return { settlement: data, userIsOwner: profile.role === "owner_admin" };
});

export const getMaquinolasForSettlement = cache(async () => {
  const { supabase } = await requireOperator();
  const { data, error } = await supabase
    .from("maquinolas")
    .select("id, number, subagent:subagents(id, name, status)")
    .eq("status", "active")
    .order("number");
  if (error) throw new Error("No se pudieron cargar las Maquinolas activas.");
  return data.filter((item) => item.subagent.status === "active");
});

export const getMaquinolaSettlementForEdit = cache(async (id: string) => {
  await requireOwnerAdmin();
  return getMaquinolaSettlementById(id);
});
