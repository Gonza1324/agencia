import { SubagentPortalShell } from "@/components/layout/subagent-portal-shell";
import { requireSubagentUser } from "@/features/auth/guards";

export default async function SubagentPortalLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const { profile, user } = await requireSubagentUser();

  return (
    <SubagentPortalShell
      email={user.email}
      name={profile.full_name}
    >
      {children}
    </SubagentPortalShell>
  );
}
