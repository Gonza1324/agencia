import { cache } from "react";
import { requireOwnerAdmin } from "@/features/auth/guards";
import { subagentIdSchema } from "@/features/subagents/validations";
import type { Tables } from "@/types/database";

export type Subagent = Tables<"subagents">;

export const getSubagents = cache(async () => {
  const { supabase } = await requireOwnerAdmin();
  const { data, error } = await supabase
    .from("subagents")
    .select("*")
    .order("status", { ascending: true })
    .order("name", { ascending: true });

  if (error) {
    throw new Error(`No se pudieron cargar los Subagentes: ${error.message}`);
  }

  return data;
});

export const getSubagentById = cache(async (id: string) => {
  const parsedId = subagentIdSchema.safeParse(id);

  if (!parsedId.success) {
    return null;
  }

  const { supabase } = await requireOwnerAdmin();
  const { data, error } = await supabase
    .from("subagents")
    .select("*")
    .eq("id", parsedId.data)
    .maybeSingle();

  if (error) {
    throw new Error(`No se pudo cargar el Subagente: ${error.message}`);
  }

  return data;
});

export const getSubagentAuditLog = cache(async (id: string) => {
  const parsedId = subagentIdSchema.safeParse(id);

  if (!parsedId.success) {
    return [];
  }

  const { supabase } = await requireOwnerAdmin();
  const { data, error } = await supabase
    .from("audit_logs")
    .select("id, action, created_at, old_values, new_values")
    .eq("entity_type", "subagent")
    .eq("entity_id", parsedId.data)
    .order("created_at", { ascending: false })
    .limit(20);

  if (error) {
    throw new Error(`No se pudo cargar la auditoría: ${error.message}`);
  }

  return data;
});
