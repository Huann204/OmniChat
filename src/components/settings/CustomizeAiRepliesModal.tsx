"use client";

import * as React from "react";
import { BsQuestionCircleFill, BsStars } from "react-icons/bs";
import { Modal } from "@/components/ui/Modal";
import { Switch } from "@/components/ui/Switch";
import { cn } from "@/lib/utils";
import { toast } from "@/store/toast-store";
import { updateAiAssistantSettings } from "@/app/actions/aiAssistant";
import type { AiReplyPreset } from "@/types/aiAssistant";

interface CustomizeAiRepliesModalProps {
  open: boolean;
  onClose: () => void;
  presets: AiReplyPreset[];
  // Preset đã lưu thành công phía server — lift lên AiAssistantSettingsClient
  // để lần mở modal sau (hoặc lúc sinh gợi ý ở Livechat) dùng đúng bản mới.
  onSaved: (presets: AiReplyPreset[]) => void;
}

export function CustomizeAiRepliesModal({
  open,
  onClose,
  presets: savedPresets,
  onSaved,
}: CustomizeAiRepliesModalProps) {
  const [presets, setPresets] = React.useState<AiReplyPreset[]>(savedPresets);
  const [selectedIndex, setSelectedIndex] = React.useState(0);
  const [saving, setSaving] = React.useState(false);
  const [prevOpen, setPrevOpen] = React.useState(open);

  // Đồng bộ lại state nội bộ với bản đã lưu mỗi lần MỞ modal (không phải mỗi
  // khi prop đổi) — tránh mất nội dung đang gõ dở nếu component re-render
  // giữa chừng vì lý do khác trong lúc modal đang mở.
  if (open !== prevOpen) {
    setPrevOpen(open);
    if (open) {
      setPresets(savedPresets);
      setSelectedIndex(0);
    }
  }

  const selected = presets[selectedIndex] ?? presets[0];

  function updateContent(content: string) {
    setPresets((prev) => prev.map((p, i) => (i === selectedIndex ? { ...p, content } : p)));
  }

  function toggleEnabled(index: number) {
    setPresets((prev) => prev.map((p, i) => (i === index ? { ...p, enabled: !p.enabled } : p)));
  }

  async function handleSave() {
    setSaving(true);
    const result = await updateAiAssistantSettings({ presets });
    setSaving(false);

    if ("error" in result) {
      toast.error(result.error);
      return;
    }

    onSaved(result.settings.presets);
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
      <div className="flex flex-col md:flex-row min-h-[420px] max-h-[80vh] overflow-y-auto md:overflow-hidden">
        <div className="flex w-full md:w-[300px] shrink-0 flex-col border-b md:border-b-0 md:border-r border-slate-200 bg-slate-50 p-4">
          <p className="mb-3 text-sm font-semibold text-slate-900">Danh sách câu trả lời</p>
          <div className="flex-1 space-y-2 overflow-y-auto">
            {presets.map((preset, index) => {
              const isSelected = index === selectedIndex;
              return (
                // Trong này có Switch (tự render 1 <button> riêng) — không thể
                // bọc bằng <button> ngoài (HTML không cho phép button lồng
                // button, gây lỗi hydration), dùng div + role="button" thay thế.
                <div
                  key={index}
                  role="button"
                  tabIndex={0}
                  onClick={() => setSelectedIndex(index)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      setSelectedIndex(index);
                    }
                  }}
                  className={cn(
                    "block w-full rounded-xl border bg-white p-3 text-left transition-colors cursor-pointer",
                    isSelected
                      ? "border-primary bg-primary/5"
                      : "border-slate-200 hover:border-slate-300"
                  )}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="flex items-center gap-1.5 text-sm font-semibold text-slate-800">
                      <BsStars className="h-3.5 w-3.5 text-violet-400" />
                      {preset.label}
                    </span>
                    <span onClick={(e) => e.stopPropagation()}>
                      <Switch
                        checked={preset.enabled}
                        onCheckedChange={() => toggleEnabled(index)}
                        aria-label={`Bật/tắt ${preset.label}`}
                      />
                    </span>
                  </div>
                  <p className="mt-1.5 whitespace-pre-line text-xs leading-relaxed text-slate-400">
                    {preset.content}
                  </p>
                </div>
              );
            })}
          </div>
          <p className="pt-3 text-center text-xs text-slate-400">
            Hệ thống chỉ hiển thị tối đa 3 câu
          </p>
        </div>

        <div className="flex flex-1 flex-col bg-white p-5">
          <p className="mb-3 flex items-start gap-1.5 text-sm text-slate-500">
            <BsQuestionCircleFill className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
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
            disabled={saving}
            className="mt-4 w-full rounded-xl bg-primary py-3 text-sm font-semibold text-white transition-colors hover:bg-primary-hover cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
          >
            {saving ? "Đang lưu..." : "Lưu"}
          </button>
        </div>
      </div>
    </Modal>
  );
}
