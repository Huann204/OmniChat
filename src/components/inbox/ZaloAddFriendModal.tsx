"use client";

import * as React from "react";
import { BsChatDotsFill, BsPersonPlusFill } from "react-icons/bs";
import { Loader2 } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { toast } from "@/store/toast-store";
import {
  findZaloUser,
  openZaloConversation,
  sendZaloFriendRequest,
  type ZaloFoundUser,
} from "@/app/actions/zaloFriend";
import { ZaloPageSelect, type ZaloPageOption } from "./ZaloPageSelect";

export function ZaloAddFriendModal({
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
  const [phone, setPhone] = React.useState("");
  const [searching, setSearching] = React.useState(false);
  const [foundUser, setFoundUser] = React.useState<ZaloFoundUser | null>(null);
  const [inviteMessage, setInviteMessage] = React.useState("");
  const [sending, setSending] = React.useState(false);
  const [opening, setOpening] = React.useState(false);

  // Reset lại lúc mở modal (không giữ kết quả tìm kiếm lần trước) — set trong
  // lúc render (mirror MediaPickerModal.tsx) thay vì trong Effect.
  const [prevOpen, setPrevOpen] = React.useState(open);
  if (open !== prevOpen) {
    setPrevOpen(open);
    if (open) {
      setPageId(zaloPages[0]?.id ?? "");
      setPhone("");
      setFoundUser(null);
      setInviteMessage("");
    }
  }

  async function handleSearch() {
    if (!phone.trim() || !pageId) return;
    setSearching(true);
    setFoundUser(null);
    const result = await findZaloUser(pageId, phone.trim());
    setSearching(false);
    if (result.error) {
      toast.error(result.error);
      return;
    }
    setFoundUser(result.user ?? null);
  }

  async function handleSendRequest() {
    if (!foundUser || !pageId) return;
    setSending(true);
    const result = await sendZaloFriendRequest(pageId, foundUser.userId, inviteMessage);
    setSending(false);
    if (result.error) {
      toast.error(result.error);
      return;
    }
    toast.success("Đã gửi lời mời kết bạn");
    setFoundUser({ ...foundUser, hasSentRequest: true });
  }

  // Không phải lúc nào cũng muốn gửi lời mời kết bạn trước — có thể chỉ
  // muốn nhắn tin ngay (Zalo cho nhắn cả với người lạ, hiện bên họ như "tin
  // nhắn từ người lạ"). Dùng chung đúng cơ chế "Nhắn tin" đã làm cho danh
  // sách bạn bè (tìm/tạo hội thoại rồi mở trong Livechat).
  async function handleMessage() {
    if (!foundUser || !pageId) return;
    const selectedPage = zaloPages.find((p) => p.id === pageId);
    setOpening(true);
    const result = await openZaloConversation(
      pageId,
      foundUser.userId,
      foundUser.name,
      foundUser.avatarUrl
    );
    setOpening(false);
    if (result.error || !result.conversationId) {
      toast.error(result.error || "Không mở được hội thoại");
      return;
    }
    onOpenConversation?.(result.conversationId, {
      name: foundUser.name,
      avatarUrl: foundUser.avatarUrl,
      pageId: selectedPage?.externalPageId ?? "",
    });
    onClose();
  }

  return (
    <Modal open={open} onClose={onClose} title="Tìm kiếm & Thêm bạn Zalo">
      {/* Chiều cao CỐ ĐỊNH (không phải max-h) — modal không co giãn giữa lúc
          chưa có kết quả và lúc đã tìm ra người dùng, tránh giật kích thước
          (mirror ZaloFriendListModal.tsx). */}
      <div className="flex h-[70vh] flex-col space-y-4 overflow-y-auto p-5">
        {zaloPages.length === 0 ? (
          <p className="py-6 text-center text-sm text-slate-400">
            Chưa kết nối Zalo nào — kết nối 1 tài khoản Zalo để dùng tính năng này.
          </p>
        ) : (
          <>
            {zaloPages.length > 1 && (
              <div>
                <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                  Chọn trang Zalo
                </label>
                <ZaloPageSelect
                  pages={zaloPages}
                  value={pageId}
                  onChange={(id) => {
                    setPageId(id);
                    setFoundUser(null);
                  }}
                />
              </div>
            )}

            <div>
              <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                Nhập số điện thoại
              </label>
              {/* zca-js chỉ hỗ trợ tìm CHÍNH XÁC qua số điện thoại — không tìm
                  được theo tên/từ khoá tự do (giới hạn của lib). */}
              <div className="flex gap-2">
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleSearch();
                  }}
                  placeholder="Ví dụ: 0912345678"
                  className="flex-1 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 transition-colors focus:outline-none focus:ring-2 focus:ring-primary/40 focus:bg-white"
                />
                <button
                  type="button"
                  onClick={handleSearch}
                  disabled={searching || !phone.trim()}
                  className="shrink-0 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-40 cursor-pointer"
                >
                  {searching ? <Loader2 className="h-4 w-4 animate-spin" /> : "Tìm kiếm"}
                </button>
              </div>
            </div>

            {foundUser && (
              <div className="rounded-lg border border-slate-100 p-3">
                <div className="flex items-center gap-3">
                  {foundUser.avatarUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={foundUser.avatarUrl}
                      alt={foundUser.name}
                      className="h-11 w-11 shrink-0 rounded-full object-cover"
                    />
                  ) : (
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-blue-500 text-sm font-bold text-white">
                      {foundUser.name.charAt(0).toUpperCase()}
                    </span>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-slate-900">
                      {foundUser.name}
                    </p>
                    <p className="text-xs text-slate-400">
                      {foundUser.isFriend
                        ? "Đã là bạn bè"
                        : foundUser.hasSentRequest
                          ? "Đã gửi lời mời, đang chờ chấp nhận"
                          : foundUser.hasIncomingRequest
                            ? "Người này đang gửi lời mời kết bạn cho bạn"
                            : "Chưa kết bạn"}
                    </p>
                  </div>
                </div>

                <div className="mt-3 flex gap-2">
                  {!foundUser.isFriend && !foundUser.hasSentRequest && (
                    <input
                      type="text"
                      value={inviteMessage}
                      onChange={(e) => setInviteMessage(e.target.value)}
                      placeholder="Lời nhắn (không bắt buộc)"
                      className="flex-1 rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-sm text-slate-900 placeholder:text-slate-400 transition-colors focus:outline-none focus:ring-2 focus:ring-primary/40 focus:bg-white"
                    />
                  )}
                  <button
                    type="button"
                    onClick={handleMessage}
                    disabled={opening}
                    className="flex shrink-0 items-center gap-1.5 rounded-xl border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40 cursor-pointer"
                  >
                    {opening ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <BsChatDotsFill className="h-3.5 w-3.5" />
                    )}
                    Nhắn tin
                  </button>
                  {!foundUser.isFriend && !foundUser.hasSentRequest && (
                    <button
                      type="button"
                      onClick={handleSendRequest}
                      disabled={sending}
                      className="flex shrink-0 items-center gap-1.5 rounded-xl bg-primary px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-40 cursor-pointer"
                    >
                      <BsPersonPlusFill className="h-3.5 w-3.5" />
                      {sending ? "Đang gửi..." : "Kết bạn"}
                    </button>
                  )}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </Modal>
  );
}
