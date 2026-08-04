"use client";

import type { MediaItem } from "@/types/media";
import { MediaCard } from "./MediaCard";

interface MediaGridProps {
  items: MediaItem[];
  loading: boolean;
  // Mảng có thứ tự (không phải Set) — thứ tự chọn quyết định số hiển thị trên
  // badge của từng ảnh (1, 2, 3...) và thứ tự trả về khi xác nhận chọn.
  selectedIds: string[];
  deletingId: string | null;
  onToggleSelect: (item: MediaItem) => void;
  onRequestDelete: (item: MediaItem) => void;
  onPreview: (item: MediaItem) => void;
}

const SKELETON_COUNT = 10;

export function MediaGrid({
  items,
  loading,
  selectedIds,
  deletingId,
  onToggleSelect,
  onRequestDelete,
  onPreview,
}: MediaGridProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
        {Array.from({ length: SKELETON_COUNT }).map((_, i) => (
          <div
            key={i}
            className="aspect-square animate-pulse rounded-xl bg-slate-100"
          />
        ))}
      </div>
    );
  }

  // Không tự vẽ empty-state ở đây — component gọi MediaGrid (MediaPickerModal)
  // chỉ render nó khi loading hoặc đã có ít nhất 1 ảnh, tự lo empty-state riêng.
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-5">
      {items.map((item) => {
        const index = selectedIds.indexOf(item.id);
        return (
          <MediaCard
            key={item.id}
            item={item}
            selected={index !== -1}
            selectionIndex={index === -1 ? null : index + 1}
            deleting={deletingId === item.id}
            onToggleSelect={onToggleSelect}
            onRequestDelete={onRequestDelete}
            onPreview={onPreview}
          />
        );
      })}
    </div>
  );
}
