"use client";

import * as React from "react";
import NextImage from "next/image";
import {
  BsFillClockFill,
  BsFolderPlus,
  BsHeartFill,
  BsFillImageFill,
  BsSearch,
  BsTrashFill,
  BsX,
} from "react-icons/bs";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { useMediaLibraryData } from "@/hooks/useMediaLibraryData";
import { useMediaUpload } from "@/hooks/useMediaUpload";
import { useStorageUsage } from "@/hooks/useStorageUsage";
import { cn } from "@/lib/utils";
import type { MediaItem } from "@/types/media";
import { MediaGrid } from "./MediaGrid";
import { StorageUsageBar } from "./StorageUsageBar";

interface MediaPickerModalProps {
  open: boolean;
  onClose: () => void;
  multiple?: boolean;
  onSelect: (items: MediaItem[]) => void;
}

type SidebarTab = "recent" | "favorite";

// Modal chọn ảnh dùng chung cho toàn hệ thống — các tính năng khác chỉ cần mount
// component này để lấy ảnh từ thư viện, không cần biết gì về Cloudinary/Mongo.
// "Yêu thích" mới dừng ở giao diện (disabled) — chưa có field lưu ở backend,
// bật thật sau khi có nhu cầu.
export function MediaPickerModal({ open, onClose, multiple = true, onSelect }: MediaPickerModalProps) {
  const [search, setSearch] = React.useState("");
  const [tab, setTab] = React.useState<SidebarTab>("recent");
  // Mảng có thứ tự (không phải Set) — giữ đúng thứ tự bấm chọn để hiện số thứ
  // tự (1, 2, 3...) trên từng ảnh và trả về đúng thứ tự đó khi xác nhận.
  const [selectedIds, setSelectedIds] = React.useState<string[]>([]);
  // ids đang chờ xác nhận xoá (1 ảnh từ nút trên thẻ, hoặc nhiều ảnh từ nút xoá
  // hàng loạt ở footer) — dùng chung 1 dialog xác nhận cho cả 2 trường hợp.
  const [pendingDeleteIds, setPendingDeleteIds] = React.useState<string[] | null>(null);
  const [confirmingDelete, setConfirmingDelete] = React.useState(false);
  const [previewItem, setPreviewItem] = React.useState<MediaItem | null>(null);
  const [isDragging, setIsDragging] = React.useState(false);
  const inputRef = React.useRef<HTMLInputElement>(null);

  const { items, page, pages, loading, loadingMore, deletingId, loadMore, addUploaded, removeItem } =
    useMediaLibraryData(search);
  const { pending, addFiles } = useMediaUpload(addUploaded);
  const storageUsage = useStorageUsage(open, pending.length);

  // Reset lựa chọn mỗi lần mở lại modal — tránh giữ selection từ lần chọn trước.
  // Set trong lúc render (thay vì trong Effect) để không tốn thêm 1 vòng render.
  const [prevOpen, setPrevOpen] = React.useState(open);
  if (open !== prevOpen) {
    setPrevOpen(open);
    if (open) {
      setSelectedIds([]);
      setPreviewItem(null);
      setPendingDeleteIds(null);
    }
  }

  async function handleConfirmDelete() {
    if (!pendingDeleteIds || confirmingDelete) return;
    setConfirmingDelete(true);
    const results = await Promise.all(pendingDeleteIds.map((id) => removeItem(id)));
    setConfirmingDelete(false);
    setPendingDeleteIds(null);
    const removedIds = new Set(pendingDeleteIds.filter((_, i) => results[i]));
    setSelectedIds((prev) => prev.filter((id) => !removedIds.has(id)));
    setPreviewItem((prev) => (prev && removedIds.has(prev.id) ? null : prev));
  }

  function handleToggleSelect(item: MediaItem) {
    setSelectedIds((prev) => {
      if (prev.includes(item.id)) {
        return prev.filter((id) => id !== item.id);
      }
      if (!multiple) return [item.id];
      return [...prev, item.id];
    });
  }

  function handleConfirmSelect(pickedIds: string[]) {
    const byId = new Map(items.map((item) => [item.id, item]));
    const picked = pickedIds.map((id) => byId.get(id)).filter((item): item is MediaItem => Boolean(item));
    if (picked.length === 0) return;
    onSelect(picked);
    onClose();
  }

  const showEmptyState = !loading && items.length === 0 && pending.length === 0;

  return (
    <Modal open={open} onClose={onClose} className="flex h-[min(85vh,640px)] w-full max-w-4xl flex-col">
      <div className="flex shrink-0 items-center justify-between gap-4 border-b border-slate-200 px-5 py-4">
        <h2 className="shrink-0 text-base font-semibold text-slate-900">Thư mục ảnh</h2>
        <div className="relative ml-2 max-w-md flex-1">
          <BsSearch className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm kiếm ảnh bằng tên"
            className="w-full rounded-lg border border-slate-200 bg-slate-50 py-2 pl-9 pr-3 text-sm text-slate-900 placeholder:text-slate-400 transition-colors focus:outline-none focus:ring-2 focus:ring-primary/40 focus:bg-white"
          />
        </div>
        <StorageUsageBar usage={storageUsage} />
        <button
          type="button"
          onClick={onClose}
          aria-label="Đóng"
          className="cursor-pointer rounded-full p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
        >
          <BsX className="h-5 w-5" />
        </button>
      </div>

      <div className="flex min-h-0 flex-1">
        <aside className="flex w-52 shrink-0 flex-col gap-3 border-r border-slate-200 p-3">
          <div className="flex items-center gap-1.5">
            <input
              placeholder="Tìm thư mục..."
              disabled
              className="w-full rounded-lg border border-slate-200 bg-slate-50 py-1.5 px-2.5 text-xs text-slate-400 placeholder:text-slate-400"
            />
            <button
              type="button"
              disabled
              title="Thư mục con — sắp ra mắt"
              aria-label="Thêm thư mục (sắp ra mắt)"
              className="flex h-7 w-7 shrink-0 cursor-not-allowed items-center justify-center rounded-lg text-slate-300"
            >
              <BsFolderPlus className="h-4 w-4" />
            </button>
          </div>

          <nav className="flex flex-col gap-1">
            <button
              type="button"
              onClick={() => setTab("recent")}
              className={cn(
                "flex cursor-pointer items-center gap-2 rounded-lg px-2.5 py-2 text-left text-sm font-medium transition-colors",
                tab === "recent" ? "bg-primary/10 text-primary" : "text-slate-600 hover:bg-slate-50"
              )}
            >
              <BsFillClockFill className="h-4 w-4" />
              Tải lên gần đây
            </button>
            <button
              type="button"
              disabled
              title="Sắp ra mắt"
              className="flex cursor-not-allowed items-center gap-2 rounded-lg px-2.5 py-2 text-left text-sm font-medium text-slate-300"
            >
              <BsHeartFill className="h-4 w-4" />
              Yêu thích
            </button>
          </nav>
        </aside>

        <div
          className="relative flex min-h-0 flex-1 flex-col"
          onDragEnter={(e) => {
            e.preventDefault();
            setIsDragging(true);
          }}
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={(e) => {
            e.preventDefault();
            setIsDragging(false);
          }}
          onDrop={(e) => {
            e.preventDefault();
            setIsDragging(false);
            addFiles(e.dataTransfer.files);
          }}
        >
          {isDragging && (
            <div className="pointer-events-none absolute inset-2 z-10 flex items-center justify-center rounded-xl border-2 border-dashed border-primary bg-primary/5">
              <p className="text-sm font-medium text-primary">Thả ảnh vào đây để thêm</p>
            </div>
          )}

          <div className="min-h-0 flex-1 overflow-y-auto p-5">
            {pending.length > 0 && (
              <div className="mb-4 flex flex-wrap items-center gap-2 rounded-xl border border-slate-200 bg-slate-50/60 p-3">
                {pending.map((p) => (
                  <div
                    key={p.id}
                    className="relative h-14 w-14 shrink-0 overflow-hidden rounded-lg border border-slate-200 bg-white"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={p.previewUrl}
                      alt={p.file.name}
                      className="h-full w-full object-contain"
                    />
                    <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                      <Loader2 className="h-4 w-4 animate-spin text-white" />
                    </div>
                  </div>
                ))}
                <span className="text-xs text-slate-500">Đang tải lên...</span>
              </div>
            )}

            {showEmptyState ? (
              <div className="flex h-full flex-col items-center justify-center gap-3 py-10 text-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100 text-slate-300">
                  <BsFillImageFill className="h-8 w-8" />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-600">Bạn chưa có ảnh nào.</p>
                  <p className="text-sm text-slate-400">Chọn thêm ảnh để thêm vào thư mục này</p>
                </div>
                <Button size="sm" onClick={() => inputRef.current?.click()}>
                  Thêm ảnh
                </Button>
              </div>
            ) : loading || items.length > 0 ? (
              <>
                <MediaGrid
                  items={items}
                  loading={loading}
                  selectedIds={selectedIds}
                  deletingId={deletingId}
                  onToggleSelect={handleToggleSelect}
                  onRequestDelete={(item) => setPendingDeleteIds([item.id])}
                  onPreview={setPreviewItem}
                />
                {!loading && page < pages && (
                  <div className="mt-6 flex justify-center">
                    <Button variant="outline" size="sm" onClick={loadMore} disabled={loadingMore}>
                      {loadingMore && <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />}
                      Tải thêm ảnh
                    </Button>
                  </div>
                )}
              </>
            ) : null}
          </div>

          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={(e) => {
              addFiles(e.target.files);
              e.target.value = "";
            }}
          />
        </div>
      </div>

      <div className="flex shrink-0 items-center justify-between gap-3 border-t border-slate-200 bg-white px-5 py-3">
        <div className="flex min-w-0 items-center gap-2">
          {selectedIds.length > 0 ? (
            <>
              <button
                type="button"
                onClick={() => setPendingDeleteIds(selectedIds)}
                aria-label="Xoá các ảnh đã chọn"
                className="flex h-8 shrink-0 cursor-pointer items-center justify-center gap-1.5 rounded-lg px-2.5 text-xs font-medium text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
              >
                <BsTrashFill className="h-4 w-4" />
              </button>
              <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-slate-100 py-1.5 pl-3 pr-2 text-xs font-medium text-slate-600">
                Đã chọn {selectedIds.length} ảnh
                <button
                  type="button"
                  onClick={() => setSelectedIds([])}
                  aria-label="Bỏ chọn tất cả"
                  className="flex h-4 w-4 cursor-pointer items-center justify-center rounded-full text-slate-400 hover:text-slate-600"
                >
                  <BsX className="h-3 w-3" />
                </button>
              </span>
            </>
          ) : (
            <span className="truncate text-xs text-slate-400">
              Kéo thả ảnh vào đây, hoặc bấm &quot;Thêm ảnh&quot; để upload
            </span>
          )}
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => inputRef.current?.click()}>
            Thêm ảnh
          </Button>
          <Button size="sm" disabled={selectedIds.length === 0} onClick={() => handleConfirmSelect(selectedIds)}>
            Chọn
          </Button>
        </div>
      </div>

      {previewItem && (
        <div className="absolute inset-0 z-30 flex flex-col bg-white">
          <div className="flex shrink-0 items-center justify-between border-b border-slate-200 px-5 py-3">
            <p className="truncate text-sm font-medium text-slate-700">{previewItem.originalFilename}</p>
            <button
              type="button"
              onClick={() => setPreviewItem(null)}
              aria-label="Đóng xem trước"
              className="cursor-pointer rounded-full p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
            >
              <BsX className="h-5 w-5" />
            </button>
          </div>
          <div className="relative min-h-0 flex-1 bg-slate-50">
            <NextImage
              src={previewItem.url}
              alt={previewItem.originalFilename}
              fill
              className="object-contain"
              unoptimized
            />
          </div>
          <div className="flex shrink-0 items-center justify-end gap-2 border-t border-slate-200 px-5 py-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPendingDeleteIds([previewItem.id])}
            >
              Xoá ảnh
            </Button>
            <Button size="sm" onClick={() => handleConfirmSelect([previewItem.id])}>
              Dùng ảnh này
            </Button>
          </div>
        </div>
      )}

      {pendingDeleteIds && (
        <div className="absolute inset-0 z-40 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-5 shadow-2xl">
            <div className="flex items-start gap-3">
              <BsTrashFill className="h-5 w-5 shrink-0 text-red-500" />
              <p className="text-sm font-medium text-slate-900">
                {pendingDeleteIds.length > 1
                  ? `Bạn có chắc chắn muốn xoá ${pendingDeleteIds.length} ảnh đã chọn không?`
                  : "Bạn có chắc chắn muốn xóa ảnh không?"}
              </p>
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setPendingDeleteIds(null)}
                disabled={confirmingDelete}
                className="cursor-pointer rounded-lg bg-slate-100 px-4 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-200 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Đóng
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={confirmingDelete}
                className="flex cursor-pointer items-center gap-1.5 rounded-lg bg-red-50 px-4 py-2 text-sm font-medium text-red-600 transition-colors hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {confirmingDelete && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                Xoá ảnh
              </button>
            </div>
          </div>
        </div>
      )}
    </Modal>
  );
}
