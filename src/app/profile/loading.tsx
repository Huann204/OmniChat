import { Bell } from "lucide-react";
import { getCachedUser } from "@/lib/session";

export default async function ProfileLoading() {
  const user = await getCachedUser();

  return (
    <div className="flex h-screen flex-col bg-[rgb(80,109,173)] font-roboto">
      <header className="shrink-0">
        <div className="mx-auto flex h-14 w-full px-3 sm:w-[calc(100%-2rem)] max-w-[1144px] items-center gap-2 sm:gap-4 md:gap-8 sm:w-[calc(100%-3rem)]">
          <div className="flex shrink-0 items-center gap-2 mr-1 sm:mr-4 md:mr-6">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/hchat.png" alt="Hchat Logo" className="h-8 sm:h-10 w-auto object-contain" />
          </div>

          <nav className="flex items-center gap-1 overflow-x-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
            {["Hội thoại", "Đơn hàng", "Bài viết", "Thống kê", "Cài đặt"].map((tab) => (
              <div key={tab} className="shrink-0 rounded-lg px-2.5 sm:px-3.5 py-1.5 sm:py-2 text-xs sm:text-sm font-normal text-white">
                {tab}
              </div>
            ))}
          </nav>

          <div className="ml-auto flex shrink-0 items-center gap-1 sm:gap-2">
            <div className="flex items-center rounded-full p-1">
              {user ? (
                <span className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-full bg-white text-sm font-bold text-slate-700">
                  {user.avatarUrl ? (
                    <img src={user.avatarUrl} alt="" className="h-full w-full object-cover" />
                  ) : (
                    user.name.charAt(0).toUpperCase()
                  )}
                </span>
              ) : (
                <span className="h-8 w-8 rounded-full bg-white/20 animate-pulse" />
              )}
            </div>
            <div className="relative flex h-9 w-9 items-center justify-center rounded-full text-white/90">
              <Bell className="h-4.5 w-4.5" />
              <span className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-red-400" />
            </div>
          </div>
        </div>
      </header>

      <main className="w-full flex-1 min-h-0 overflow-y-auto bg-slate-100 pt-6 pb-6 shadow-2xl relative">
        <div className="mx-auto w-[calc(100%-2rem)] max-w-2xl space-y-4 pb-6 sm:w-[calc(100%-3rem)] animate-pulse">
          <div className="h-5 w-36 rounded bg-white/40" />

          <div className="rounded-2xl border border-slate-200/70 bg-white p-5 shadow-[8px]">
            <div className="mb-4 h-4 w-32 rounded bg-slate-100" />
            <div className="mb-5 flex items-center gap-4">
              <div className="h-16 w-16 shrink-0 rounded-full bg-slate-100" />
              <div className="space-y-2">
                <div className="h-3 w-32 rounded bg-slate-100" />
                <div className="h-2.5 w-40 rounded bg-slate-100" />
              </div>
            </div>
            <div className="space-y-3">
              <div className="h-10 rounded-xl bg-slate-100" />
              <div className="h-10 rounded-xl bg-slate-100" />
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200/70 bg-white p-5 shadow-[8px]">
            <div className="mb-4 h-4 w-28 rounded bg-slate-100" />
            <div className="space-y-3">
              <div className="h-10 rounded-xl bg-slate-100" />
              <div className="h-10 rounded-xl bg-slate-100" />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
