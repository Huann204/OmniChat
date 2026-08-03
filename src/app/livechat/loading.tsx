import { Bell } from "lucide-react";
import { getCachedUser } from "@/lib/session";

export default async function LivechatLoading() {
  const user = await getCachedUser();

  return (
    <div className="flex h-screen flex-col bg-[rgb(80,109,173)] font-roboto">
      <header className="shrink-0">
        <div className="mx-auto flex h-14 w-[calc(100%-2rem)] max-w-[1144px] items-center gap-4 sm:w-[calc(100%-3rem)]">
          <div className="flex shrink-0 items-center gap-2 mr-6">
            {/* <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white p-1">
              eslint-disable-next-line @next/next/no-img-element
              <img src="/logo.png" alt="OmniChat Logo" className="h-full w-full object-contain" />
            </span> */}
            <span className="hidden text-lg font-bold tracking-tight text-white sm:inline">
              OmniChat
            </span>
          </div>

          <nav className="flex items-center gap-1 overflow-x-auto">
            {["Hội thoại", "Đơn hàng", "Bài viết", "Thống kê", "Cài đặt"].map((tab, i) => (
              <div
                key={tab}
                className={`shrink-0 rounded-lg px-3.5 py-2 text-sm font-medium ${i === 0 ? "bg-slate-900 text-white" : "text-white/80"
                  }`}
              >
                {tab}
              </div>
            ))}
          </nav>

          <div className="ml-auto flex shrink-0 items-center gap-2">
            <div className="flex items-center gap-2 rounded-full py-1 pl-1 pr-3">
              {user ? (
                <>
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-sm font-bold text-slate-700">
                    {user.name.charAt(0).toUpperCase()}
                  </span>
                  <span className="hidden truncate max-w-[8rem] text-sm text-white sm:inline">
                    {user.name}
                  </span>
                </>
              ) : (
                <>
                  <span className="h-8 w-8 rounded-full bg-white/20 animate-pulse" />
                  <span className="hidden h-4 w-24 rounded bg-white/20 animate-pulse sm:inline" />
                </>
              )}
            </div>
            <div className="relative flex h-9 w-9 items-center justify-center rounded-full text-white/90">
              <Bell className="h-4.5 w-4.5" />
              <span className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-red-400" />
            </div>
          </div>
        </div>
      </header>

      <div className="flex min-h-0 flex-1">
        <div className="w-14 shrink-0 border-r border-white/10" />

        <div className="flex flex-1 min-w-0 overflow-hidden rounded-tl-xl bg-white">
          <div className="flex w-[400px] shrink-0 flex-col border-r border-slate-200 animate-pulse">
            <div className="border-b border-slate-100 p-3">
              <div className="h-9 rounded-xl bg-slate-100" />
            </div>
            <div className="flex-1 space-y-1 p-2">
              {Array.from({ length: 7 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3 px-2 py-2.5">
                  <div className="h-11 w-11 shrink-0 rounded-full bg-slate-100" />
                  <div className="min-w-0 flex-1 space-y-2">
                    <div className="h-3 w-2/3 rounded bg-slate-100" />
                    <div className="h-2.5 w-4/5 rounded bg-slate-100" />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex min-w-0 flex-1 flex-col animate-pulse">
            <div className="h-16 shrink-0 border-b border-slate-100" />
            <div className="flex-1" />
            <div className="h-16 shrink-0 border-t border-slate-100" />
          </div>

          <div className="hidden w-[27%] shrink-0 border-l border-slate-200 lg:block animate-pulse" />
        </div>
      </div>
    </div>
  );
}
