"use client";

import { GitMerge, Plus, RotateCw, Search } from "lucide-react";

interface DashboardToolbarProps {
  search: string;
  onSearchChange: (value: string) => void;
}

export function DashboardToolbar({ search, onSearchChange }: DashboardToolbarProps) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="relative w-full sm:max-w-sm">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Tìm kiếm..."
          className="w-full rounded-lg border border-slate-200 bg-slate-50 py-2 pl-9 pr-3 text-sm text-slate-900 placeholder:text-slate-400 transition-colors focus:outline-none focus:ring-2 focus:ring-primary/40 focus:bg-white"
        />
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          aria-label="Làm mới"
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-500 transition-colors hover:bg-slate-50 hover:text-slate-700 cursor-pointer"
        >
          <RotateCw className="h-4 w-4" />
        </button>
        <button
          type="button"
          className="inline-flex items-center gap-1.5 rounded-lg border bg-[#eaecf0] border-slate-200 px-3.5 py-2 text-sm font-semibold text-[#344054] transition-colors hover:bg-[#dde2eb] cursor-pointer"
        >
          <Plus className="h-4 w-4" />
          Kết nối
        </button>
        <button
          type="button"
          className="inline-flex items-center gap-1.5 rounded-lg bg-[#eaecf0] px-3.5 py-2 text-sm font-semibold text-[#344054] transition-colors hover:bg-[#dde2eb] cursor-pointer"
        >
          <GitMerge className="h-4 w-4" />
          Gộp trang
        </button>
      </div>
    </div>
  );
}
