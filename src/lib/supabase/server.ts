import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { hasPublicSupabaseEnv } from "@/lib/env";
import type { CookieOptions } from "@supabase/ssr";
import type { Database } from "@/types/database";

type CookiesToSet = {
  name: string;
  value: string;
  options: CookieOptions;
}[];

export async function createServerSupabaseClient() {
  const cookieStore = await cookies();
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!hasPublicSupabaseEnv() || !url || !anonKey) {
    throw new Error("Missing public Supabase environment variables");
  }

  return createServerClient<Database>(url, anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet: CookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        } catch {
          // Server Components cannot mutate cookies. Middleware handles refresh.
        }
      },
    },
  });
}
