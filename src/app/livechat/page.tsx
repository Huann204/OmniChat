import { getMergePagesCookie } from "@/app/actions/mergeView";
import { InboxView } from "@/components/inbox/InboxView";
import { getConnectedPages, getConversationsForPages, verifySession } from "@/lib/dal";
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
  isActive: false,
  messageCount: 0,
  orderCount: 0,
};

export default async function MultiPagesPage() {
  // Không phụ thuộc kết quả của nhau — chạy song song thay vì tuần tự để
  // bớt vòng round-trip.
  const [user, connectedPages, requestedIds] = await Promise.all([
    verifySession(),
    getConnectedPages(),
    getMergePagesCookie(),
  ]);

  const requestedIdSet = new Set(requestedIds);
  let selectedPages = connectedPages.filter((p) => requestedIdSet.has(p.id));

  // Cookie trống, hoặc trỏ tới Page không còn thuộc Shop đang active (vd vừa
  // đổi Shop) — mặc định lấy TOÀN BỘ Page hiện có (giống hành vi "Gộp trang"
  // mặc định khi bấm tab từ Dashboard) thay vì chặn cứng bằng 404.
  if (selectedPages.length === 0) {
    selectedPages = connectedPages;
  }

  // Chưa kết nối Page nào — vẫn hiện đủ khung livechat (rail, danh sách hội
  // thoại, khung chat), chỉ danh sách hội thoại rỗng, không phải 404.
  if (selectedPages.length === 0) {
    return (
      <div className="font-roboto">
        <InboxView
          bot={EMPTY_BOT}
          userName={user.name}
          userEmail={user.email}
          initialConversations={[]}
          socketPageIds={[]}
          pagesById={{}}
        />
      </div>
    );
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
