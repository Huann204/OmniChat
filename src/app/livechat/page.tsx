import { notFound } from 'next/navigation';
import { getMergePagesCookie } from '@/app/actions/mergeView';
import { InboxView } from '@/components/inbox/InboxView';
import { getConnectedPages, getConversationsForPages, verifySession } from '@/lib/dal';
import type { Bot } from '@/types/bot';

export default async function MultiPagesPage() {
  const user = await verifySession();
  const requestedIds = await getMergePagesCookie();

  if (requestedIds.length === 0) {
    notFound();
  }

  const connectedPages = await getConnectedPages();
  const requestedIdSet = new Set(requestedIds);
  const selectedPages = connectedPages.filter((p) => requestedIdSet.has(p.id));

  if (selectedPages.length === 0) {
    notFound();
  }

  const conversations = await getConversationsForPages(selectedPages.map((p) => p.id));

  // Tra theo pageId thật (Facebook) — trùng với Conversation.pageId trả về
  // từ backend — để ConversationList hiện đúng avatar + tên Page nguồn.
  const pagesById = Object.fromEntries(
    selectedPages.map((p) => [p.pageId, { name: p.name, avatarUrl: p.avatarUrl }])
  );

  // Bot "ảo" chỉ để hiển thị header/avatar — không lưu ở đâu cả, chỉ tồn tại
  // trong lượt xem gộp tạm thời này.
  const virtualBot: Bot = {
    id: selectedPages.map((p) => p.id).join(","),
    pageId:
      selectedPages.length > 1
        ? `${selectedPages.length} trang đã gộp`
        : selectedPages[0].pageId,
    name: selectedPages.length > 1 ? `${selectedPages.length} trang đã gộp` : selectedPages[0].name,
    channel: "facebook",
    profileUrl: selectedPages[0].profileUrl,
    isActive: selectedPages.some((p) => p.isActive),
    messageCount: 0,
    orderCount: 0,
    avatarUrl: selectedPages[0].avatarUrl,
  };

  return (
    <div className="font-roboto">
      <InboxView
        bot={virtualBot}
        userName={user.name}
        userEmail={user.email}
        initialConversations={conversations}
        socketPageIds={selectedPages.map((p) => p.id)}
        pagesById={pagesById}
      />
    </div>
  );
}
