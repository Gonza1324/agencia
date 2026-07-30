import { AppShell } from "@/components/layout/app-shell";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { hasPublicSupabaseEnv } from "@/lib/env";

export default async function AppLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  if (!hasPublicSupabaseEnv()) {
    return <AppShell>{children}</AppShell>;
  }

  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return <AppShell userEmail={user?.email}>{children}</AppShell>;
}
