"use client";

import * as React from "react";
import { BsCheck2, BsChevronDown, BsPersonFill, BsPersonPlusFill } from "react-icons/bs";
import { cn } from "@/lib/utils";
import type { ShopMember } from "@/types/shopMember";

const MEMBER_AVATAR_COLORS = [
  "bg-blue-500",
  "bg-violet-500",
  "bg-amber-500",
  "bg-emerald-500",
  "bg-pink-500",
  "bg-indigo-500",
  "bg-lime-600",
];

function colorFor(seed: string) {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) hash = (hash * 31 + seed.charCodeAt(i)) | 0;
  return MEMBER_AVATAR_COLORS[Math.abs(hash) % MEMBER_AVATAR_COLORS.length];
}

// Avatar tròn nhỏ của 1 nhân viên — ảnh thật nếu có, không thì chữ cái đầu
// tên trên nền màu cố định theo id (cùng 1 người luôn cùng 1 màu ở mọi nơi).
// Dùng chung cho nút chọn người phụ trách (ChatHeader) và chip trong danh
// sách hội thoại (ConversationList).
export function MemberAvatar({
  member,
  size = "sm",
}: {
  member: ShopMember["user"];
  size?: "xs" | "sm";
}) {
  const dimension = size === "xs" ? "h-4 w-4 text-[8px]" : "h-6 w-6 text-[10px]";
  if (member.avatarUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={member.avatarUrl}
        alt={member.name}
        className={cn("shrink-0 rounded-full object-cover", dimension)}
      />
    );
  }
  return (
    <span
      className={cn(
        "flex shrink-0 items-center justify-center rounded-full font-bold text-white",
        dimension,
        colorFor(member.id)
      )}
    >
      {member.name.charAt(0).toUpperCase()}
    </span>
  );
}

interface AssigneePickerProps {
  members: ShopMember[];
  assigneeId?: string;
  myUserId: string;
  // userId = giao cho người đó, null = bỏ phân công.
  onAssign: (userId: string | null) => void;
}

// Nút "Phụ trách" ở đầu khung chat — hiện người đang phụ trách, bấm mở danh
// sách nhân viên để giao/đổi/bỏ phân công. Không tự lọc người không có quyền
// với Page này (client không biết allowedPages của từng người theo Page đang
// xem) — server kiểm tra và báo lỗi rõ nếu giao nhầm, xem
// conversationAssignment.controller.ts.
export function AssigneePicker({ members, assigneeId, myUserId, onAssign }: AssigneePickerProps) {
  const [open, setOpen] = React.useState(false);
  const rootRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (!open) return;
    function handleClickOutside(e: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    }
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKey);
    };
  }, [open]);

  const assignee = assigneeId ? members.find((m) => m.user.id === assigneeId) : undefined;
  // Có assigneeId nhưng không còn trong danh sách thành viên = người đó đã rời
  // Shop — vẫn hiện trạng thái "đã phân công" thay vì giả vờ chưa ai nhận.
  const assignedToUnknown = !!assigneeId && !assignee;

  function choose(userId: string | null) {
    setOpen(false);
    if (userId === (assigneeId ?? null)) return;
    onAssign(userId);
  }

  const me = members.find((m) => m.user.id === myUserId);
  const others = members.filter((m) => m.user.id !== myUserId);

  return (
    <div ref={rootRef} className="relative shrink-0">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        title={assignee ? `Đang phụ trách: ${assignee.user.name}` : "Chưa có ai phụ trách — bấm để phân công"}
        aria-haspopup="listbox"
        aria-expanded={open}
        className={cn(
          "flex h-8 items-center gap-1.5 rounded-full border px-2 text-xs font-medium transition-colors cursor-pointer",
          assignee || assignedToUnknown
            ? "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
            : "border-dashed border-slate-300 text-slate-400 hover:border-slate-400 hover:text-slate-600"
        )}
      >
        {assignee ? (
          <MemberAvatar member={assignee.user} />
        ) : (
          <BsPersonPlusFill className="h-3.5 w-3.5" />
        )}
        <span className="hidden max-w-[110px] truncate sm:inline">
          {assignee ? assignee.user.name : assignedToUnknown ? "Nhân viên cũ" : "Phân công"}
        </span>
        <BsChevronDown className={cn("h-2.5 w-2.5 transition-transform", open && "rotate-180")} />
      </button>

      {open && (
        <div
          role="listbox"
          className="absolute right-0 top-full z-30 mt-1 w-60 overflow-hidden rounded-xl border border-slate-200 bg-white py-1 shadow-lg"
        >
          <p className="px-3 pb-1 pt-1.5 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
            Giao cho
          </p>
          {me && <MemberOption member={me} isMe selected={me.user.id === assigneeId} onChoose={choose} />}
          {others.map((m) => (
            <MemberOption key={m.id} member={m} selected={m.user.id === assigneeId} onChoose={choose} />
          ))}
          {members.length === 0 && <p className="px-3 py-2 text-sm text-slate-400">Chưa có nhân viên nào.</p>}
          {(assigneeId || assignedToUnknown) && (
            <>
              <div className="my-1 border-t border-slate-100" />
              <button
                type="button"
                onClick={() => choose(null)}
                className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-slate-600 transition-colors hover:bg-slate-50 cursor-pointer"
              >
                <BsPersonFill className="h-3.5 w-3.5 text-slate-400" />
                Bỏ phân công
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}

function MemberOption({
  member,
  isMe,
  selected,
  onChoose,
}: {
  member: ShopMember;
  isMe?: boolean;
  selected: boolean;
  onChoose: (userId: string) => void;
}) {
  return (
    <button
      type="button"
      role="option"
      aria-selected={selected}
      onClick={() => onChoose(member.user.id)}
      className={cn(
        "flex w-full items-center gap-2 px-3 py-2 text-left text-sm transition-colors hover:bg-slate-50 cursor-pointer",
        selected && "bg-primary/5"
      )}
    >
      <MemberAvatar member={member.user} />
      <span className="min-w-0 flex-1 truncate text-slate-800">
        {member.user.name}
        {isMe && <span className="ml-1 text-xs text-slate-400">(tôi)</span>}
      </span>
      {selected && <BsCheck2 className="h-4 w-4 shrink-0 text-primary" />}
    </button>
  );
}
