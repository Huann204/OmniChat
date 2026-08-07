import { SettingsShell } from "@/components/settings/SettingsShell";
import { verifySession } from "@/lib/dal";

export default async function SettingsLayout({ children }: { children: React.ReactNode }) {
  const user = await verifySession();

  return (
    <SettingsShell userName={user.name} userEmail={user.email}>
      {children}
    </SettingsShell>
  );
}
