"use client";

import * as React from "react";
import { BsChatDotsFill, BsSearch } from "react-icons/bs";
import { Loader2 } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { toast } from "@/store/toast-store";
import {
  listZaloFriends,
  openZaloConversation,
  type ZaloFriendItem,
} from "@/app/actions/zaloFriend";
import { ZaloPageSelect, type ZaloPageOption } from "./ZaloPageSelect";

export function ZaloFriendListModal({
  open,
  onClose,
  zaloPages,
  onOpenConversation,
}: {
  open: boolean;
  onClose: () => void;
  zaloPages: ZaloPageOption[];
  onOpenConversation?: (
    conversationId: string,
    preview: { name: string; avatarUrl?: string; pageId: string }
  ) => void;
}) {
  const [pageId, setPageId] = React.useState(zaloPages[0]?.id ?? "");
  // Tải HẾT bạn bè trong 1 lượt gọi (không phân trang server) — lọc theo ô
  // tìm kiếm hoàn toàn ở client, không gọi lại API mỗi lần gõ.
  const [friends, setFriends] = React.useState<ZaloFriendItem[] | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [search, setSearch] = React.useState("");
  // userId đang chờ mở hội thoại (bấm "Nhắn tin") — chỉ 1 tại 1 thời điểm,
  // disable đúng nút đó tránh bấm trùng, không khoá cả danh sách.
  const [openingUserId, setOpeningUserId] = React.useState<string | null>(null);

  const loadFriends = React.useCallback(async (targetPageId: string) => {
    if (!targetPageId) return;
    setLoading(true);
    const result = await listZaloFriends(targetPageId);
    setLoading(false);
    setFriends(result.items);
    // Báo rõ lỗi thật ra thay vì im lặng hiện y hệt "0 bạn bè" — tránh nhầm
    // "thật sự không có" với "gọi API thất bại" (VD mất phiên đăng nhập).
    if (result.error) toast.error(result.error);
  }, []);

  // Mở modal (hoặc đổi Page đang chọn) thì tự tải lại — set trong lúc render
  // (mirror MediaPickerModal.tsx) để tránh 1 vòng render thừa.
  const [prevKey, setPrevKey] = React.useState("");
  const key = `${open}:${zaloPages[0]?.id ?? ""}`;
  if (key !== prevKey) {
    setPrevKey(key);
    if (open) {
      const initialPageId = zaloPages[0]?.id ?? "";
      setPageId(initialPageId);
      setFriends(null);
      setSearch("");
      void loadFriends(initialPageId);
    }
  }

  function handlePageChange(newPageId: string) {
    setPageId(newPageId);
    setFriends(null);
    setSearch("");
    void loadFriends(newPageId);
  }

  const filteredFriends = React.useMemo(() => {
    if (!friends) return null;
    const q = search.trim().toLowerCase();
    if (!q) return friends;
    return friends.filter(
      (f) => f.name.toLowerCase().includes(q) || (f.phone ?? "").toLowerCase().includes(q)
    );
  }, [friends, search]);

  async function handleMessage(friend: ZaloFriendItem) {
    if (!pageId || openingUserId) return;
    const selectedPage = zaloPages.find((p) => p.id === pageId);
    setOpeningUserId(friend.userId);
    const result = await openZaloConversation(pageId, friend.userId, friend.name, friend.avatarUrl);
    setOpeningUserId(null);
    if (result.error || !result.conversationId) {
      toast.error(result.error || "Không mở được hội thoại");
      return;
    }
    onOpenConversation?.(result.conversationId, {
      name: friend.name,
      avatarUrl: friend.avatarUrl,
      // id Zalo THẬT của Page (khác `pageId` state ở trên, vốn là id Mongo
      // dùng để gọi API) — cần khớp đúng key `pagesById` dùng trong
      // ConversationList để hiện tên/avatar Page nguồn cho hội thoại mới.
      pageId: selectedPage?.externalPageId ?? "",
    });
    onClose();
  }

  return (
    <Modal open={open} onClose={onClose} title="Danh sách bạn bè">
      {/* Chiều cao CỐ ĐỊNH (không phải max-h) — modal không co giãn theo số
          bạn bè/kết quả lọc đang hiện, tránh giật kích thước lúc gõ tìm kiếm. */}
      <div className="flex h-[70vh] flex-col overflow-hidden p-5">
        {zaloPages.length === 0 ? (
          <p className="py-6 text-center text-sm text-slate-400">
            Chưa kết nối Zalo nào — kết nối 1 tài khoản Zalo để dùng tính năng này.
          </p>
        ) : (
          <>
            {zaloPages.length > 1 && (
              <div className="mb-3 shrink-0">
                <ZaloPageSelect pages={zaloPages} value={pageId} onChange={handlePageChange} />
              </div>
            )}

            <div className="relative mb-3 shrink-0">
              <BsSearch className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Tìm theo tên hoặc số điện thoại"
                className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 pl-9 pr-3 text-sm text-slate-900 placeholder:text-slate-400 transition-colors focus:outline-none focus:ring-2 focus:ring-primary/40 focus:bg-white"
              />
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto">
              {loading && <p className="py-6 text-center text-sm text-slate-400">Đang tải...</p>}
              {!loading && filteredFriends && (
                <div className="divide-y divide-slate-100">
                  {filteredFriends.map((f) => (
                    <div key={f.userId} className="flex items-center gap-3 py-2.5">
                      {f.avatarUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={f.avatarUrl}
                          alt={f.name}
                          className="h-9 w-9 shrink-0 rounded-full object-cover"
                        />
                      ) : (
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-300 text-xs font-bold text-white">
                          {f.name.charAt(0).toUpperCase()}
                        </span>
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm text-slate-800">{f.name}</p>
                        {f.phone && <p className="text-xs text-slate-400">{f.phone}</p>}
                      </div>
                      <button
                        type="button"
                        onClick={() => handleMessage(f)}
                        disabled={openingUserId !== null}
                        aria-label={`Nhắn tin cho ${f.name}`}
                        className="flex shrink-0 items-center gap-1.5 rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-semibold text-slate-600 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40 cursor-pointer"
                      >
                        {openingUserId === f.userId ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <BsChatDotsFill className="h-3.5 w-3.5" />
                        )}
                        Nhắn tin
                      </button>
                    </div>
                  ))}
                  {filteredFriends.length === 0 && (
                    <p className="py-6 text-center text-sm text-slate-400">
                      {search.trim()
                        ? "Không tìm thấy bạn bè nào khớp."
                        : "Chưa có bạn bè nào, hoặc không lấy được danh sách (Zalo có thể đã mất phiên đăng nhập)."}
                    </p>
                  )}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </Modal>
  );
}
