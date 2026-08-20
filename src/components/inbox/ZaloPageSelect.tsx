"use client";

import * as React from "react";
import { BsChevronDown } from "react-icons/bs";

export interface ZaloPageOption {
  // id Mongo của ConnectedPage — dùng để gọi API /zalo/:pageId/... (khác
  // externalPageId bên dưới).
  id: string;
  name: string;
  avatarUrl?: string;
  // id Zalo THẬT của Page (ConnectedPage.pageId phía server) — cần để gán
  // đúng Conversation.pageId khi mở hội thoại mới từ danh sách bạn bè (xem
  // ZaloFriendListModal#handleMessage), khớp đúng key mà `pagesById` trong
  // ConversationList dùng để tra tên/avatar Page nguồn (khác id Mongo).
  externalPageId: string;
}

// Dropdown chọn Page Zalo có avatar — thay cho <select> gốc (không hiện được
// ảnh), cần thiết khi 2 Page trùng tên nhau, avatar là cách duy nhất phân
// biệt được. Dùng chung cho ZaloAddFriendModal/ZaloFriendListModal.
export function ZaloPageSelect({
  pages,
  value,
  onChange,
}: {
  pages: ZaloPageOption[];
  value: string;
  onChange: (id: string) => void;
}) {
  const [open, setOpen] = React.useState(false);
  const ref = React.useRef<HTMLDivElement>(null);
  const selected = pages.find((p) => p.id === value) ?? pages[0];

  React.useEffect(() => {
    if (!open) return;
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 transition-colors hover:bg-slate-50 cursor-pointer"
      >
        {selected?.avatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={selected.avatarUrl}
            alt={selected.name}
            className="h-5 w-5 shrink-0 rounded-full object-cover"
          />
        ) : (
          <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-slate-300 text-[9px] font-bold text-white">
            {selected?.name.charAt(0).toUpperCase()}
          </span>
        )}
        <span className="min-w-0 flex-1 truncate text-left">{selected?.name}</span>
        <BsChevronDown className="h-3 w-3 shrink-0 text-slate-400" />
      </button>

      {open && (
        <div className="absolute left-0 right-0 top-full z-20 mt-1.5 max-h-56 overflow-y-auto rounded-xl border border-slate-200 bg-white py-1.5 shadow-xl">
          {pages.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => {
                onChange(p.id);
                setOpen(false);
              }}
              className="flex w-full items-center gap-2.5 px-3.5 py-2 text-left text-sm text-slate-700 transition-colors hover:bg-slate-50 cursor-pointer"
            >
              {p.avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={p.avatarUrl}
                  alt={p.name}
                  className="h-6 w-6 shrink-0 rounded-full object-cover"
                />
              ) : (
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-slate-300 text-[10px] font-bold text-white">
                  {p.name.charAt(0).toUpperCase()}
                </span>
              )}
              <span className="min-w-0 flex-1 truncate">{p.name}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
