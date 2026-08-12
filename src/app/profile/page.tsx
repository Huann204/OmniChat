import { ProfileEditor } from "@/components/profile/ProfileEditor";
import { ProfileShell } from "@/components/profile/ProfileShell";
import { getCurrentShopRole, verifySession } from "@/lib/dal";

export default async function ProfilePage() {
  const [user, myRole] = await Promise.all([verifySession(), getCurrentShopRole()]);

  return (
    <ProfileShell userName={user.name} userEmail={user.email} myRole={myRole}>
      <ProfileEditor initialUser={user} />
    </ProfileShell>
  );
}
