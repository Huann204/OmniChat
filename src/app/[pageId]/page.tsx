import { notFound } from 'next/navigation';
import { InboxView } from '@/components/inbox/InboxView';
import { getConnectedPages, getConversationsForPage, verifySession } from '@/lib/dal';

interface BotDetailPageProps {
  params: Promise<{ pageId: string }>;
}

export default async function BotDetailPage({ params }: BotDetailPageProps) {
  const user = await verifySession();
  const { pageId } = await params;

  const connectedPages = await getConnectedPages();
  const bot = connectedPages.find((b) => b.id === pageId);

  if (!bot) {
    notFound();
  }

  const conversations = await getConversationsForPage(bot.id);

  return (
    <div className="font-roboto">
      <InboxView
        bot={bot}
        userName={user.name}
        userEmail={user.email}
        initialConversations={conversations}
      />
    </div>
  );
}
