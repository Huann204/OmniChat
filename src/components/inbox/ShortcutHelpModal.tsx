"use client";

import * as React from "react";
import { BsQuestionCircleFill, BsX } from "react-icons/bs";
import { Modal } from "@/components/ui/Modal";

interface ShortcutHelpModalProps {
  open: boolean;
  onClose: () => void;
}

interface ShortcutItem {
  keys: string[];
  note?: string;
  description: string;
}

const SHORTCUTS: ShortcutItem[] = [
  {
    keys: ["?"],
    description: "mở danh sách tổ hợp phím tắt và mẹo",
  },
  {
    keys: ["Enter"],
    description: "để gửi trả lời",
  },
  {
    keys: ["Shift", "Enter"],
    description: "để xuống dòng",
  },
  {
    keys: ["/"],
    description: "mở danh sách mẫu trả lời nhanh (gõ kèm ký tự tắt)",
  },
  {
    keys: ["@"],
    description: "mở danh sách gợi ý nhắc tên thành viên trong nhóm Zalo",
  },
  {
    keys: ["Tab"],
    note: "hoặc",
    description: "để chọn nhanh mẫu trả lời hoặc thành viên",
  },
  {
    keys: ["Esc"],
    description: "để đóng danh sách gợi ý hoặc xem ảnh cỡ lớn",
  },
];

function Kbd({ children }: { children: React.ReactNode }) {
  return (
    <kbd className="inline-flex min-w-[24px] items-center justify-center rounded-md border border-slate-300 bg-slate-50 px-1.5 py-0.5 font-mono text-xs font-medium text-slate-700 shadow-[0_1px_1px_rgba(0,0,0,0.05)]">
      {children}
    </kbd>
  );
}

export function ShortcutHelpModal({ open, onClose }: ShortcutHelpModalProps) {
  return (
    <Modal open={open} onClose={onClose} className="max-w-md">
      <div className="flex shrink-0 items-center justify-between border-b border-slate-200 px-5 py-4">
        <div className="flex items-center gap-2 text-slate-900">
          <BsQuestionCircleFill className="h-5 w-5 text-slate-700" />
          <h2 className="text-base font-semibold">Phím tắt & mẹo</h2>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Đóng"
          className="cursor-pointer rounded-full p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
        >
          <BsX className="h-5 w-5" />
        </button>
      </div>

      <div className="p-6">
        <h3 className="mb-4 text-sm font-semibold text-slate-900">Phím tắt</h3>
        <div className="space-y-3.5">
          {SHORTCUTS.map((item, idx) => (
            <div key={idx} className="flex items-center gap-2 text-sm text-slate-700">
              <div className="flex shrink-0 items-center gap-1">
                {item.keys.map((k, i) => (
                  <React.Fragment key={i}>
                    <Kbd>{k}</Kbd>
                  </React.Fragment>
                ))}
                {item.note && <span className="px-1 text-xs text-slate-400">{item.note}</span>}
              </div>
              <span className="text-slate-600">{item.description}</span>
            </div>
          ))}
        </div>
      </div>
    </Modal>
  );
}
