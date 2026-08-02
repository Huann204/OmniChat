import { notFound } from 'next/navigation';
import { InboxView } from '@/components/inbox/InboxView';
import { mockBots } from '@/lib/mock-bots';
import { getConversationsForBot } from '@/lib/mock-conversations';
import { getConnectedPages, getConversationsForPage, verifySession } from '@/lib/dal';

interface BotDetailPageProps {
  params: Promise<{ botId: string }>;
}

export default async function BotDetailPage({ params }: BotDetailPageProps) {
  const user = await verifySession();
  const { botId } = await params;

  const connectedPages = await getConnectedPages();
  const realBot = connectedPages.find((b) => b.id === botId);
  const bot = realBot ?? mockBots.find((b) => b.id === botId);

  if (!bot) {
    notFound();
  }

  const conversations = realBot
    ? await getConversationsForPage(realBot.id)
    : getConversationsForBot(bot.id);

  return (
    <div className="font-roboto">
      <InboxView
        bot={bot}
        userName={user.name}
        userEmail={user.email}
        initialConversations={conversations}
        isRealPage={!!realBot}
      />
    </div>
  );
}
