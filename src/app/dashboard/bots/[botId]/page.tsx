import { notFound } from 'next/navigation';
import { InboxView } from '@/components/inbox/InboxView';
import { mockBots } from '@/lib/mock-bots';
import { verifySession } from '@/lib/dal';

interface BotDetailPageProps {
  params: Promise<{ botId: string }>;
}

export default async function BotDetailPage({ params }: BotDetailPageProps) {
  const user = await verifySession();
  const { botId } = await params;
  const bot = mockBots.find((b) => b.id === botId);

  if (!bot) {
    notFound();
  }

  return (
    <div className="font-roboto">
      <InboxView bot={bot} userName={user.name} userEmail={user.email} />
    </div>
  );
}
