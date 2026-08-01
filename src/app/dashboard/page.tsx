import { BotDashboard } from '@/components/dashboard/BotDashboard';
import { mockBots } from '@/lib/mock-bots';
import { verifySession } from '@/lib/dal';

export default async function DashboardPage() {
  const user = await verifySession();

  return <BotDashboard bots={mockBots} userName={user.name} userEmail={user.email} />;
}
