"use client";

import * as React from "react";
import { BsCheckCircleFill, BsCircle, BsImageFill, BsSearch, BsX } from "react-icons/bs";
import { Loader2 } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { MediaPickerModal } from "@/components/media/MediaPickerModal";
import { toast } from "@/store/toast-store";
import {
  createZaloGroup,
  listZaloFriends,
  openZaloConversation,
  type ZaloFriendItem,
} from "@/app/actions/zaloFriend";
import { ZaloPageSelect, type ZaloPageOption } from "./ZaloPageSelect";
import type { MediaItem } from "@/types/media";

export function ZaloCreateGroupModal({
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
  const [name, setName] = React.useState("");
  const [avatar, setAvatar] = React.useState<MediaItem | null>(null);
  const [avatarPickerOpen, setAvatarPickerOpen] = React.useState(false);
  const [friends, setFriends] = React.useState<ZaloFriendItem[] | null>(null);
  const [loadingFriends, setLoadingFriends] = React.useState(false);
  const [search, setSearch] = React.useState("");
  const [selectedIds, setSelectedIds] = React.useState<Set<string>>(new Set());
  const [creating, setCreating] = React.useState(false);

  // Reset form khi `open` chuyển false -> true: làm NGAY trong thân render
  // (pattern "adjusting state when a prop changes" của React) thay vì trong
  // effect, để tránh nhiều setState đồng bộ nối tiếp nhau trong 1 effect
  // (React warning: "Calling setState synchronously within an effect can
  // trigger cascading renders").
  const [prevOpen, setPrevOpen] = React.useState(open);
  if (open !== prevOpen) {
    setPrevOpen(open);
    if (open) {
      setPageId(zaloPages[0]?.id ?? "");
      setName("");
      setAvatar(null);
      setFriends(null);
      setSearch("");
      setSelectedIds(new Set());
    }
  }

  // Phần còn lại là side-effect thật sự (gọi Server Action) nên vẫn cần
  // effect: tải bạn bè khi modal mở hoặc khi đổi page. Hàm fetch phải khai
  // báo NGAY TRONG effect (không phải qua useCallback ở ngoài) — nếu không,
  // ESLint rule `react-hooks/set-state-in-effect` coi các setState bên
  // trong hàm ngoài là bị gọi đồng bộ trong effect (dò theo closure) và báo
  // lỗi, dù thực chất chúng chỉ chạy sau khi `await` xong.
  React.useEffect(() => {
    if (!open) return;
    async function run() {
      if (!pageId) return;
      setLoadingFriends(true);
      const result = await listZaloFriends(pageId);
      setLoadingFriends(false);
      setFriends(result.items);
      if (result.error) toast.error(result.error);
    }
    void run();
  }, [open, pageId]);

  function handlePageChange(newPageId: string) {
    setPageId(newPageId);
    setFriends(null);
    setSearch("");
    setSelectedIds(new Set());
  }

  function toggleMember(userId: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(userId)) next.delete(userId);
      else next.add(userId);
      return next;
    });
  }

  const filteredFriends = React.useMemo(() => {
    if (!friends) return null;
    const q = search.trim().toLowerCase();
    if (!q) return friends;
    return friends.filter(
      (f) => f.name.toLowerCase().includes(q) || (f.phone ?? "").toLowerCase().includes(q)
    );
  }, [friends, search]);

  async function handleCreate() {
    if (!pageId || selectedIds.size === 0 || creating) return;
    const selectedPage = zaloPages.find((p) => p.id === pageId);
    setCreating(true);
    const result = await createZaloGroup(pageId, name, Array.from(selectedIds), avatar?.url);
    if (result.error || !result.groupId) {
      setCreating(false);
      toast.error(result.error || "Tạo nhóm thất bại");
      return;
    }

    // Nhóm vừa tạo chưa có Conversation nào — gọi tiếp openZaloConversation
    // để tìm-hoặc-tạo hội thoại của nhóm này (tái dùng đúng logic đang có),
    // rồi mở thẳng lên Livechat cho agent nhắn ngay.
    const groupName = name.trim() || "Nhóm mới";
    const opened = await openZaloConversation(
      pageId,
      result.groupId,
      groupName,
      avatar?.url,
      true
    );
    setCreating(false);
    if (opened.error || !opened.conversationId) {
      toast.error("Đã tạo nhóm nhưng không mở được hội thoại — thử lại từ Danh sách nhóm.");
      onClose();
      return;
    }
    onOpenConversation?.(opened.conversationId, {
      name: groupName,
      avatarUrl: avatar?.url,
      pageId: selectedPage?.externalPageId ?? "",
    });
    onClose();
  }

  return (
    <Modal open={open} onClose={onClose} title="Tạo nhóm">
      {/* Chiều cao CỐ ĐỊNH — mirror ZaloFriendListModal.tsx. */}
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

            <div className="mb-3 flex shrink-0 items-center gap-3">
              <div className="relative shrink-0">
                <button
                  type="button"
                  onClick={() => setAvatarPickerOpen(true)}
                  aria-label="Chọn ảnh đại diện nhóm"
                  className="cursor-pointer"
                >
                  {avatar ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={avatar.url}
                      alt=""
                      className="h-12 w-12 rounded-full object-cover"
                    />
                  ) : (
                    <span className="flex h-12 w-12 items-center justify-center rounded-full border-2 border-dashed border-slate-300 text-slate-400 transition-colors hover:bg-slate-50">
                      <BsImageFill className="h-4 w-4" />
                    </span>
                  )}
                </button>
                {avatar && (
                  <button
                    type="button"
                    onClick={() => setAvatar(null)}
                    aria-label="Bỏ ảnh đại diện"
                    className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-slate-800 text-white shadow cursor-pointer"
                  >
                    <BsX className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Tên nhóm (không bắt buộc)"
                className="flex-1 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 transition-colors focus:outline-none focus:ring-2 focus:ring-primary/40 focus:bg-white"
              />
            </div>

            <div className="relative mb-3 shrink-0">
              <BsSearch className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Tìm bạn bè để thêm vào nhóm"
                className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 pl-9 pr-3 text-sm text-slate-900 placeholder:text-slate-400 transition-colors focus:outline-none focus:ring-2 focus:ring-primary/40 focus:bg-white"
              />
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto">
              {loadingFriends && (
                <p className="py-6 text-center text-sm text-slate-400">Đang tải...</p>
              )}
              {!loadingFriends && filteredFriends && (
                <div className="divide-y divide-slate-100">
                  {filteredFriends.map((f) => {
                    const checked = selectedIds.has(f.userId);
                    return (
                      <button
                        key={f.userId}
                        type="button"
                        onClick={() => toggleMember(f.userId)}
                        className="flex w-full items-center gap-3 py-2.5 text-left cursor-pointer"
                      >
                        {checked ? (
                          <BsCheckCircleFill className="h-5 w-5 shrink-0 text-primary" />
                        ) : (
                          <BsCircle className="h-5 w-5 shrink-0 text-slate-300" />
                        )}
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
                      </button>
                    );
                  })}
                  {filteredFriends.length === 0 && (
                    <p className="py-6 text-center text-sm text-slate-400">
                      {search.trim() ? "Không tìm thấy bạn bè nào khớp." : "Chưa có bạn bè nào."}
                    </p>
                  )}
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={handleCreate}
              disabled={selectedIds.size === 0 || creating}
              className="mt-3 shrink-0 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-40 cursor-pointer"
            >
              {creating ? (
                <span className="flex items-center justify-center gap-1.5">
                  <Loader2 className="h-4 w-4 animate-spin" /> Đang tạo...
                </span>
              ) : (
                `Tạo nhóm${selectedIds.size > 0 ? ` (${selectedIds.size} thành viên)` : ""}`
              )}
            </button>
          </>
        )}
      </div>

      <MediaPickerModal
        open={avatarPickerOpen}
        onClose={() => setAvatarPickerOpen(false)}
        multiple={false}
        onSelect={(items) => {
          setAvatar(items[0] ?? null);
          setAvatarPickerOpen(false);
        }}
      />
    </Modal>
  );
}
