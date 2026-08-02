"use client";

import * as React from "react";
import { MessageSquareQuote, PackageX, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/Button";

type InfoTab = "info" | "order";

interface CustomerInfoPanelProps {
  hasActiveConversation?: boolean;
}

export function CustomerInfoPanel({ hasActiveConversation = true }: CustomerInfoPanelProps) {
  const [tab, setTab] = React.useState<InfoTab>("info");
  const [note, setNote] = React.useState("");

  if (!hasActiveConversation) {
    return (
      <div className="flex w-[320px] shrink-0 items-center justify-center border-l border-slate-200 bg-white">
        <p className="text-sm text-slate-400">Chưa có thông tin khách hàng</p>
      </div>
    );
  }

  return (
    <div className="flex w-[27%] shrink-0 flex-col border-l border-slate-200 bg-white">
      <div className="flex border-b border-slate-200">
        <button
          type="button"
          onClick={() => setTab("info")}
          className={cn(
            "flex-1 border-b-2 py-3 text-sm font-semibold transition-colors cursor-pointer",
            tab === "info" ? "border-primary text-primary" : "border-transparent text-slate-400 hover:text-slate-600"
          )}
        >
          Thông tin
        </button>
        <button
          type="button"
          onClick={() => setTab("order")}
          className={cn(
            "flex-1 border-b-2 py-3 text-sm font-semibold transition-colors cursor-pointer",
            tab === "order" ? "border-primary text-primary" : "border-transparent text-slate-400 hover:text-slate-600"
          )}
        >
          Tạo đơn
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        <div className="flex flex-col items-center gap-3 rounded-xl bg-slate-50 p-4">
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-white text-primary shadow-sm">
            <MessageSquareQuote className="h-6 w-6" />
          </span>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                setNote("");
              }
            }}
            placeholder="Nhập ghi chú (Enter để gửi)"
            rows={2}
            className="w-full resize-none rounded-lg border border-slate-200 bg-white p-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/40"
          />
        </div>

        <h3 className="mt-6 text-sm font-semibold text-slate-700">Đơn hàng</h3>

        <div className="mt-3 flex flex-col items-center gap-3 rounded-xl border border-dashed border-slate-200 py-8">
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-400">
            <PackageX className="h-6 w-6" />
          </span>
          <p className="text-sm text-slate-400">Chưa có lịch sử đơn hàng</p>
          <Button size="sm" onClick={() => setTab("order")}>
            <Plus className="mr-1.5 h-4 w-4" />
            Tạo đơn
          </Button>
        </div>
      </div>
    </div>
  );
}
