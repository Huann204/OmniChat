import { InboxIconRail } from "@/components/inbox/InboxIconRail";
import { BsChatSquareTextFill } from "react-icons/bs";

// Navbar sống ở AppShell (app/(app)/layout.tsx).
// Khi mở Livechat, chưa có hội thoại nào được chọn (activeId = null).
// Khung giữa và khung phải hiển thị ngay trạng thái ban đầu "Xin chọn 1 hội thoại...",
// chỉ cột danh sách bên trái hiển thị skeleton loading.
export default function LivechatLoading() {
  return (
    <div className="flex min-h-0 flex-1 overflow-hidden">
      <InboxIconRail className="!bg-none bg-transparent border-none" />

      <div className="flex flex-1 min-w-0 overflow-hidden rounded-tl-xl bg-white">
        {/* Cột 1: Danh sách hội thoại (Trái) — Đang tải dữ liệu từ server */}
        <div className="flex w-full md:w-[25%] xl:w-[400px] shrink-0 flex-col border-r border-slate-200 animate-pulse bg-white">
          <div className="border-b border-slate-100 p-3">
            <div className="h-9 rounded-xl bg-slate-100" />
          </div>
          <div className="flex-1 space-y-1 p-2">
            {Array.from({ length: 7 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3 px-2 py-2.5">
                <div className="h-11 w-11 shrink-0 rounded-full bg-slate-200/80" />
                <div className="min-w-0 flex-1 space-y-2">
                  <div className="h-3.5 w-2/3 rounded-md bg-slate-200/80" />
                  <div className="h-2.5 w-4/5 rounded-md bg-slate-100" />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Cột 2: Khung chat giữa — Giống 100% trạng thái ban đầu chưa chọn hội thoại */}
        <div className="hidden md:flex flex-1 items-center justify-center bg-[#e5ded8] p-4 text-slate-400">
          <div className="flex items-center gap-3">
            <BsChatSquareTextFill className="h-7 w-7 text-slate-400/80 shrink-0" />
            <span className="text-xl font-normal text-slate-500/80">
              Xin chọn 1 hội thoại từ danh sách bên trái
            </span>
          </div>
        </div>

        {/* Cột 3: Thông tin khách hàng (Phải) — Giống 100% trạng thái chưa mở hội thoại */}
        <div className="hidden md:flex w-[27%] shrink-0 items-center justify-center border-l border-slate-200 bg-white h-full">
          <p className="text-sm text-slate-400">Chưa có thông tin khách hàng</p>
        </div>
      </div>
    </div>
  );
}
