"use client";

import * as React from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import {
  createConversationTag,
  deleteConversationTag,
  updateConversationTag,
} from "@/app/actions/conversationTag";
import { toast } from "@/store/toast-store";
import type { ConversationTag } from "@/types/conversationTag";

const PRESET_COLORS = [
  "#94a3b8", // slate
  "#f87171", // red
  "#fb923c", // orange
  "#facc15", // yellow
  "#4ade80", // green
  "#22d3ee", // cyan
  "#60a5fa", // blue
  "#a78bfa", // violet
  "#f472b6", // pink
];

interface ConversationTagManagerProps {
  initialItems: ConversationTag[];
}

// Quản lý danh mục thẻ hội thoại của Shop — dùng thật (lưu MongoDB, xem
// server/src/controllers/conversationTag.controller.ts), hiện lên ngay ở
// QuickTagBar trong Livechat để gắn/gỡ cho từng hội thoại.
export function ConversationTagManager({ initialItems }: ConversationTagManagerProps) {
  const [tags, setTags] = React.useState<ConversationTag[]>(initialItems);
  const [modalOpen, setModalOpen] = React.useState(false);
  const [labelInput, setLabelInput] = React.useState("");
  const [colorInput, setColorInput] = React.useState(PRESET_COLORS[0]);
  const [isSaving, setIsSaving] = React.useState(false);
  const [editingId, setEditingId] = React.useState<string | null>(null);

  function openAddModal() {
    setEditingId(null);
    setLabelInput("");
    setColorInput(PRESET_COLORS[tags.length % PRESET_COLORS.length]);
    setModalOpen(true);
  }

  function openEditModal(tag: ConversationTag) {
    setEditingId(tag.id);
    setLabelInput(tag.label);
    setColorInput(tag.color);
    setModalOpen(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const label = labelInput.trim();
    if (!label || isSaving) return;

    setIsSaving(true);
    try {
      const result = editingId
        ? await updateConversationTag(editingId, { label, color: colorInput })
        : await createConversationTag({ label, color: colorInput });

      if ("error" in result) {
        toast.error(result.error);
        return;
      }

      setTags((prev) =>
        editingId ? prev.map((t) => (t.id === editingId ? result.item : t)) : [...prev, result.item]
      );
      setModalOpen(false);
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDelete(id: string) {
    const result = await deleteConversationTag(id);
    if (result.error) {
      toast.error(result.error);
      return;
    }
    setTags((prev) => prev.filter((t) => t.id !== id));
  }

  return (
    <div>
      <h1 className="mb-4 text-xl font-semibold text-slate-900">Thẻ hội thoại</h1>

      <div className="rounded-2xl border border-slate-200/70 bg-white p-5 shadow-[8px]">
        <div className="mb-4 flex items-center justify-between">
          <p className="text-sm text-slate-500">
            Thẻ dùng để đánh dấu trạng thái hội thoại trong Livechat (vd &quot;Mua hàng&quot;,
            &quot;Đã gửi&quot;) — 1 hội thoại có thể gắn nhiều thẻ cùng lúc.
          </p>
          <button
            type="button"
            onClick={openAddModal}
            className="flex shrink-0 items-center gap-1.5 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-primary-hover cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            Thêm thẻ
          </button>
        </div>

        {tags.length === 0 ? (
          <p className="py-12 text-center text-sm text-slate-400">
            Chưa có thẻ nào — bấm &quot;Thêm thẻ&quot; để tạo mới.
          </p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {tags.map((tag) => (
              <div
                key={tag.id}
                className="group flex items-center gap-2 rounded-full py-1.5 pl-3 pr-1.5 text-sm font-semibold text-white"
                style={{ backgroundColor: tag.color }}
              >
                {tag.label}
                <span className="flex items-center opacity-70 transition-opacity group-hover:opacity-100">
                  <button
                    type="button"
                    aria-label="Sửa thẻ"
                    onClick={() => openEditModal(tag)}
                    className="flex h-5 w-5 items-center justify-center rounded-full hover:bg-black/15 cursor-pointer"
                  >
                    <Pencil className="h-3 w-3" />
                  </button>
                  <button
                    type="button"
                    aria-label="Xoá thẻ"
                    onClick={() => handleDelete(tag.id)}
                    className="flex h-5 w-5 items-center justify-center rounded-full hover:bg-black/15 cursor-pointer"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingId ? "Sửa thẻ hội thoại" : "Thêm thẻ hội thoại"}
      >
        <form onSubmit={handleSubmit} className="flex flex-col gap-4 p-5">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">Tên thẻ</label>
            <Input
              value={labelInput}
              onChange={(e) => setLabelInput(e.target.value)}
              placeholder="vd: Mua hàng"
              autoFocus
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">Màu thẻ</label>
            <div className="flex flex-wrap items-center gap-2">
              {PRESET_COLORS.map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setColorInput(color)}
                  aria-label={`Chọn màu ${color}`}
                  style={{ backgroundColor: color }}
                  className={`h-7 w-7 shrink-0 rounded-full cursor-pointer transition-transform ${
                    colorInput === color ? "ring-2 ring-offset-2 ring-slate-900 scale-110" : ""
                  }`}
                />
              ))}
              <input
                type="color"
                value={colorInput}
                onChange={(e) => setColorInput(e.target.value)}
                aria-label="Chọn màu tuỳ chỉnh"
                className="h-7 w-9 shrink-0 cursor-pointer rounded-md border border-slate-200 bg-transparent p-0.5"
              />
            </div>
            <div
              className="mt-3 inline-flex items-center rounded-full px-3 py-1.5 text-sm font-semibold text-white"
              style={{ backgroundColor: colorInput }}
            >
              {labelInput.trim() || "Xem trước"}
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={() => setModalOpen(false)}
              className="rounded-xl px-4 py-2 text-sm font-semibold text-slate-600 transition-colors hover:bg-slate-100 cursor-pointer"
            >
              Huỷ
            </button>
            <button
              type="submit"
              disabled={!labelInput.trim() || isSaving}
              className="rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-primary-hover disabled:opacity-50 disabled:pointer-events-none cursor-pointer"
            >
              {editingId ? "Cập nhật" : "Lưu"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
