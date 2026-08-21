import type { Metadata } from "next";
import { InboxView } from "@/components/inbox/InboxView";

export const metadata: Metadata = {
  title: "Hộp thư tin nhắn",
};
import {
  getAiAssistantSettings,
  getConnectedPages,
  getConversationsForPages,
  getConversationTags,
  getQuickReplies,
} from "@/lib/dal";
import { getMergePagesCookie } from "@/lib/session";
import type { Bot } from "@/types/bot";

// Dùng khi Shop chưa kết nối Page nào — không có Page thật nào để lấy
// id/tên/avatar, nhưng vẫn cần 1 Bot hợp lệ để InboxView render đúng khung
// (giống hệt trạng thái "0 hội thoại" bình thường, không phải màn riêng).
const EMPTY_BOT: Bot = {
  id: "",
  pageId: "",
  name: "Chưa kết nối Page",
  channel: "facebook",
  profileUrl: "",
  status: "inactive",
  messageCount: 0,
  orderCount: 0,
};

export default async function MultiPagesPage() {
  // Danh sách Page muốn xem gộp — đọc từ cookie "merge_pages", ghi thẳng ở
  // client bằng document.cookie (xem lib/mergePagesCookie.ts) thay vì qua
  // Server Action + redirect() như trước (cách cũ khiến MỌI lượt vào
  // Livechat tốn thêm 1 vòng round-trip thừa, đo được rõ trên production).
  // Không dùng query string vì lộ pageId trên URL nhìn rối mắt — xem
  // BotCard.tsx/BotDashboard.tsx/MergePagesModal.tsx/SettingsShell.tsx.
  // Lấy connectedPages và cookie gộp trang trước để xác định danh sách Page
  const [connectedPages, requestedIds] = await Promise.all([
    getConnectedPages(),
    getMergePagesCookie(),
  ]);

  // Page Zalo cá nhân đang kết nối VÀ còn phiên đăng nhập sống (status
  // "active") — cho nút "+" (Danh sách bạn bè/Kết bạn) trong ConversationList.
  // Loại bớt Page "inactive" (mất phiên nhưng chưa ngắt kết nối hẳn) ngay từ
  // dropdown, tránh chọn nhầm rồi mới báo lỗi lúc gọi API tìm/nhắn (xem
  // zaloFriend.controller.ts#getOwnedZaloApi). Lấy từ TOÀN BỘ connectedPages
  // (không phải chỉ selectedPages đang xem) — dùng công cụ này không phụ
  // thuộc đang gộp xem Page nào.
  const zaloPages = connectedPages
    .filter((p) => p.channel === "zalo" && p.status === "active")
    .map((p) => ({ id: p.id, name: p.name, avatarUrl: p.avatarUrl, externalPageId: p.pageId }));

  const requestedIdSet = new Set(requestedIds);
  let selectedPages = connectedPages.filter((p) => requestedIdSet.has(p.id));

  if (selectedPages.length === 0) {
    selectedPages = connectedPages;
  }

  // Khởi tạo các Promise tải dữ liệu SONG SONG — không await ở đây để không chặn render HTML
  const quickRepliesPromise = getQuickReplies();
  const conversationTagsPromise = getConversationTags();
  const aiAssistantSettingsPromise = getAiAssistantSettings();

  // Chưa kết nối Page nào — vẫn hiện đủ khung livechat
  if (selectedPages.length === 0) {
    return (
      <InboxView
        bot={EMPTY_BOT}
        conversationsPromise={Promise.resolve({ conversations: [], hasMore: false })}
        socketPageIds={[]}
        pagesById={{}}
        zaloPages={zaloPages}
        quickRepliesPromise={quickRepliesPromise}
        conversationTagsPromise={conversationTagsPromise}
        aiAssistantSettingsPromise={aiAssistantSettingsPromise}
      />
    );
  }

  const selectedPageIds = selectedPages.map((p) => p.id);
  const conversationsPromise = getConversationsForPages(selectedPageIds);

  // Tra theo pageId thật (Facebook) — trùng với Conversation.pageId trả về
  // từ backend — để ConversationList hiện đúng avatar + tên Page nguồn.
  const pagesById = Object.fromEntries(
    selectedPages.map((p) => [p.pageId, { name: p.name, avatarUrl: p.avatarUrl }])
  );

  // Bot "ảo" chỉ để hiển thị header/avatar — không lưu ở đâu cả, chỉ tồn tại
  // trong lượt xem gộp tạm thời này.
  const virtualBot: Bot = {
    id: selectedPageIds.join(","),
    pageId:
      selectedPages.length > 1
        ? `${selectedPages.length} trang đã gộp`
        : selectedPages[0].pageId,
    name: selectedPages.length > 1 ? `${selectedPages.length} trang đã gộp` : selectedPages[0].name,
    channel: selectedPages[0]?.channel || "facebook",
    profileUrl: selectedPages[0].profileUrl,
    status: selectedPages.some((p) => p.status === "active") ? "active" : "inactive",
    messageCount: 0,
    orderCount: 0,
    avatarUrl: selectedPages[0].avatarUrl,
  };

  return (
    <InboxView
      bot={virtualBot}
      conversationsPromise={conversationsPromise}
      socketPageIds={selectedPageIds}
      pagesById={pagesById}
      zaloPages={zaloPages}
      quickRepliesPromise={quickRepliesPromise}
      conversationTagsPromise={conversationTagsPromise}
      aiAssistantSettingsPromise={aiAssistantSettingsPromise}
    />
  );
}
