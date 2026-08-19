import Link from "next/link";
import { cn } from "@/lib/utils";

export function CustomerListPagination({
  currentPage,
  totalPages,
}: {
  currentPage: number;
  totalPages: number;
}) {
  if (totalPages <= 1) return null;

  return (
    <div className="mt-4 flex items-center justify-center gap-3 text-sm">
      <Link
        href={`/customers?page=${currentPage - 1}`}
        aria-disabled={currentPage <= 1}
        className={cn(
          "rounded-lg border border-slate-200 bg-white px-3 py-1.5 font-semibold text-slate-600 transition-colors hover:bg-slate-50",
          currentPage <= 1 && "pointer-events-none opacity-40"
        )}
      >
        Trước
      </Link>
      <span className="text-slate-500">
        Trang {currentPage}/{totalPages}
      </span>
      <Link
        href={`/customers?page=${currentPage + 1}`}
        aria-disabled={currentPage >= totalPages}
        className={cn(
          "rounded-lg border border-slate-200 bg-white px-3 py-1.5 font-semibold text-slate-600 transition-colors hover:bg-slate-50",
          currentPage >= totalPages && "pointer-events-none opacity-40"
        )}
      >
        Sau
      </Link>
    </div>
  );
}
