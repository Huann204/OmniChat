"use client";

import * as React from "react";
import { getStorageUsage, type StorageUsage } from "@/app/actions/media";

// Dùng chung cho MediaPickerModal/FilePickerModal — cả 2 tính vào CHUNG 1 hạn
// mức dung lượng của Shop (server cộng dồn cả 2 loại, xem
// media.controller.ts#ensureStorageQuota). Tải lại khi modal vừa mở, và ngay
// sau khi 1 đợt upload vừa xong (pendingCount về 0) để số liệu luôn khớp
// thực tế, không cần bấm refresh tay.
export function useStorageUsage(open: boolean, pendingCount: number) {
  const [usage, setUsage] = React.useState<StorageUsage | null>(null);

  React.useEffect(() => {
    if (!open || pendingCount > 0) return;
    async function run() {
      const data = await getStorageUsage();
      setUsage(data);
    }
    void run();
  }, [open, pendingCount]);

  return usage;
}
