import { cn } from "@/lib/utils";
import { formatBytes } from "@/lib/media";
import type { StorageUsage } from "@/app/actions/media";

// Hiện "Đã dùng X/Y" + thanh tiến trình — dùng chung cho MediaPickerModal và
// FilePickerModal (cả 2 tính vào chung 1 hạn mức của Shop). `null` (chưa tải
// xong, hoặc lỗi) thì không hiện gì thay vì hiện số sai/gây hiểu nhầm.
export function StorageUsageBar({ usage }: { usage: StorageUsage | null }) {
  if (!usage || usage.limitBytes <= 0) return null;

  const ratio = Math.min(1, usage.usageBytes / usage.limitBytes);
  const isNearLimit = ratio >= 0.9;

  return (
    <div className="flex shrink-0 items-center gap-2">
      <div className="h-1.5 w-20 overflow-hidden rounded-full bg-slate-100">
        <div
          className={cn("h-full rounded-full transition-all", isNearLimit ? "bg-red-500" : "bg-primary")}
          style={{ width: `${ratio * 100}%` }}
        />
      </div>
      <span className={cn("whitespace-nowrap text-xs", isNearLimit ? "text-red-500" : "text-slate-400")}>
        {formatBytes(usage.usageBytes)} / {formatBytes(usage.limitBytes)}
      </span>
    </div>
  );
}
