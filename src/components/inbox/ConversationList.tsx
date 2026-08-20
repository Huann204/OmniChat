"use client";

import * as React from "react";
import {
  BsSearch,
  BsSliders,
  BsFillPeopleFill,
  BsX,
  BsPlusLg,
  BsPersonPlusFill,
  BsEnvelopeFill,
  BsPeopleFill,
  BsPlusCircleFill,
} from "react-icons/bs";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { CHANNEL_META } from "@/lib/bot-channel";
import type { Conversation } from "@/types/conversation";
import { getLastMessagePreview } from "@/lib/message-format";
import { ZaloAddFriendModal } from "./ZaloAddFriendModal";
import { ZaloCreateGroupModal } from "./ZaloCreateGroupModal";
import { ZaloFriendListModal } from "./ZaloFriendListModal";
import { ZaloFriendRequestsModal } from "./ZaloFriendRequestsModal";
import { ZaloGroupListModal } from "./ZaloGroupListModal";
import type { ZaloPageOption } from "./ZaloPageSelect";

// Mirror ngưỡng cuộn của MessageThread.tsx (LOAD_MORE_SCROLL_THRESHOLD) —
// khác chiều: đây là cuộn XUỐNG cuối (tải hội thoại cũ hơn), không phải cuộn
// LÊN đầu (tải tin nhắn cũ hơn).
const LOAD_MORE_SCROLL_THRESHOLD = 80;

// Khớp CHANNEL_TYPE_* trong server/src/models/connectedPage.model.ts — không
// có package dùng chung giữa 2 repo nên phải giữ đồng bộ thủ công (xem
// channelFromType trong lib/dal.ts, cùng quy ước).
const CHANNEL_META_BY_TYPE = {
  0: CHANNEL_META.facebook,
  1: CHANNEL_META.zalo,
  2: CHANNEL_META.telegram,
} as const;

const AVATAR_COLORS = [
  "bg-blue-500",
  "bg-violet-500",
  "bg-amber-500",
  "bg-emerald-500",
  "bg-pink-500",
  "bg-indigo-500",
  "bg-lime-600",
];

interface PageInfo {
  name: string;
  avatarUrl?: string;
}

interface ConversationListProps {
  conversations: Conversation[];
  activeId: string | null;
  search: string;
  // Gõ là đổi state ngay (InboxView tự debounce 400ms rồi mới gọi API tìm
  // kiếm xuyên suốt toàn bộ hội thoại — xem InboxView.tsx). `conversations`
  // truyền vào đây LUÔN là danh sách đúng cần hiện (không tự lọc gì thêm ở
  // component này).
  onSearchChange: (value: string) => void;
  searching?: boolean;
  onSelect: (id: string) => void;
  // Chỉ truyền khi đang xem gộp nhiều Page — hiện avatar + tên Page nguồn
  // bên dưới mỗi hội thoại để phân biệt hội thoại đến từ Page nào.
  pagesById?: Record<string, PageInfo>;
  className?: string;
  // Phân trang danh sách hội thoại — cuộn xuống cuối tải thêm (xem
  // InboxView.tsx#handleLoadMoreConversations).
  hasMore?: boolean;
  onLoadMore?: () => void;
  loadingMore?: boolean;
  // Page Zalo cá nhân đang kết nối (id Mongo, không phải id Zalo thật) — dùng
  // cho nút "+" (Danh sách bạn bè/Kết bạn, xem ZaloFriendListModal/
  // ZaloAddFriendModal). Rỗng thì không hiện nút "+".
  zaloPages?: ZaloPageOption[];
  // Bấm "Nhắn tin" cạnh 1 người trong ZaloFriendListModal — mở/tạo hội thoại
  // với người đó trong Livechat, xem InboxView.tsx#handleOpenZaloConversation.
  onOpenConversation?: (
    conversationId: string,
    preview: { name: string; avatarUrl?: string; pageId: string }
  ) => void;
}

