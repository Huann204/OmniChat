"use client";

import * as React from "react";
import { BsClipboard, BsClipboardCheck } from "react-icons/bs";
import { toast } from "@/store/toast-store";

interface EmbedSnippetBlockProps {
  snippet: string;
}

// Dùng chung cho cả lúc vừa tạo kênh Website (AddConnectionModal.tsx) lẫn mở
// lại xem sau (EditWebsiteWidgetModal.tsx) — nút "Sao chép" nằm RIÊNG 1 thanh
// phía trên, KHÔNG đè lên code (trước đây canh tuyệt đối ngay góc phải code
// bị đè lên đúng đoạn "data-key=..." vì snippet dài tràn hết chiều ngang, xem
// lịch sử sửa lỗi).
export function EmbedSnippetBlock({ snippet }: EmbedSnippetBlockProps) {
  const [copied, setCopied] = React.useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(snippet);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Không sao chép được, vui lòng tự chọn và copy");
    }
  }

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
      <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-3 py-1.5">
        <span className="text-[10px] font-medium uppercase tracking-wide text-slate-400">HTML</span>
        <button
          type="button"
          onClick={handleCopy}
          className="flex cursor-pointer items-center gap-1.5 rounded-md px-2 py-1 text-[11px] font-medium text-slate-600 transition-colors hover:bg-slate-200"
        >
          {copied ? <BsClipboardCheck className="h-3 w-3" /> : <BsClipboard className="h-3 w-3" />}
          {copied ? "Đã sao chép" : "Sao chép"}
        </button>
      </div>
      <pre className="overflow-x-auto p-3 text-[11px] leading-relaxed text-slate-800">
        <code>{snippet}</code>
      </pre>
    </div>
  );
}
