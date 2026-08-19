import { AppShell } from "@/components/layout/app-shell";
import { requireProfile } from "@/features/auth/guards";

export default async function AppLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const { profile, user } = await requireProfile();

  return (
    <AppShell
      userEmail={user.email}
      userName={profile.full_name}
      userRole={profile.role}
    >
      {children}
    </AppShell>
  );
}
