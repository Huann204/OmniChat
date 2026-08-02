"use client";

import * as React from "react";
import { CheckSquare, GitMerge, Plus, Search, SlidersHorizontal, Square } from "lucide-react";
import { FaFacebook } from "react-icons/fa";
import { Modal } from "@/components/ui/Modal";
import { cn } from "@/lib/utils";
import { toast } from "@/store/toast-store";
import type { Bot } from "@/types/bot";

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

interface MergePagesModalProps {
  open: boolean;
  onClose: () => void;
  bots: Bot[];
}

export function MergePagesModal({ open, onClose, bots }: MergePagesModalProps) {
  const [search, setSearch] = React.useState("");
  const [selectedIds, setSelectedIds] = React.useState<Set<string>>(new Set());
  const [prevOpen, setPrevOpen] = React.useState(open);

  const pages = React.useMemo(() => bots.filter((b) => b.channel === "facebook"), [bots]);

  // Reset lại lựa chọn mỗi lần mở modal, tránh giữ state cũ từ lần gộp trước.
  // Đồng bộ ngay trong lúc render (thay vì effect) để tránh render thừa —
  // theo cùng cách BotDashboard đồng bộ initialBots.
  if (open !== prevOpen) {
    setPrevOpen(open);
    if (open) {
      setSelectedIds(new Set(pages.map((p) => p.id)));
      setSearch("");
    }
  }

  const filteredPages = React.useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return pages;
    return pages.filter(
      (p) => p.name.toLowerCase().includes(query) || p.pageId.toLowerCase().includes(query)
    );
  }, [pages, search]);

  const allFilteredSelected =
    filteredPages.length > 0 && filteredPages.every((p) => selectedIds.has(p.id));

  React.useEffect(() => {
    if (!open) return;
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "a") {
        e.preventDefault();
        toggleSelectAll();
      }
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, filteredPages, allFilteredSelected]);

  function toggleOne(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleSelectAll() {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (allFilteredSelected) {
        filteredPages.forEach((p) => next.delete(p.id));
      } else {
        filteredPages.forEach((p) => next.add(p.id));
      }
      return next;
    });
  }

  function handleConfirm() {
    toast.info(`Đã chọn ${selectedIds.size} trang để gộp — tính năng đang được phát triển`);
    onClose();
  }

  return (
    <Modal open={open} onClose={onClose} title="Chế độ gộp trang" className="max-w-5xl">
      <div className="flex min-h-[70vh] flex-col">
        <div className="flex shrink-0 items-center justify-between gap-4 border-b border-slate-200 px-5">
          <button
            type="button"
            className="relative cursor-pointer border-b-2 border-slate-900 py-3 text-sm font-semibold text-slate-900"
          >
            Mặc định
            <span className="absolute -right-3.5 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold leading-none text-white">
              {selectedIds.size}
            </span>
          </button>
          <button
            type="button"
            onClick={() => toast.info("Tính năng nhiều nhóm gộp đang được phát triển")}
            aria-label="Thêm nhóm gộp"
            className="cursor-pointer rounded-full p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>

        <div className="flex shrink-0 items-center justify-between gap-4 px-5 py-3">
          <label className="flex cursor-pointer items-center gap-2 text-sm text-slate-700 select-none">
            <input
              type="checkbox"
              checked={allFilteredSelected}
              onChange={toggleSelectAll}
              className="h-4 w-4 cursor-pointer rounded border-slate-300 text-primary focus:ring-primary/40"
            />
            Chọn tất cả các trang
          </label>

          <div className="flex items-center gap-2">
            <div className="relative w-56">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Tìm kiếm trang"
                className="w-full rounded-lg border border-slate-200 bg-slate-50 py-1.5 pl-8 pr-3 text-xs text-slate-900 placeholder:text-slate-400 transition-colors focus:outline-none focus:ring-2 focus:ring-primary/40 focus:bg-white"
              />
            </div>
            <button
              type="button"
              aria-label="Bộ lọc"
              className="flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-lg border border-slate-200 text-slate-400 transition-colors hover:bg-slate-50 hover:text-slate-600"
            >
              <SlidersHorizontal className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-5 pb-4 pt-3">
          {filteredPages.length === 0 ? (
            <p className="mt-10 text-center text-sm text-slate-400">
              Không tìm thấy trang nào khớp với tìm kiếm.
            </p>
          ) : (
            <div className="flex flex-wrap gap-3">
              {filteredPages.map((page, index) => {
                const active = selectedIds.has(page.id);
                const avatarColor = AVATAR_COLORS[index % AVATAR_COLORS.length];
                return (
                  <button
                    key={page.id}
                    type="button"
                    onClick={() => toggleOne(page.id)}
                    className={cn(
                      "relative flex w-full items-center gap-3 rounded-xl border p-3 pr-6 text-left transition-colors cursor-pointer sm:w-[280px]",
                      active
                        ? "border-blue-200 bg-blue-50"
                        : "border-slate-200 bg-white hover:border-slate-300"
                    )}
                  >
                    <span
                      className={cn(
                        "flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-full text-base font-bold text-white",
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
                      <span className="block truncate text-sm font-semibold text-slate-900">
                        {page.name}
                      </span>
                      <span className="mt-0.5 flex items-center gap-1.5 text-xs text-slate-400">
                        <FaFacebook className="h-3.5 w-3.5 shrink-0 text-[#0866FF]" />
                        <span className="truncate">{page.pageId}</span>
                      </span>
                    </span>

                    <span
                      className={cn(
                        "absolute -right-1.5 -top-1.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full ring-2 ring-white transition-colors",
                        active ? "bg-primary text-white" : "border border-slate-300 bg-white"
                      )}
                    >
                      {active && (
                        <svg viewBox="0 0 24 24" fill="none" className="h-3 w-3">
                          <path
                            d="M5 13l4 4L19 7"
                            stroke="currentColor"
                            strokeWidth={3}
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      )}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <div className="flex shrink-0 items-center justify-between gap-4 border-t border-slate-200 px-5 py-3.5">
          <button
            type="button"
            onClick={toggleSelectAll}
            className="inline-flex cursor-pointer items-center gap-2 text-sm font-medium text-slate-600 hover:text-slate-800"
          >
            {allFilteredSelected ? (
              <CheckSquare className="h-4 w-4" />
            ) : (
              <Square className="h-4 w-4" />
            )}
            Chọn tất cả / bỏ chọn
            <span className="ml-1 flex items-center gap-1">
              <kbd className="rounded border border-slate-200 bg-slate-100 px-1.5 py-0.5 text-[11px] font-semibold text-slate-500">
                ⌘
              </kbd>
              <kbd className="rounded border border-slate-200 bg-slate-100 px-1.5 py-0.5 text-[11px] font-semibold text-slate-500">
                A
              </kbd>
            </span>
          </button>

          <button
            type="button"
            onClick={handleConfirm}
            disabled={selectedIds.size < 2}
            className="inline-flex cursor-pointer items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-50"
          >
            <GitMerge className="h-4 w-4" />
            Vào chế độ gộp trang
          </button>
        </div>
      </div>
    </Modal>
  );
}
