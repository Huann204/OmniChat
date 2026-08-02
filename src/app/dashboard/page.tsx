import { BotDashboard } from '@/components/dashboard/BotDashboard';
import { getConnectedPages, verifySession } from '@/lib/dal';

export default async function DashboardPage() {
  const user = await verifySession();
  const connectedPages = await getConnectedPages();

  return (
    <BotDashboard
      bots={connectedPages}
      userName={user.name}
      userEmail={user.email}
    />
  );
}
