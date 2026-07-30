"use client";

import { createBrowserClient } from "@supabase/ssr";
import { hasPublicSupabaseEnv } from "@/lib/env";
import type { Database } from "@/types/database";

export function createBrowserSupabaseClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!hasPublicSupabaseEnv() || !url || !anonKey) {
    throw new Error("Missing public Supabase environment variables");
  }

  return createBrowserClient<Database>(url, anonKey);
}
