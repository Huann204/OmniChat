"use client";

import * as React from "react";
import Image from "next/image";
import {
  BsCheck2All,
  BsUpload,
  BsDownload,
  BsCopy,
  BsFillImageFill,
  BsPencilFill,
  BsPlusLg,
  BsSearch,
  BsTrashFill,
  BsX,
} from "react-icons/bs";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { MediaPickerModal } from "@/components/media/MediaPickerModal";
import { createQuickReply, deleteQuickReply, updateQuickReply } from "@/app/actions/quickReply";
import { toast } from "@/store/toast-store";
import type { MediaItem } from "@/types/media";
import type { QuickReply } from "@/types/quickReply";

interface AttachedImage {
  id: string;
  url: string;
}

const ICON_BTN =
  "flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 text-slate-500 transition-colors hover:bg-slate-50 hover:text-slate-700 cursor-pointer";

interface QuickReplyManagerProps {
  initialItems: QuickReply[];
}

// Chỉ nút "Thêm mẫu"/sửa/xoá là thao tác thật (gọi API, lưu MongoDB theo
// Shop — xem server/src/controllers/quickReply.controller.ts). Các nút
// toolbar còn lại (nhập/xuất/sao chép/chọn tất cả) chỉ là placeholder UI
// theo đúng bố cục yêu cầu, chưa có logic đứng sau.
export function QuickReplyManager({ initialItems }: QuickReplyManagerProps) {
  const [quickReplies, setQuickReplies] = React.useState<QuickReply[]>(initialItems);
  const [search, setSearch] = React.useState("");
  const [modalOpen, setModalOpen] = React.useState(false);
  const [shortcutInput, setShortcutInput] = React.useState("");
  const [messageInput, setMessageInput] = React.useState("");
  const [attachedImages, setAttachedImages] = React.useState<AttachedImage[]>([]);
  const [pickerOpen, setPickerOpen] = React.useState(false);
  const [isSaving, setIsSaving] = React.useState(false);
  // null = đang ở modal "Thêm mẫu" (tạo mới) — có id = đang sửa đúng mẫu đó
  // (mở lại cùng modal, chỉ khác chỗ submit gọi update thay vì create).
  const [editingId, setEditingId] = React.useState<string | null>(null);

  const filtered = quickReplies.filter((q) => {
    const query = search.trim().toLowerCase();
    if (!query) return true;
    return (
      q.shortcut.toLowerCase().includes(query) || (q.message ?? "").toLowerCase().includes(query)
    );
  });

  function openAddModal() {
    setEditingId(null);
    setShortcutInput("");
    setMessageInput("");
    setAttachedImages([]);
    setModalOpen(true);
  }

  function openEditModal(item: QuickReply) {
    setEditingId(item.id);
    setShortcutInput(item.shortcut);
    setMessageInput(item.message ?? "");
    setAttachedImages(item.images.map((url, i) => ({ id: `${item.id}-${i}`, url })));
    setModalOpen(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const shortcut = shortcutInput.trim();
    const message = messageInput.trim();
    // Cho phép lưu chỉ có ảnh, không cần chữ (giống cách gửi tin nhắn ảnh
    // trong khung chat) — chỉ bắt buộc phải có ký tự tắt để gõ gọi lại được.
    if (!shortcut || (!message && attachedImages.length === 0) || isSaving) return;

    const images = attachedImages.map((item) => item.url);
    setIsSaving(true);
    try {
      const result = editingId
        ? await updateQuickReply(editingId, { shortcut, message, images })
        : await createQuickReply({ shortcut, message, images });

      if ("error" in result) {
        toast.error(result.error);
        return;
      }

      setQuickReplies((prev) =>
        editingId
          ? prev.map((q) => (q.id === editingId ? result.item : q))
          : [...prev, result.item]
      );
      setModalOpen(false);
    } finally {
      setIsSaving(false);
    }
  }

  function handlePickImages(items: MediaItem[]) {
    setAttachedImages((prev) => [...prev, ...items.map((i) => ({ id: i.id, url: i.url }))]);
  }

  function removeAttachedImage(id: string) {
    setAttachedImages((prev) => prev.filter((item) => item.id !== id));
  }

  async function handleDelete(id: string) {
    const result = await deleteQuickReply(id);
    if (result.error) {
      toast.error(result.error);
      return;
    }
    setQuickReplies((prev) => prev.filter((q) => q.id !== id));
  }

  function notImplemented() {
    toast.info("Tính năng đang được phát triển");
  }

  return (
    <div>
      <h1 className="mb-4 text-xl font-semibold text-slate-900">Hỗ trợ trả lời</h1>

      <div className="relative flex h-[calc(100vh-148px)] flex-col overflow-y-auto overflow-x-hidden rounded-2xl border border-slate-200/70 bg-white shadow-[8px]">
        <div className="sticky top-0 z-10 bg-white">
          <div className="border-b border-slate-200 px-5 pt-4">
            <button
              type="button"
              className="border-b-2 border-primary px-1 pb-3 text-sm font-semibold text-primary cursor-pointer"
            >
              Trả lời nhanh
            </button>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 px-3 sm:px-5 py-4">
            <div className="flex items-center gap-1.5">
              <button type="button" title="Chọn tất cả" onClick={notImplemented} className={ICON_BTN}>
                <BsCheck2All className="h-4 w-4" />
              </button>
              <button type="button" title="Nhập từ file" onClick={notImplemented} className={ICON_BTN}>
                <BsUpload className="h-4 w-4" />
              </button>
              <button type="button" title="Xuất file" onClick={notImplemented} className={ICON_BTN}>
                <BsDownload className="h-4 w-4" />
              </button>
              <button type="button" title="Sao chép" onClick={notImplemented} className={ICON_BTN}>
                <BsCopy className="h-4 w-4" />
              </button>
            </div>

            <div className="flex w-full sm:w-auto items-center gap-2">
              <div className="relative flex-1 sm:flex-none">
                <BsSearch className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Tìm kiếm"
                  className="w-full sm:w-48 rounded-xl border border-slate-200 bg-slate-50 py-2 pl-9 pr-3 text-base sm:text-sm text-slate-900 placeholder:text-slate-400 transition-colors focus:outline-none focus:ring-2 focus:ring-primary/40 focus:bg-white"
                />
              </div>
              <button
                type="button"
                onClick={openAddModal}
                className="flex shrink-0 items-center gap-1.5 rounded-xl bg-primary px-3 sm:px-4 py-2 text-xs sm:text-sm font-semibold text-white transition-colors hover:bg-primary-hover cursor-pointer"
              >
                <BsPlusLg className="h-4 w-4" />
                Thêm mẫu
              </button>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-y border-slate-100 text-xs font-medium text-slate-400">
                <th className="w-16 px-5 py-2.5 font-medium">STT</th>
                <th className="w-40 px-5 py-2.5 font-medium">Ký tự tắt</th>
                <th className="px-5 py-2.5 font-medium">Tin nhắn</th>
                <th className="w-16 px-5 py-2.5" />
              </tr>
            </thead>
            <tbody>
              {filtered.map((item, index) => (
                <tr
                  key={item.id}
                  className="group border-b border-slate-50 last:border-0 hover:bg-slate-50"
                >
                  <td className="px-5 py-3 text-slate-500">{index + 1}</td>
                  <td className="px-5 py-3">
                    <span className="rounded-md bg-slate-100 px-2 py-0.5 font-mono text-xs text-slate-700">
                      {item.shortcut}
                    </span>
                  </td>
                  <td className="max-w-md px-5 py-3 text-slate-700">
                    <div className="flex items-center gap-2">
                      {item.images.length > 0 && (
                        <span className="group/thumb relative shrink-0">
                          <span className="relative flex h-6 w-6 overflow-hidden rounded-md border border-slate-200">
                            <Image src={item.images[0]} alt="" fill className="object-cover" unoptimized />
                            {item.images.length > 1 && (
                              <span className="absolute inset-0 flex items-center justify-center bg-black/50 text-[9px] font-bold text-white">
                                +{item.images.length - 1}
                              </span>
                            )}
                          </span>

                          {/* Xem trước cỡ lớn khi hover — chỉ hiện tối đa 4 ảnh,
                              nếu nhiều hơn sẽ có lớp phủ báo số lượng còn lại. */}
                          <span className="pointer-events-none absolute bottom-full left-0 z-50 mb-2 hidden w-max max-w-[300px] flex-wrap gap-1.5 rounded-lg border border-slate-200 bg-white p-1.5 shadow-lg group-hover/thumb:flex">
                            {item.images.slice(0, 4).map((url, i) => (
                              <span key={`${url}-${i}`} className="relative h-16 w-16 shrink-0 overflow-hidden rounded-md border border-slate-100">
                                <Image src={url} alt="" fill className="object-cover" unoptimized />
                                {i === 3 && item.images.length > 4 && (
                                  <span className="absolute inset-0 flex items-center justify-center bg-black/50 text-xs font-bold text-white">
                                    +{item.images.length - 4}
                                  </span>
                                )}
                              </span>
                            ))}
                          </span>
                        </span>
                      )}
                      <span className="truncate">{item.message}</span>
                    </div>
                  </td>
                  <td className="px-5 py-3 text-right">
                    <span className="inline-flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                      <button
                        type="button"
                        aria-label="Sửa mẫu"
                        onClick={() => openEditModal(item)}
                        className="cursor-pointer rounded-full p-1.5 text-slate-300 transition-colors hover:bg-primary/10 hover:text-primary"
                      >
                        <BsPencilFill className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        aria-label="Xoá mẫu"
                        onClick={() => handleDelete(item.id)}
                        className="cursor-pointer rounded-full p-1.5 text-slate-300 transition-colors hover:bg-red-50 hover:text-red-500"
                      >
                        <BsTrashFill className="h-4 w-4" />
                      </button>
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {filtered.length === 0 && (
            <p className="py-16 text-center text-sm text-slate-400">
              {quickReplies.length === 0
                ? 'Chưa có mẫu trả lời nhanh nào — bấm "Thêm mẫu" để tạo mới.'
                : "Không tìm thấy mẫu nào khớp với tìm kiếm."}
            </p>
          )}
        </div>
      </div>

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingId ? "Sửa mẫu trả lời nhanh" : "Thêm mẫu trả lời nhanh"}
      >
        <form onSubmit={handleSubmit} className="flex flex-col gap-4 p-5">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">Ký tự tắt</label>
            <Input
              value={shortcutInput}
              onChange={(e) => setShortcutInput(e.target.value)}
              placeholder="vd: cskh"
              autoFocus
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">Tin nhắn</label>
            <textarea
              value={messageInput}
              onChange={(e) => setMessageInput(e.target.value)}
              rows={4}
              placeholder="Nội dung sẽ được chèn khi gõ ký tự tắt ở trên"
              className="flex w-full rounded-xl border border-slate-200/60 bg-white/50 px-4 py-2 text-sm text-slate-900 shadow-sm transition-all duration-300 placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:border-primary"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">Ảnh đính kèm</label>
            {attachedImages.length > 0 && (
              <div className="mb-2 flex flex-wrap gap-2">
                {attachedImages.map((item) => (
                  <div
                    key={item.id}
                    className="group relative h-16 w-16 shrink-0 overflow-hidden rounded-lg border border-slate-200 bg-white"
                  >
                    <Image src={item.url} alt="" fill className="object-cover" unoptimized />
                    <button
                      type="button"
                      onClick={() => removeAttachedImage(item.id)}
                      aria-label="Bỏ ảnh"
                      className="absolute right-0.5 top-0.5 flex h-4.5 w-4.5 cursor-pointer items-center justify-center rounded-full bg-black/60 text-white opacity-0 transition-opacity group-hover:opacity-100"
                    >
                      <BsX className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
            <button
              type="button"
              onClick={() => setPickerOpen(true)}
              className="flex items-center gap-1.5 rounded-xl border border-dashed border-slate-300 px-3 py-2 text-sm font-medium text-slate-600 transition-colors hover:border-primary hover:text-primary cursor-pointer"
            >
              <BsFillImageFill className="h-4 w-4" />
              Chọn ảnh từ thư viện
            </button>
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
              disabled={
                !shortcutInput.trim() ||
                (!messageInput.trim() && attachedImages.length === 0) ||
                isSaving
              }
              className="rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-primary-hover disabled:opacity-50 disabled:pointer-events-none cursor-pointer"
            >
              {editingId ? "Cập nhật" : "Lưu"}
            </button>
          </div>
        </form>
      </Modal>

      <MediaPickerModal
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        onSelect={handlePickImages}
      />
    </div>
  );
}
