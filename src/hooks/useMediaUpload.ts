"use client";

import * as React from "react";
import { toast } from "@/store/toast-store";
import type { MediaItem, MediaUploadFailure } from "@/types/media";

const MAX_FILES = 10;
const MAX_FILE_SIZE = 10 * 1024 * 1024;

export interface PendingFile {
  id: string;
  file: File;
  previewUrl: string;
}

// Logic chọn ảnh cho MediaPickerModal — chọn xong là tự upload luôn, không có
// bước bấm nút "Tải lên" riêng. pending chỉ còn để hiện preview + spinner trong
// lúc đang tải lên, tự biến mất khi xong (thành công hay thất bại đều đã báo
// qua toast, không cần giữ lại trong danh sách để thao tác thêm).
export function useMediaUpload(onUploaded: (items: MediaItem[]) => void) {
  const [pending, setPending] = React.useState<PendingFile[]>([]);
  const pendingRef = React.useRef(pending);
  pendingRef.current = pending;

  React.useEffect(() => {
    return () => {
      pendingRef.current.forEach((p) => URL.revokeObjectURL(p.previewUrl));
    };
  }, []);

  async function uploadFiles(batch: PendingFile[]) {
    const formData = new FormData();
    batch.forEach((p) => formData.append("files", p.file));

    try {
      const res = await fetch("/api/media/upload", { method: "POST", body: formData });
      const data = await res.json().catch(() => null);

      if (!res.ok) {
        toast.error(data?.message || "Upload thất bại");
        return;
      }

      const items: MediaItem[] = data?.items ?? [];
      const failed: MediaUploadFailure[] = data?.failed ?? [];

      if (items.length > 0) {
        onUploaded(items);
        toast.success(`Đã upload ${items.length} ảnh`);
      }
      failed.forEach((f) => toast.error(`"${f.filename}": ${f.error}`));
    } catch {
      toast.error("Không kết nối được máy chủ để upload");
    } finally {
      batch.forEach((p) => URL.revokeObjectURL(p.previewUrl));
      setPending((prev) => prev.filter((p) => !batch.some((b) => b.id === p.id)));
    }
  }

  function addFiles(fileList: FileList | null) {
    if (!fileList || fileList.length === 0) return;
    const files = Array.from(fileList);

    if (pendingRef.current.length + files.length > MAX_FILES) {
      toast.error(`Chỉ chọn tối đa ${MAX_FILES} ảnh mỗi lần`);
      return;
    }

    const accepted: PendingFile[] = [];
    for (const file of files) {
      if (!file.type.startsWith("image/")) {
        toast.error(`"${file.name}" không phải là ảnh`);
        continue;
      }
      if (file.size > MAX_FILE_SIZE) {
        toast.error(`"${file.name}" vượt quá 10MB`);
        continue;
      }
      accepted.push({
        id: `${file.name}-${file.size}-${file.lastModified}-${Math.random().toString(36).slice(2)}`,
        file,
        previewUrl: URL.createObjectURL(file),
      });
    }

    if (accepted.length === 0) return;
    setPending((prev) => [...prev, ...accepted]);
    void uploadFiles(accepted);
  }

  return { pending, addFiles };
}