export function ConversationList({
  conversations,
  activeId,
  search,
  onSearchChange,
  searching,
  onSelect,
  pagesById,
  className,
  hasMore,
  onLoadMore,
  loadingMore,
  zaloPages = [],
  onOpenConversation,
}: ConversationListProps) {
  const [menuOpen, setMenuOpen] = React.useState(false);
  const [addFriendOpen, setAddFriendOpen] = React.useState(false);
  const [friendListOpen, setFriendListOpen] = React.useState(false);
  const [friendRequestsOpen, setFriendRequestsOpen] = React.useState(false);
  const [groupListOpen, setGroupListOpen] = React.useState(false);
  const [createGroupOpen, setCreateGroupOpen] = React.useState(false);
  const menuRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (!menuOpen) return;
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [menuOpen]);

  function handleScroll(e: React.UIEvent<HTMLDivElement>) {
    if (!hasMore || !onLoadMore || loadingMore) return;
    const el = e.currentTarget;
    const distanceFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
    if (distanceFromBottom < LOAD_MORE_SCROLL_THRESHOLD) {
      onLoadMore();
    }
  }

  return (
    <div
      className={cn(
        "flex flex-col border-r border-slate-200 bg-white md:w-[25%] xl:w-[400px] shrink-0 h-full",
        activeId ? "hidden md:flex" : "flex w-full md:w-[25%] xl:w-[400px]",
        className
      )}
    >
      <div className="flex items-center gap-2 border-b border-slate-100 p-3">
        <div className="relative flex-1">
          {searching ? (
            <Loader2 className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-slate-400" />
          ) : (
            <BsSearch className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          )}
          <input
            type="text"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Tìm kiếm"
            className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 pl-9 pr-8 text-base sm:text-sm text-slate-900 placeholder:text-slate-400 transition-colors focus:outline-none focus:ring-2 focus:ring-primary/40 focus:bg-white"
          />
          {search && (
            <button
              type="button"
              onClick={() => onSearchChange("")}
              aria-label="Xóa tìm kiếm"
              className="absolute right-2 top-1/2 flex h-5 w-5 -translate-y-1/2 items-center justify-center rounded-full text-slate-400 transition-colors hover:bg-slate-200 hover:text-slate-600 cursor-pointer"
            >
              <BsX className="h-4 w-4" />
            </button>
          )}
        </div>
        <button
          type="button"
          className="flex shrink-0 items-center gap-1.5 rounded-xl border border-slate-200 px-2.5 py-2 text-xs font-semibold text-slate-600 transition-colors hover:bg-slate-50 cursor-pointer"
        >
          <BsSliders className="h-3.5 w-3.5" />
          Lọc theo
        </button>

        {zaloPages.length > 0 && (
          <div ref={menuRef} className="relative shrink-0">
            <button
              type="button"
              onClick={() => setMenuOpen((v) => !v)}
              aria-label="Thêm"
              className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 text-slate-600 transition-colors hover:bg-slate-50 cursor-pointer"
            >
              <BsPlusLg className="h-4 w-4" />
            </button>

            {menuOpen && (
              <div className="absolute right-0 top-full z-20 mt-1.5 w-52 rounded-xl border border-slate-200 bg-white py-1.5 shadow-xl">
                <button
                  type="button"
                  onClick={() => {
                    setMenuOpen(false);
                    setFriendListOpen(true);
                  }}
                  className="flex w-full items-center gap-2.5 px-3.5 py-2 text-left text-sm text-slate-700 transition-colors hover:bg-slate-50 cursor-pointer"
                >
                  <BsFillPeopleFill className="h-4 w-4 text-slate-400" />
                  Danh sách bạn bè
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setMenuOpen(false);
                    setGroupListOpen(true);
                  }}
                  className="flex w-full items-center gap-2.5 px-3.5 py-2 text-left text-sm text-slate-700 transition-colors hover:bg-slate-50 cursor-pointer"
                >
                  <BsPeopleFill className="h-4 w-4 text-slate-400" />
                  Nhóm
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setMenuOpen(false);
                    setAddFriendOpen(true);
                  }}
                  className="flex w-full items-center gap-2.5 px-3.5 py-2 text-left text-sm text-slate-700 transition-colors hover:bg-slate-50 cursor-pointer"
                >
                  <BsPersonPlusFill className="h-4 w-4 text-slate-400" />
                  Kết bạn
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setMenuOpen(false);
                    setFriendRequestsOpen(true);
                  }}
                  className="flex w-full items-center gap-2.5 px-3.5 py-2 text-left text-sm text-slate-700 transition-colors hover:bg-slate-50 cursor-pointer"
                >
                  <BsEnvelopeFill className="h-4 w-4 text-slate-400" />
                  Lời mời kết bạn
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setMenuOpen(false);
                    setCreateGroupOpen(true);
                  }}
                  className="flex w-full items-center gap-2.5 px-3.5 py-2 text-left text-sm text-slate-700 transition-colors hover:bg-slate-50 cursor-pointer"
                >
                  <BsPlusCircleFill className="h-4 w-4 text-slate-400" />
                  Tạo nhóm
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      <ZaloAddFriendModal
        open={addFriendOpen}
        onClose={() => setAddFriendOpen(false)}
        zaloPages={zaloPages}
        onOpenConversation={onOpenConversation}
      />
      <ZaloFriendListModal
        open={friendListOpen}
        onClose={() => setFriendListOpen(false)}
        zaloPages={zaloPages}
        onOpenConversation={onOpenConversation}
      />
      <ZaloFriendRequestsModal
        open={friendRequestsOpen}
        onClose={() => setFriendRequestsOpen(false)}
        zaloPages={zaloPages}
        onOpenConversation={onOpenConversation}
      />
      <ZaloGroupListModal
        open={groupListOpen}
        onClose={() => setGroupListOpen(false)}
        zaloPages={zaloPages}
        onOpenConversation={onOpenConversation}
      />
      <ZaloCreateGroupModal
        open={createGroupOpen}
        onClose={() => setCreateGroupOpen(false)}
        zaloPages={zaloPages}
        onOpenConversation={onOpenConversation}
      />

      <div
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
      >
        {conversations.length === 0 && (
          <p className="mt-10 text-center text-sm text-slate-400">Chưa có hội thoại nào</p>
        )}

        {conversations.map((conversation, index) => {
          const preview = getLastMessagePreview(conversation);
          const isActive = conversation.id === activeId;
          const avatarColor = AVATAR_COLORS[index % AVATAR_COLORS.length];
          const page = pagesById?.[conversation.pageId];
          const channelMeta =
            CHANNEL_META_BY_TYPE[conversation.type as keyof typeof CHANNEL_META_BY_TYPE];

          return (
            <button
              key={conversation.id}
              type="button"
              onClick={() => onSelect(conversation.id)}
              className={cn(
                "flex w-full items-center gap-3 border-b border-slate-50 px-3 py-3 text-left transition-colors cursor-pointer hover:bg-slate-50",
                isActive && "bg-blue-50 hover:bg-blue-50"
              )}
            >
              <div className="relative shrink-0">
                {conversation.customerAvatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={conversation.customerAvatarUrl}
                    alt={conversation.customerName}
                    className="h-11 w-11 rounded-full object-cover"
                  />
                ) : (
                  <span
                    className={cn(
                      "flex h-11 w-11 items-center justify-center rounded-full text-sm font-bold text-white",
                      avatarColor
                    )}
                  >
                    {conversation.customerName.charAt(0).toUpperCase()}
                  </span>
                )}

                {/* Chấm đỏ báo chưa đọc — góc dưới bên phải avatar. */}
                {!conversation.isRead && (
                  <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full bg-red-500 ring-2 ring-white" />
                )}
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <span className="flex min-w-0 items-center gap-1">
                    {conversation.isGroup && (
                      <BsFillPeopleFill
                        className="h-3.5 w-3.5 shrink-0 text-slate-400"
                        aria-label="Hội thoại nhóm"
                      />
                    )}
                    <span
                      className={cn(
                        "truncate text-sm text-slate-900",
                        !conversation.isRead && "font-bold"
                      )}
                    >
                      {conversation.customerName}
                    </span>
                  </span>
                  <span
                    className={cn(
                      "shrink-0 text-xs text-slate-400",
                      !conversation.isRead && "font-semibold text-slate-600"
                    )}
                  >
                    {conversation.timeLabel}
                  </span>
                </div>
                <p
                  className={cn(
                    "truncate text-xs text-slate-400",
                    !conversation.isRead && "font-semibold text-slate-600"
                  )}
                >
                  {preview}
                </p>

                <div className="mt-1 flex min-h-[20px] items-center gap-1.5">
                  {page && (
                    <div className="flex min-w-0 shrink-0 items-center gap-1.5">
                      {page.avatarUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={page.avatarUrl}
                          alt={page.name}
                          className="h-4 w-4 shrink-0 rounded-full object-cover"
                        />
                      ) : (
                        <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-slate-300 text-[9px] font-bold text-white">
                          {page.name.charAt(0).toUpperCase()}
                        </span>
                      )}
                      <span className="truncate text-[11px] text-slate-400 max-w-[80px]">{page.name}</span>
                    </div>
                  )}

                  {page && conversation.tags.length > 0 && (
                    <div className="h-3 w-px shrink-0 bg-slate-200" />
                  )}

                  {conversation.tags.length > 0 && (
                    <div className="flex min-w-0 flex-1 items-center gap-1">
                      {conversation.tags.slice(0, 1).map((tag) => (
                        <span
                          key={tag.id}
                          style={{ backgroundColor: tag.color }}
                          className="truncate rounded-full px-2 py-0.5 text-[10px] font-semibold text-white max-w-[80px]"
                        >
                          {tag.label}
                        </span>
                      ))}
                      {conversation.tags.length > 1 && (
                        <div className="group/more relative flex shrink-0 items-center">
                          <span className="rounded-full bg-slate-200 px-1.5 py-0.5 text-[10px] font-semibold text-slate-600">
                            +{conversation.tags.length - 1}
                          </span>
                          <div className="pointer-events-none absolute bottom-full left-1/2 z-[999] mb-2 hidden w-max max-w-[200px] -translate-x-1/2 flex-wrap gap-1 rounded-lg border border-slate-200 bg-white p-1.5 shadow-xl group-hover/more:flex">
                            {/* Mũi tên chỉ xuống */}
                            <div className="absolute -bottom-1 left-1/2 -ml-1 h-2 w-2 rotate-45 border-b border-r border-slate-200 bg-white"></div>
                            {conversation.tags.map((tag) => (
                              <span
                                key={tag.id}
                                style={{ backgroundColor: tag.color }}
                                className="relative z-10 rounded-full px-2 py-0.5 text-[10px] font-semibold text-white"
                              >
                                {tag.label}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {page && channelMeta && (
                    <channelMeta.icon className="ml-auto h-3.5 w-3.5 shrink-0 rounded-full object-cover" />
                  )}
                </div>
              </div>

            </button>
          );
        })}

        {loadingMore && (
          <div className="flex items-center justify-center py-3">
            <Loader2 className="h-4 w-4 animate-spin text-slate-400" />
          </div>
        )}
      </div>
    </div>
  );
}
