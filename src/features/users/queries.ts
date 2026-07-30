import { cache } from "react";

import { requireOwnerAdmin } from "@/features/auth/guards";

export const getManagedUsers = cache(async () => {
  const { supabase } = await requireOwnerAdmin();
  const { data, error } = await supabase
    .from("profiles")
    .select(
      "id, email, full_name, role, status, created_at, updated_at, subagent_links:subagent_user_links!subagent_user_links_user_id_fkey(subagent_id, status)",
    )
    .order("full_name");

  if (error) {
    throw new Error("No se pudo cargar la lista de usuarios.");
  }

  return data;
});

export const getAssignableSubagents = cache(async () => {
  const { supabase } = await requireOwnerAdmin();
  const { data, error } = await supabase
    .from("subagents")
    .select("id, name, machine_code, status")
    .order("name");

  if (error) {
    throw new Error("No se pudo cargar la lista de Subagentes.");
  }

  return data;
});
