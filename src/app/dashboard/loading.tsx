import { Bell } from "lucide-react";
import { getCachedUser } from "@/lib/session";

export default async function DashboardLoading() {
  const user = await getCachedUser();

  return (
    <div className="min-h-screen bg-[rgb(80,109,173)] font-roboto flex flex-col">
      <header className="bg-[rgb(80,109,173)]">
        <div className="mx-auto flex h-14 w-[calc(100%-2rem)] max-w-[1144px] items-center sm:w-[calc(100%-3rem)]">
          <img src="/hchat.png" alt="Hchat Logo" className="h-10 w-auto object-contain" />

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

      <main className="w-full flex-1 bg-slate-100 pt-6 pb-12 shadow-2xl relative">
        <div className="mx-auto w-[calc(100%-2rem)] sm:w-[calc(100%-3rem)] max-w-[1144px] space-y-2 animate-pulse">
          <div className="rounded-2xl border border-slate-200/70 bg-white p-4 shadow-[8px] md:p-5">
            <div className="mb-4 h-4 w-40 rounded bg-slate-100" />
            <div className="h-10 rounded-xl bg-slate-100" />
          </div>

          <div className="rounded-2xl border border-slate-200/70 bg-white px-4 py-3 shadow-[8px]">
            <div className="h-6 w-64 rounded bg-slate-100" />
          </div>

          <div className="rounded-2xl border border-slate-200/70 bg-white p-4 shadow-[8px] md:p-5 min-h-[calc(100vh-320px)]">
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div
                  key={i}
                  className="flex w-full items-center gap-3 rounded-xl border border-slate-200 bg-white p-2 h-[84px]"
                >
                  <div className="h-16 w-16 shrink-0 rounded-xl bg-slate-100" />
                  <div className="min-w-0 flex-1 space-y-2">
                    <div className="h-3 w-2/3 rounded bg-slate-100" />
                    <div className="h-2.5 w-1/2 rounded bg-slate-100" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
