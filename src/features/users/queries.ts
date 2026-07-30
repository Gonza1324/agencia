import { cache } from "react";

import { requireOwnerAdmin } from "@/features/auth/guards";

export const getManagedUsers = cache(async () => {
  const { supabase } = await requireOwnerAdmin();
  const { data, error } = await supabase
    .from("profiles")
    .select("id, email, full_name, role, status, created_at, updated_at")
    .order("full_name");

  if (error) {
    throw new Error("No se pudo cargar la lista de usuarios.");
  }

  return data;
});
