"use client";

import * as React from "react";
import { deleteMedia, listMedia } from "@/app/actions/media";
import { toast } from "@/store/toast-store";
import type { MediaItem } from "@/types/media";

// Logic tải/tìm/xoá cho MediaPickerModal — tách riêng khỏi phần giao diện để
// nếu sau này có thêm nơi khác cần danh sách ảnh của user thì dùng lại được.
export function useMediaLibraryData(search: string) {
  const [items, setItems] = React.useState<MediaItem[]>([]);
  const [page, setPage] = React.useState(1);
  const [pages, setPages] = React.useState(1);
  const [loading, setLoading] = React.useState(true);
  const [loadingMore, setLoadingMore] = React.useState(false);
  const [deletingId, setDeletingId] = React.useState<string | null>(null);

  React.useEffect(() => {
    let cancelled = false;
    setLoading(true);
    listMedia({ page: 1, search }).then((data) => {
      if (cancelled) return;
      setItems(data.items);
      setPage(data.page);
      setPages(data.pages);
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [search]);

  async function loadMore() {
    setLoadingMore(true);
    const data = await listMedia({ page: page + 1, search });
    setItems((prev) => [...prev, ...data.items]);
    setPage(data.page);
    setPages(data.pages);
    setLoadingMore(false);
  }

  function addUploaded(newItems: MediaItem[]) {
    if (newItems.length === 0) return;
    setItems((prev) => [...newItems, ...prev]);
  }

  async function removeItem(id: string) {
    setDeletingId(id);
    const { error } = await deleteMedia(id);
    setDeletingId(null);
    if (error) {
      toast.error(error);
      return false;
    }
    setItems((prev) => prev.filter((item) => item.id !== id));
    toast.success("Đã xoá ảnh");
    return true;
  }

  return {
    items,
    page,
    pages,
    loading,
    loadingMore,
    deletingId,
    loadMore,
    addUploaded,
    removeItem,
  };
}
