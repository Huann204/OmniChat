"use client";

import * as React from "react";
import { BsExclamationTriangleFill, BsSearch } from "react-icons/bs";
import { Loader2 } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { cn } from "@/lib/utils";
import { CHANNEL_META } from "@/lib/bot-channel";
import { assignChatbotPages, getChatbotPages } from "@/app/actions/chatbotConfig";
import { toast } from "@/store/toast-store";
import type { Bot } from "@/types/bot";

// Chọn Page dùng chatbot này — bố cục lưới thẻ + checkbox mượn nguyên phong
// cách MergePagesModal.tsx (avatar, tên, kênh, tick chọn, tìm kiếm), chỉ
// khác hành động lúc xác nhận: gọi assignChatbotPages thay vì set cookie gộp
// trang. Page đang thuộc BOT KHÁC vẫn chọn được (ghi đè, xem
// chatbotConfig.controller.ts#assignChatbotPages) nhưng hiện cảnh báo rõ để
// tránh gán nhầm.

const AVATAR_COLORS = [
  "bg-blue-500",
  "bg-violet-500",
  "bg-amber-500",
  "bg-emerald-500",
  "bg-pink-500",
  "bg-indigo-500",
  "bg-lime-600",
  "bg-sky-500",
];

interface AssignChatbotPagesModalProps {
  open: boolean;
  onClose: () => void;
  chatbotId: string;
  chatbotName: string;
  pages: Bot[];
  // Tên bot khác đang gán cho từng pageId (nếu có) — chỉ để hiện cảnh báo,
  // không phải nguồn dữ liệu chính (đó là pages[].chatbotId).
  chatbotNameById: Record<string, string>;
  onAssigned: (pageIds: string[]) => void;
}

export function AssignChatbotPagesModal({
  open,
  onClose,
  chatbotId,
  chatbotName,
  pages,
  chatbotNameById,
  onAssigned,
}: AssignChatbotPagesModalProps) {
  const [search, setSearch] = React.useState("");
  const [selectedIds, setSelectedIds] = React.useState<Set<string>>(new Set());
  const [prevOpen, setPrevOpen] = React.useState(open);
  const [loading, setLoading] = React.useState(false);
  const [saving, setSaving] = React.useState(false);

  // Mở modal thì tự tải lại đúng lựa chọn hiện tại của bot này — reset trước,
  // tránh giữ state cũ từ lần mở trước (đồng bộ ngay trong render, giống
  // MergePagesModal.tsx, tránh phải qua effect).
  if (open !== prevOpen) {
    setPrevOpen(open);
    if (open) {
      setSearch("");
      setSelectedIds(new Set());
      setLoading(true);
      void getChatbotPages(chatbotId).then((pageIds) => {
        setSelectedIds(new Set(pageIds));
        setLoading(false);
      });
    }
  }

  const filteredPages = React.useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return pages;
    return pages.filter(
      (p) => p.name.toLowerCase().includes(query) || p.pageId.toLowerCase().includes(query)
    );
  }, [pages, search]);

  function toggleOne(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function handleConfirm() {
    setSaving(true);
    const result = await assignChatbotPages(chatbotId, Array.from(selectedIds));
    setSaving(false);
    if (result.error) {
      toast.error(result.error);
      return;
    }
    onAssigned(Array.from(selectedIds));
    onClose();
  }

  return (
    <Modal open={open} onClose={onClose} title={`Chọn Page cho "${chatbotName}"`} className="max-w-5xl">
      <div className="flex min-h-[60vh] flex-col">
        <div className="flex shrink-0 items-center justify-between gap-4 px-5 py-3">
          <span className="text-sm text-slate-500">
            Đã chọn <span className="font-semibold text-slate-800">{selectedIds.size}</span> Page
          </span>
          <div className="relative w-56">
            <BsSearch className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Tìm kiếm Page"
              className="w-full rounded-lg border border-slate-200 bg-slate-50 py-1.5 pl-8 pr-3 text-xs text-slate-900 placeholder:text-slate-400 transition-colors focus:outline-none focus:ring-2 focus:ring-primary/40 focus:bg-white"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-5 pb-4 pt-1">
          {loading ? (
            <div className="flex h-40 items-center justify-center text-slate-400">
              <Loader2 className="h-5 w-5 animate-spin" />
            </div>
          ) : filteredPages.length === 0 ? (
            <p className="mt-10 text-center text-sm text-slate-400">
              Chưa kết nối Page nào, hoặc không khớp tìm kiếm.
            </p>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {filteredPages.map((page, index) => {
                const active = selectedIds.has(page.id);
                const avatarColor = AVATAR_COLORS[index % AVATAR_COLORS.length];
                const channelMeta = CHANNEL_META[page.channel];
                const ChannelIcon = channelMeta?.icon;
                // Đang thuộc bot khác (không phải bot đang mở modal này) —
                // chọn vẫn được (ghi đè) nhưng cảnh báo rõ trước khi bấm.
                const otherBotName =
                  page.chatbotId && page.chatbotId !== chatbotId
                    ? chatbotNameById[page.chatbotId]
                    : undefined;

                return (
                  <button
                    key={page.id}
                    type="button"
                    onClick={() => toggleOne(page.id)}
                    className={cn(
                      "relative flex w-full items-center gap-3.5 rounded-2xl border p-4 pr-9 text-left transition-all cursor-pointer",
                      active
                        ? "border-blue-300/60 bg-[#dbeafe]"
                        : "border-slate-200 bg-white hover:border-slate-300 shadow-sm"
                    )}
                  >
                    <span
                      className={cn(
                        "flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-full text-xl font-bold text-white shadow-xs",
                        avatarColor
                      )}
                    >
                      {page.avatarUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={page.avatarUrl}
                          alt={page.name}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        page.name.charAt(0).toUpperCase()
                      )}
                    </span>

                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[15px] font-medium text-slate-800 leading-snug">
                        {page.name}
                      </span>
                      <span className="mt-1 flex items-center gap-1.5 text-xs font-medium text-slate-500">
                        {ChannelIcon && (
                          <ChannelIcon className="h-4 w-4 shrink-0 object-contain" />
                        )}
                        <span className="truncate">{page.pageId}</span>
                      </span>
                      {otherBotName && (
                        <span className="mt-1 flex items-center gap-1 text-xs font-medium text-amber-600">
                          <BsExclamationTriangleFill className="h-3 w-3 shrink-0" />
                          <span className="truncate">Đang dùng: {otherBotName}</span>
                        </span>
                      )}
                    </span>

                    {active && (
                      <span className="absolute top-3.5 right-3.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#2563eb] text-white">
                        <svg viewBox="0 0 24 24" fill="none" className="h-3.5 w-3.5">
                          <path
                            d="M5 13l4 4L19 7"
                            stroke="currentColor"
                            strokeWidth={3}
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <div className="flex shrink-0 items-center justify-end gap-3 border-t border-slate-200 px-5 py-3.5">
          <button
            type="button"
            onClick={onClose}
            className="cursor-pointer rounded-lg px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100"
          >
            Huỷ
          </button>
          <button
            type="button"
            onClick={() => void handleConfirm()}
            disabled={saving || loading}
            className="inline-flex cursor-pointer items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-50"
          >
            {saving && <Loader2 className="h-4 w-4 animate-spin" />}
            Lưu lựa chọn
          </button>
        </div>
      </div>
    </Modal>
  );
}
