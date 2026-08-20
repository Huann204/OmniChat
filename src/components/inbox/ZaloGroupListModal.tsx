"use client";

import * as React from "react";
import { BsChatDotsFill, BsSearch } from "react-icons/bs";
import { Loader2 } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { toast } from "@/store/toast-store";
import { listZaloGroups, openZaloConversation, type ZaloGroupItem } from "@/app/actions/zaloFriend";
import { ZaloPageSelect, type ZaloPageOption } from "./ZaloPageSelect";

export function ZaloGroupListModal({
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
  // Tải HẾT nhóm trong 1 lượt gọi (không phân trang server) — lọc theo ô tìm
  // kiếm hoàn toàn ở client, mirror ZaloFriendListModal.tsx.
  const [groups, setGroups] = React.useState<ZaloGroupItem[] | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [search, setSearch] = React.useState("");
  // groupId đang chờ mở hội thoại (bấm "Nhắn tin") — chỉ 1 tại 1 thời điểm.
  const [openingGroupId, setOpeningGroupId] = React.useState<string | null>(null);

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
      setGroups(null);
      setSearch("");
    }
  }

  // Phần còn lại là side-effect thật sự (gọi Server Action) nên vẫn cần
  // effect: tải nhóm khi modal mở hoặc khi đổi page.
  React.useEffect(() => {
    if (!open) return;
    async function run() {
      if (!pageId) return;
      setLoading(true);
      const result = await listZaloGroups(pageId);
      setLoading(false);
      setGroups(result.items);
      if (result.error) toast.error(result.error);
    }
    void run();
  }, [open, pageId]);

  function handlePageChange(newPageId: string) {
    setPageId(newPageId);
    setGroups(null);
    setSearch("");
  }

  const filteredGroups = React.useMemo(() => {
    if (!groups) return null;
    const q = search.trim().toLowerCase();
    if (!q) return groups;
    return groups.filter((g) => g.name.toLowerCase().includes(q));
  }, [groups, search]);

  async function handleMessage(group: ZaloGroupItem) {
    if (!pageId || openingGroupId) return;
    const selectedPage = zaloPages.find((p) => p.id === pageId);
    setOpeningGroupId(group.groupId);
    const result = await openZaloConversation(
      pageId,
      group.groupId,
      group.name,
      group.avatarUrl,
      true
    );
    setOpeningGroupId(null);
    if (result.error || !result.conversationId) {
      toast.error(result.error || "Không mở được hội thoại");
      return;
    }
    onOpenConversation?.(result.conversationId, {
      name: group.name,
      avatarUrl: group.avatarUrl,
      pageId: selectedPage?.externalPageId ?? "",
    });
    onClose();
  }

  return (
    <Modal open={open} onClose={onClose} title="Danh sách nhóm">
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

            <div className="relative mb-3 shrink-0">
              <BsSearch className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Tìm theo tên nhóm"
                className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 pl-9 pr-3 text-sm text-slate-900 placeholder:text-slate-400 transition-colors focus:outline-none focus:ring-2 focus:ring-primary/40 focus:bg-white"
              />
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto">
              {loading && <p className="py-6 text-center text-sm text-slate-400">Đang tải...</p>}
              {!loading && filteredGroups && (
                <div className="divide-y divide-slate-100">
                  {filteredGroups.map((g) => (
                    <div key={g.groupId} className="flex items-center gap-3 py-2.5">
                      {g.avatarUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={g.avatarUrl}
                          alt={g.name}
                          className="h-9 w-9 shrink-0 rounded-full object-cover"
                        />
                      ) : (
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-300 text-xs font-bold text-white">
                          {g.name.charAt(0).toUpperCase()}
                        </span>
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm text-slate-800">{g.name}</p>
                        <p className="text-xs text-slate-400">{g.memberCount} thành viên</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleMessage(g)}
                        disabled={openingGroupId !== null}
                        aria-label={`Nhắn tin vào nhóm ${g.name}`}
                        className="flex shrink-0 items-center gap-1.5 rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-semibold text-slate-600 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40 cursor-pointer"
                      >
                        {openingGroupId === g.groupId ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <BsChatDotsFill className="h-3.5 w-3.5" />
                        )}
                        Nhắn tin
                      </button>
                    </div>
                  ))}
                  {filteredGroups.length === 0 && (
                    <p className="py-6 text-center text-sm text-slate-400">
                      {search.trim()
                        ? "Không tìm thấy nhóm nào khớp."
                        : "Chưa tham gia nhóm nào, hoặc không lấy được danh sách (Zalo có thể đã mất phiên đăng nhập)."}
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
