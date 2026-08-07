"use client";

import * as React from "react";
import { HelpCircle, Sparkles } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { Switch } from "@/components/ui/Switch";
import { cn } from "@/lib/utils";
import { toast } from "@/store/toast-store";

interface AiReplyPreset {
  id: string;
  label: string;
  enabled: boolean;
  content: string;
}

const DEFAULT_PRESETS: AiReplyPreset[] = [
  {
    id: "1",
    label: "Câu 1",
    enabled: false,
    content: "- Xưng em gọi bác\n- Luôn chào\n- Luôn cảm ơn",
  },
  {
    id: "2",
    label: "Câu 2",
    enabled: false,
    content: "Sử dụng tone formal cho phong cách nghiêm túc",
  },
  {
    id: "3",
    label: "Câu 3",
    enabled: false,
    content: "Sử dụng tone friendly cho phong cách thân thiện. Thêm emoji vào câu trả lời",
  },
];

interface CustomizeAiRepliesModalProps {
  open: boolean;
  onClose: () => void;
}

// Chỉ là UI tĩnh (chưa nối AI thật) — nội dung/bật-tắt chỉ sống trong state
// của modal, mất khi đóng lại (đúng tinh thần "làm UI trước" như phần còn
// lại của trang Trợ lý AI).
export function CustomizeAiRepliesModal({ open, onClose }: CustomizeAiRepliesModalProps) {
  const [presets, setPresets] = React.useState<AiReplyPreset[]>(DEFAULT_PRESETS);
  const [selectedId, setSelectedId] = React.useState(DEFAULT_PRESETS[0].id);

  const selected = presets.find((p) => p.id === selectedId) ?? presets[0];

  function updateContent(content: string) {
    setPresets((prev) => prev.map((p) => (p.id === selectedId ? { ...p, content } : p)));
  }

  function toggleEnabled(id: string) {
    setPresets((prev) => prev.map((p) => (p.id === id ? { ...p, enabled: !p.enabled } : p)));
  }

  function handleSave() {
    toast.success("Đã lưu câu trả lời tuỳ chỉnh");
    onClose();
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Tuỳ chỉnh câu trả lời từ AI"
      className="max-w-4xl bg-slate-100"
    >
      <div className="flex h-[70vh] min-h-[420px]">
        <div className="flex w-[300px] shrink-0 flex-col border-r border-slate-200 bg-slate-50 p-4">
          <p className="mb-3 text-sm font-semibold text-slate-900">Danh sách câu trả lời</p>
          <div className="flex-1 space-y-2 overflow-y-auto">
            {presets.map((preset) => {
              const isSelected = preset.id === selectedId;
              return (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => setSelectedId(preset.id)}
                  className={cn(
                    "block w-full rounded-xl border bg-white p-3 text-left transition-colors cursor-pointer",
                    isSelected
                      ? "border-primary bg-primary/5"
                      : "border-slate-200 hover:border-slate-300"
                  )}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="flex items-center gap-1.5 text-sm font-semibold text-slate-800">
                      <Sparkles className="h-3.5 w-3.5 text-violet-400" />
                      {preset.label}
                    </span>
                    <span onClick={(e) => e.stopPropagation()}>
                      <Switch
                        checked={preset.enabled}
                        onCheckedChange={() => toggleEnabled(preset.id)}
                        aria-label={`Bật/tắt ${preset.label}`}
                      />
                    </span>
                  </div>
                  <p className="mt-1.5 whitespace-pre-line text-xs leading-relaxed text-slate-400">
                    {preset.content}
                  </p>
                </button>
              );
            })}
          </div>
          <p className="pt-3 text-center text-xs text-slate-400">
            Hệ thống chỉ hiển thị tối đa 3 câu
          </p>
        </div>

        <div className="flex flex-1 flex-col bg-white p-5">
          <p className="mb-3 flex items-start gap-1.5 text-sm text-slate-500">
            <HelpCircle className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
            <span>
              Bạn đang không chắc viết gì? Hãy{" "}
              <button
                type="button"
                onClick={() => toast.info("Tính năng đang được phát triển")}
                className="font-medium text-primary underline-offset-2 hover:underline cursor-pointer"
              >
                xem mẫu gợi ý
              </button>{" "}
              hoặc{" "}
              <button
                type="button"
                onClick={() => toast.info("Tính năng đang được phát triển")}
                className="font-medium text-primary underline-offset-2 hover:underline cursor-pointer"
              >
                hướng dẫn
              </button>{" "}
              nhé
            </span>
          </p>

          <textarea
            value={selected.content}
            onChange={(e) => updateContent(e.target.value)}
            className="flex-1 resize-none rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary/30"
          />

          <button
            type="button"
            onClick={handleSave}
            className="mt-4 w-full rounded-xl bg-primary py-3 text-sm font-semibold text-white transition-colors hover:bg-primary-hover cursor-pointer"
          >
            Lưu
          </button>
        </div>
      </div>
    </Modal>
  );
}
